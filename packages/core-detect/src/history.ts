import type { Detection, RedactionAction, ApplyOptions, AnalyzeOptions } from './types';

export interface ProcessingSession {
  id: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  presetId?: string;
  presetName?: string;
  options?: {
    analyze?: AnalyzeOptions;
    apply?: ApplyOptions;
  };
}

export interface FileProcessingRecord {
  id: string;
  sessionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  timestamp: string;
  processingTime: number;
  status: 'analyzing' | 'applying' | 'completed' | 'failed';
  error?: string;
  
  // Analysis results
  detections?: Detection[];
  detectionCounts: Record<string, number>;
  totalDetections: number;
  averageConfidence: number;
  
  // Redaction results
  appliedRedactions?: RedactionAction[];
  redactionStats: {
    total: number;
    byType: Record<string, number>;
    byStyle: Record<string, number>;
  };
  
  // Performance metrics
  ocrTime?: number;
  detectionTime?: number;
  redactionTime?: number;
  outputSize?: number;
  
  // Quality metrics
  confidenceDistribution: {
    low: number;    // 0-0.5
    medium: number; // 0.5-0.8
    high: number;   // 0.8-1.0
  };
}

export interface ProcessingStats {
  totalSessions: number;
  totalFiles: number;
  totalDetections: number;
  averageProcessingTime: number;
  successRate: number;
  
  // Detection statistics
  detectionsByType: Record<string, number>;
  detectionsByConfidence: {
    low: number;
    medium: number;
    high: number;
  };
  
  // Redaction statistics
  redactionsByStyle: Record<string, number>;
  
  // Performance trends
  processingTimesByDate: Array<{
    date: string;
    averageTime: number;
    fileCount: number;
  }>;
  
  // Preset usage
  presetUsage: Record<string, number>;
}

export interface HistoryExportOptions {
  format: 'json' | 'csv';
  dateRange?: {
    start: string;
    end: string;
  };
  includeFileDetails?: boolean;
  includeDetectionDetails?: boolean;
}

// Local storage keys
const SESSIONS_KEY = 'cleanshare_processing_sessions';
const RECORDS_KEY = 'cleanshare_file_records';

// In-memory storage for current session
let sessions: ProcessingSession[] = [];
let records: FileProcessingRecord[] = [];
let currentSession: ProcessingSession | null = null;

// Load data from localStorage on startup
try {
  if (typeof localStorage !== 'undefined') {
    const storedSessions = localStorage.getItem(SESSIONS_KEY);
    const storedRecords = localStorage.getItem(RECORDS_KEY);
    
    if (storedSessions) {
      sessions = JSON.parse(storedSessions);
    }
    if (storedRecords) {
      records = JSON.parse(storedRecords);
    }
  }
} catch (error) {
  console.warn('Failed to load processing history from localStorage:', error);
}

// Save to localStorage
function saveToStorage(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    }
  } catch (error) {
    console.warn('Failed to save processing history to localStorage:', error);
  }
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate statistics from detections
function calculateDetectionStats(detections: Detection[]): {
  counts: Record<string, number>;
  total: number;
  averageConfidence: number;
  confidenceDistribution: { low: number; medium: number; high: number };
} {
  const counts: Record<string, number> = {};
  let totalConfidence = 0;
  const confidenceDistribution = { low: 0, medium: 0, high: 0 };
  
  detections.forEach(detection => {
    counts[detection.kind] = (counts[detection.kind] || 0) + 1;
    totalConfidence += detection.confidence;
    
    if (detection.confidence < 0.5) {
      confidenceDistribution.low++;
    } else if (detection.confidence < 0.8) {
      confidenceDistribution.medium++;
    } else {
      confidenceDistribution.high++;
    }
  });
  
  return {
    counts,
    total: detections.length,
    averageConfidence: detections.length > 0 ? totalConfidence / detections.length : 0,
    confidenceDistribution
  };
}

// Calculate redaction statistics
function calculateRedactionStats(actions: RedactionAction[]): {
  total: number;
  byType: Record<string, number>;
  byStyle: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  const byStyle: Record<string, number> = {};
  
  actions.forEach(action => {
    byStyle[action.style] = (byStyle[action.style] || 0) + 1;
  });
  
  return {
    total: actions.length,
    byType, // Will be populated when we have detection kind mapping
    byStyle
  };
}

/** Start a new processing session */
export function startSession(options: {
  totalFiles: number;
  presetId?: string;
  presetName?: string;
  analyzeOptions?: AnalyzeOptions;
  applyOptions?: ApplyOptions;
}): string {
  const sessionId = generateId();
  
  currentSession = {
    id: sessionId,
    startTime: new Date().toISOString(),
    status: 'running',
    totalFiles: options.totalFiles,
    processedFiles: 0,
    failedFiles: 0,
    presetId: options.presetId,
    presetName: options.presetName,
    options: {
      analyze: options.analyzeOptions,
      apply: options.applyOptions
    }
  };
  
  sessions.push(currentSession);
  saveToStorage();
  
  return sessionId;
}

/** End the current processing session */
export function endSession(sessionId: string, status: 'completed' | 'failed' = 'completed'): void {
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    session.endTime = new Date().toISOString();
    session.status = status;
    
    if (currentSession?.id === sessionId) {
      currentSession = null;
    }
    
    saveToStorage();
  }
}

/** Record the start of file processing */
export function startFileProcessing(options: {
  sessionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}): string {
  const recordId = generateId();
  
  const record: FileProcessingRecord = {
    id: recordId,
    sessionId: options.sessionId,
    fileName: options.fileName,
    fileSize: options.fileSize,
    fileType: options.fileType,
    timestamp: new Date().toISOString(),
    processingTime: 0,
    status: 'analyzing',
    detectionCounts: {},
    totalDetections: 0,
    averageConfidence: 0,
    redactionStats: {
      total: 0,
      byType: {},
      byStyle: {}
    },
    confidenceDistribution: { low: 0, medium: 0, high: 0 }
  };
  
  records.push(record);
  saveToStorage();
  
  return recordId;
}

/** Update file processing record with analysis results */
export function recordAnalysisResults(recordId: string, options: {
  detections: Detection[];
  ocrTime?: number;
  detectionTime?: number;
  error?: string;
}): void {
  const record = records.find(r => r.id === recordId);
  if (!record) return;
  
  if (options.error) {
    record.status = 'failed';
    record.error = options.error;
    
    // Update session failed count
    const session = sessions.find(s => s.id === record.sessionId);
    if (session) {
      session.failedFiles++;
    }
  } else {
    record.status = 'applying';
    record.detections = options.detections;
    
    const stats = calculateDetectionStats(options.detections);
    record.detectionCounts = stats.counts;
    record.totalDetections = stats.total;
    record.averageConfidence = stats.averageConfidence;
    record.confidenceDistribution = stats.confidenceDistribution;
    
    record.ocrTime = options.ocrTime;
    record.detectionTime = options.detectionTime;
  }
  
  saveToStorage();
}

/** Update file processing record with redaction results */
export function recordRedactionResults(recordId: string, options: {
  appliedRedactions: RedactionAction[];
  redactionTime?: number;
  outputSize?: number;
  error?: string;
}): void {
  const record = records.find(r => r.id === recordId);
  if (!record) return;
  
  const startTime = new Date(record.timestamp).getTime();
  record.processingTime = Date.now() - startTime;
  
  if (options.error) {
    record.status = 'failed';
    record.error = options.error;
    
    // Update session failed count
    const session = sessions.find(s => s.id === record.sessionId);
    if (session) {
      session.failedFiles++;
    }
  } else {
    record.status = 'completed';
    record.appliedRedactions = options.appliedRedactions;
    record.redactionStats = calculateRedactionStats(options.appliedRedactions);
    record.redactionTime = options.redactionTime;
    record.outputSize = options.outputSize;
    
    // Update session processed count
    const session = sessions.find(s => s.id === record.sessionId);
    if (session) {
      session.processedFiles++;
    }
  }
  
  saveToStorage();
}

/** Get all processing sessions */
export function getSessions(): ProcessingSession[] {
  return sessions.slice().reverse(); // Most recent first
}

/** Get session by ID */
export function getSession(sessionId: string): ProcessingSession | undefined {
  return sessions.find(s => s.id === sessionId);
}

/** Get file records for a session */
export function getSessionRecords(sessionId: string): FileProcessingRecord[] {
  return records.filter(r => r.sessionId === sessionId);
}

/** Get all file records */
export function getAllRecords(): FileProcessingRecord[] {
  return records.slice().reverse(); // Most recent first
}

/** Get processing statistics */
export function getProcessingStats(dateRange?: { start: string; end: string }): ProcessingStats {
  let filteredRecords = records;
  
  if (dateRange) {
    filteredRecords = records.filter(r => {
      const timestamp = new Date(r.timestamp);
      return timestamp >= new Date(dateRange.start) && timestamp <= new Date(dateRange.end);
    });
  }
  
  const completedRecords = filteredRecords.filter(r => r.status === 'completed');
  const totalDetections = completedRecords.reduce((sum, r) => sum + r.totalDetections, 0);
  const totalProcessingTime = completedRecords.reduce((sum, r) => sum + r.processingTime, 0);
  
  // Calculate detection statistics
  const detectionsByType: Record<string, number> = {};
  const detectionsByConfidence = { low: 0, medium: 0, high: 0 };
  const redactionsByStyle: Record<string, number> = {};
  const presetUsage: Record<string, number> = {};
  
  completedRecords.forEach(record => {
    // Detection counts by type
    Object.entries(record.detectionCounts).forEach(([type, count]) => {
      detectionsByType[type] = (detectionsByType[type] || 0) + count;
    });
    
    // Confidence distribution
    detectionsByConfidence.low += record.confidenceDistribution.low;
    detectionsByConfidence.medium += record.confidenceDistribution.medium;
    detectionsByConfidence.high += record.confidenceDistribution.high;
    
    // Redaction styles
    Object.entries(record.redactionStats.byStyle).forEach(([style, count]) => {
      redactionsByStyle[style] = (redactionsByStyle[style] || 0) + count;
    });
    
    // Preset usage
    const session = sessions.find(s => s.id === record.sessionId);
    if (session?.presetName) {
      presetUsage[session.presetName] = (presetUsage[session.presetName] || 0) + 1;
    }
  });
  
  // Processing times by date
  const timesByDate = new Map<string, { total: number; count: number }>();
  completedRecords.forEach(record => {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    const existing = timesByDate.get(date) || { total: 0, count: 0 };
    timesByDate.set(date, {
      total: existing.total + record.processingTime,
      count: existing.count + 1
    });
  });
  
  const processingTimesByDate = Array.from(timesByDate.entries()).map(([date, { total, count }]) => ({
    date,
    averageTime: total / count,
    fileCount: count
  })).sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalSessions: sessions.length,
    totalFiles: filteredRecords.length,
    totalDetections,
    averageProcessingTime: completedRecords.length > 0 ? totalProcessingTime / completedRecords.length : 0,
    successRate: filteredRecords.length > 0 ? completedRecords.length / filteredRecords.length : 0,
    detectionsByType,
    detectionsByConfidence,
    redactionsByStyle,
    processingTimesByDate,
    presetUsage
  };
}

/** Clear processing history */
export function clearHistory(): void {
  sessions = [];
  records = [];
  currentSession = null;
  saveToStorage();
}

/** Export processing history */
export function exportHistory(options: HistoryExportOptions = { format: 'json' }): string {
  let data: any;
  
  if (options.format === 'json') {
    data = {
      sessions: getSessions(),
      records: getAllRecords(),
      stats: getProcessingStats(options.dateRange),
      exportedAt: new Date().toISOString()
    };
    
    if (!options.includeFileDetails) {
      delete data.records;
    }
    
    if (!options.includeDetectionDetails) {
      data.records?.forEach((record: any) => {
        delete record.detections;
        delete record.appliedRedactions;
      });
    }
    
    return JSON.stringify(data, null, 2);
  } else {
    // CSV format - flatten records for easy analysis
    const headers = [
      'Session ID',
      'File Name',
      'File Size',
      'File Type', 
      'Timestamp',
      'Processing Time (ms)',
      'Status',
      'Total Detections',
      'Average Confidence',
      'High Confidence Count',
      'Medium Confidence Count',
      'Low Confidence Count',
      'Total Redactions',
      'Preset Name',
      'Error'
    ];
    
    const rows = getAllRecords().map(record => {
      const session = sessions.find(s => s.id === record.sessionId);
      return [
        record.sessionId,
        record.fileName,
        record.fileSize,
        record.fileType,
        record.timestamp,
        record.processingTime,
        record.status,
        record.totalDetections,
        record.averageConfidence.toFixed(3),
        record.confidenceDistribution.high,
        record.confidenceDistribution.medium,
        record.confidenceDistribution.low,
        record.redactionStats.total,
        session?.presetName || '',
        record.error || ''
      ];
    });
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }
}

/** Get current active session */
export function getCurrentSession(): ProcessingSession | null {
  return currentSession;
}