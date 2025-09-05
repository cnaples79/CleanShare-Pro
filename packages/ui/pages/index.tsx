// CleanShare Pro - Modern UI Implementation
import React, { useState, useEffect } from 'react';
import type {
  Detection,
  RedactionAction,
  RedactionStyle,
  Preset,
  DetectionKind
} from '@cleanshare/core-detect';
import { analyzeDocument, applyRedactions, startSession, endSession, startFileProcessing, recordAnalysisResults, recordRedactionResults } from '@cleanshare/core-detect';
import PresetManager from '../src/components/PresetManager';
import HistoryDashboard from '../src/components/HistoryDashboard';
import UndoRedoManager, { UndoRedoControls } from '../src/components/UndoRedoManager';
import KeyboardShortcutsHelp from '../src/components/KeyboardShortcutsHelp';
import { useUndoRedo } from '../src/hooks/useUndoRedo';

interface FileState {
  file: File;
  detections: Detection[];
  selected: Record<string, boolean>;
  actions: Record<string, { style: RedactionStyle; labelText?: string }>;
  pages: number;
  pageImages: string[];
  currentPage: number;
  outputUri?: string;
  previewUri?: string; // Preview of sanitized file
  processing?: boolean;
  error?: string;
}

export default function CleanSharePro() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetId, setPresetId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [proUnlocked, setProUnlocked] = useState(false);
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [showHistoryDashboard, setShowHistoryDashboard] = useState(false);
  const [showUndoRedoManager, setShowUndoRedoManager] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [fileProcessingRecords, setFileProcessingRecords] = useState<Map<number, string>>(new Map());

  // Undo/Redo system for file states
  const undoRedoSystem = useUndoRedo<FileState[]>([], { maxHistorySize: 100 });
  
  // Sync file states with undo/redo system
  const updateFileStates = (newStates: FileState[], actionType?: string, description?: string) => {
    if (actionType && description) {
      const oldStates = fileStates;
      undoRedoSystem.execute(
        actionType,
        description,
        () => {
          setFileStates(oldStates);
          return oldStates;
        },
        () => {
          setFileStates(newStates);
          return newStates;
        }
      );
    } else {
      setFileStates(newStates);
    }
  };

  // Load presets on mount and when preset manager updates
  const loadPresets = () => {
    // Import listPresets dynamically to avoid SSR issues
    import('@cleanshare/core-detect').then(({ listPresets }) => {
      const ps = listPresets();
      setPresets(ps);
      if (ps.length > 0 && !presetId) {
        setPresetId(ps[0].id);
      }
    });
  };

  useEffect(() => {
    loadPresets();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoRedoSystem.undo();
      } else if ((isCtrl && e.key === 'y') || (isCtrl && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        undoRedoSystem.redo();
      } else if (isCtrl && e.key === 'o') {
        e.preventDefault();
        document.getElementById('file-input')?.click();
      } else if (e.key === 'Escape') {
        // Close any open modals
        setShowPresetEditor(false);
        setShowHistoryDashboard(false);
        setShowUndoRedoManager(false);
        setShowKeyboardHelp(false);
      } else if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [undoRedoSystem]);

  // Process files when they change
  useEffect(() => {
    if (files.length === 0) return;
    
    async function processFiles() {
      setLoading(true);
      const newStates: FileState[] = [];
      
      // Start processing session
      const currentPreset = presets.find(p => p.id === presetId);
      const sessionId = startSession({
        totalFiles: files.length,
        presetId,
        presetName: currentPreset?.name,
        analyzeOptions: { presetId }
      });
      setCurrentSessionId(sessionId);
      
      const processingRecords = new Map<number, string>();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const startTime = Date.now();
        
        // Start tracking this file
        const recordId = startFileProcessing({
          sessionId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        processingRecords.set(i, recordId);
        
        try {
          const result = await analyzeDocument(file, { presetId });
          const analysisTime = Date.now() - startTime;
          
          // Record analysis results
          recordAnalysisResults(recordId, {
            detections: result.detections,
            detectionTime: analysisTime
          });
          
          const selected: Record<string, boolean> = {};
          const actions: Record<string, { style: RedactionStyle; labelText?: string }> = {};
          
          result.detections.forEach(det => {
            selected[det.id] = true;
            actions[det.id] = { style: 'BOX' };
          });

          newStates.push({
            file,
            detections: result.detections,
            selected,
            actions,
            pages: result.pages || 1,
            pageImages: [],
            currentPage: 0,
            processing: false
          });
        } catch (error) {
          console.error('Failed to process file:', file.name, error);
          
          // Record analysis error
          recordAnalysisResults(recordId, {
            detections: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Add the file with error state
          newStates.push({
            file,
            detections: [],
            selected: {},
            actions: {},
            pages: 1,
            pageImages: [],
            currentPage: 0,
            processing: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      setFileStates(newStates);
      setFileProcessingRecords(processingRecords);
      setLoading(false);
      
      // End the session
      endSession(sessionId, 'completed');
    }
    
    processFiles();
  }, [files, presetId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setCurrentFileIndex(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    setCurrentFileIndex(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSanitize = async (fileIndex: number) => {
    const fileState = fileStates[fileIndex];
    if (!fileState) return;

    // Update processing state
    setFileStates(prev => prev.map((state, i) => 
      i === fileIndex ? { ...state, processing: true } : state
    ));

    const redactionStartTime = Date.now();
    const recordId = fileProcessingRecords.get(fileIndex);

    try {
      // Re-analyze the file to ensure lastResult is set correctly  
      await analyzeDocument(fileState.file, { presetId });
      
      const redactionActions: RedactionAction[] = fileState.detections
        .filter(det => fileState.selected[det.id])
        .map(det => ({
          detectionId: det.id,
          style: fileState.actions[det.id]?.style || 'BOX',
          labelText: fileState.actions[det.id]?.labelText
        }));

      const result = await applyRedactions(fileState.file, redactionActions, {
        output: 'image'
      }, fileState.detections);

      // Convert data URI to blob for download
      const response = await fetch(result.fileUri);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const redactionTime = Date.now() - redactionStartTime;

      // Record redaction results
      if (recordId) {
        recordRedactionResults(recordId, {
          appliedRedactions: redactionActions,
          redactionTime,
          outputSize: blob.size
        });
      }

      // Update file state with result
      setFileStates(prev => prev.map((state, i) => 
        i === fileIndex ? { ...state, outputUri: url, previewUri: result.fileUri, processing: false } : state
      ));

    } catch (error) {
      console.error('Sanitization failed:', error);
      
      // Record redaction error
      if (recordId) {
        recordRedactionResults(recordId, {
          appliedRedactions: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Show error to user
      alert(`Sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFileStates(prev => prev.map((state, i) => 
        i === fileIndex ? { ...state, processing: false } : state
      ));
    }
  };

  const handleDownload = (fileIndex: number) => {
    const fileState = fileStates[fileIndex];
    if (!fileState?.outputUri) return;

    const link = document.createElement('a');
    link.href = fileState.outputUri;
    link.download = `sanitized_${fileState.file.name}`;
    link.click();
  };

  const handleBulkSanitize = async () => {
    const filesToProcess = fileStates
      .map((state, index) => ({ state, index }))
      .filter(({ state }) => !state.outputUri && !state.error);

    if (filesToProcess.length === 0) return;

    // Set all eligible files to processing state
    setFileStates(prev => prev.map((state, index) => {
      const shouldProcess = filesToProcess.some(({ index: processIndex }) => processIndex === index);
      return shouldProcess ? { ...state, processing: true } : state;
    }));

    try {
      // Process files with limited concurrency
      const maxConcurrency = 3;
      for (let i = 0; i < filesToProcess.length; i += maxConcurrency) {
        const batch = filesToProcess.slice(i, i + maxConcurrency);
        
        const promises = batch.map(async ({ state, index: fileIndex }) => {
          try {
            // Re-analyze the file to ensure lastResult is set correctly  
            await analyzeDocument(state.file, { presetId });
            
            const redactionActions: RedactionAction[] = state.detections
              .filter(det => state.selected[det.id])
              .map(det => ({
                detectionId: det.id,
                style: state.actions[det.id]?.style || 'BOX',
                labelText: state.actions[det.id]?.labelText
              }));

            const result = await applyRedactions(state.file, redactionActions, {
              output: 'image'
            }, state.detections);

            // Convert data URI to blob for download
            const response = await fetch(result.fileUri);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Update file state with result
            setFileStates(prev => prev.map((s, i) => 
              i === fileIndex ? { ...s, outputUri: url, previewUri: result.fileUri, processing: false } : s
            ));

          } catch (error) {
            console.error(`Sanitization failed for ${state.file.name}:`, error);
            setFileStates(prev => prev.map((s, i) => 
              i === fileIndex ? { ...s, processing: false, error: error instanceof Error ? error.message : 'Unknown error' } : s
            ));
          }
        });

        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Bulk sanitization failed:', error);
    }
  };

  const handleBulkDownload = () => {
    const processedFiles = fileStates.filter(state => state.outputUri);
    
    if (processedFiles.length === 0) return;

    // Download each file individually
    processedFiles.forEach((state, index) => {
      if (state.outputUri) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = state.outputUri!;
          link.download = `sanitized_${state.file.name}`;
          link.click();
        }, index * 100); // Stagger downloads by 100ms
      }
    });
  };

  const currentFileState = fileStates[currentFileIndex];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <a href="#" className="logo">
            CleanShare Pro
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            {presets.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <select 
                  value={presetId} 
                  onChange={(e) => setPresetId(e.target.value)}
                  className="form-select"
                  style={{ minWidth: '180px' }}
                >
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.domain && p.domain !== 'General' ? `(${p.domain})` : ''}
                    </option>
                  ))}
                </select>
                {(() => {
                  const currentPreset = presets.find(p => p.id === presetId);
                  return currentPreset?.description ? (
                    <div style={{ 
                      fontSize: 'var(--font-size-xs)', 
                      color: 'var(--text-secondary)', 
                      maxWidth: '200px',
                      lineHeight: '1.2'
                    }}>
                      {currentPreset.description}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            <button
              onClick={() => setProUnlocked(!proUnlocked)}
              className={`btn ${proUnlocked ? 'btn-secondary' : 'btn-outline'} btn-sm`}
            >
              {proUnlocked ? '✓ Pro Unlocked' : '🔓 Unlock Pro'}
            </button>
            {proUnlocked && (
              <>
                <button
                  onClick={() => setShowPresetEditor(true)}
                  className="btn btn-primary btn-sm"
                >
                  Manage Presets
                </button>
                <button
                  onClick={() => setShowHistoryDashboard(true)}
                  className="btn btn-secondary btn-sm"
                >
                  📊 History
                </button>
              </>
            )}
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="btn btn-outline btn-sm"
              title="Keyboard Shortcuts (Press ? for help)"
            >
              ⌨️
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* File Upload Section */}
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-header">
            <h2 className="card-title">Upload Files</h2>
            <p className="card-subtitle">Select images or PDF documents to sanitize</p>
          </div>
          <div className="card-body">
            <div 
              className="file-upload-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="file-upload-icon">📄</div>
              <div className="file-upload-text">
                Drop files here or click to browse
              </div>
              <div className="file-upload-subtext">
                Supports images (JPG, PNG, WebP, HEIC, TIFF), PDFs, and documents (DOCX, XLSX) up to 10MB each
              </div>
              <input
                id="file-input"
                type="file"
                accept="image/*,application/pdf,.webp,.heic,.tiff,.docx,.xlsx"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            
            {loading && (
              <div className="loading-text" style={{ marginTop: 'var(--space-md)' }}>
                <div className="loading-spinner"></div>
                Processing files...
              </div>
            )}
          </div>
        </div>

        {/* File Processing Results */}
        {fileStates.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-xl)' }}>
            {/* File List Sidebar */}
            <div className="sidebar" style={{ minWidth: '250px' }}>
              <h3 className="sidebar-title">Files ({fileStates.length})</h3>
              
              {/* Bulk Processing Controls */}
              {fileStates.length > 1 && (
                <div style={{ 
                  padding: 'var(--space-md)', 
                  marginBottom: 'var(--space-md)', 
                  border: '2px solid var(--color-primary)', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'var(--bg-secondary)' 
                }}>
                  <h4 style={{ margin: '0 0 var(--space-sm) 0', fontSize: 'var(--font-size-sm)', fontWeight: '600' }}>
                    🚀 Bulk Processing
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    <button
                      onClick={handleBulkSanitize}
                      className="btn btn-primary btn-sm"
                      disabled={fileStates.some(s => s.processing) || fileStates.every(s => s.outputUri)}
                      style={{ width: '100%' }}
                    >
                      {fileStates.some(s => s.processing) 
                        ? 'Processing...' 
                        : fileStates.every(s => s.outputUri) 
                          ? 'All Complete' 
                          : `Sanitize All (${fileStates.filter(s => !s.outputUri && !s.error).length})`
                      }
                    </button>
                    {fileStates.some(s => s.outputUri) && (
                      <button
                        onClick={handleBulkDownload}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%' }}
                      >
                        📦 Download All ({fileStates.filter(s => s.outputUri).length})
                      </button>
                    )}
                  </div>
                  <div style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Concurrent processing with progress tracking
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {fileStates.map((state, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentFileIndex(index)}
                    style={{
                      padding: 'var(--space-md)',
                      border: `2px solid ${index === currentFileIndex ? 'var(--color-primary)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: index === currentFileIndex ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-xs)' }}>
                      {state.file.name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: state.error ? 'var(--color-error)' : 'var(--text-secondary)' }}>
                      {state.error ? `Error: ${state.error}` : `${state.detections.length} detections found`}
                    </div>
                    <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-xs)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSanitize(index);
                        }}
                        className="btn btn-primary btn-sm"
                        disabled={state.processing || !!state.error}
                        style={{ flex: 1 }}
                      >
                        {state.processing ? 'Processing...' : 'Sanitize'}
                      </button>
                      {state.outputUri && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(index);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1 }}>
              {currentFileState && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">{currentFileState.file.name}</h3>
                    <p className="card-subtitle">
                      {currentFileState.error ? 'Processing failed' : `Found ${currentFileState.detections.length} sensitive items`}
                    </p>
                  </div>
                  <div className="card-body">
                    {currentFileState.error ? (
                      <div className="alert alert-error">
                        <div>
                          <strong>Processing Error</strong>
                          <p style={{ margin: '0', marginTop: 'var(--space-xs)' }}>
                            Failed to analyze this file: {currentFileState.error}
                          </p>
                        </div>
                      </div>
                    ) : currentFileState.detections.length > 0 ? (
                      <div>
                        <h4 style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--font-size-lg)' }}>
                          Detected Sensitive Information
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                          {currentFileState.detections.map(detection => (
                            <div
                              key={detection.id}
                              style={{
                                padding: 'var(--space-md)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <input
                                  type="checkbox"
                                  checked={currentFileState.selected[detection.id] || false}
                                  onChange={(e) => {
                                    const newStates = fileStates.map((state, i) => 
                                      i === currentFileIndex ? {
                                        ...state,
                                        selected: {
                                          ...state.selected,
                                          [detection.id]: e.target.checked
                                        }
                                      } : state
                                    );
                                    updateFileStates(
                                      newStates,
                                      'toggle-detection',
                                      `${e.target.checked ? 'Selected' : 'Deselected'} ${detection.kind} detection`
                                    );
                                  }}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>
                                    {detection.kind}: {detection.preview || 'N/A'}
                                  </div>
                                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                    Confidence: {Math.round(detection.confidence * 100)}%
                                  </div>
                                </div>
                              </div>
                              <select
                                value={currentFileState.actions[detection.id]?.style || 'BOX'}
                                onChange={(e) => {
                                  const newStates = fileStates.map((state, i) => 
                                    i === currentFileIndex ? {
                                      ...state,
                                      actions: {
                                        ...state.actions,
                                        [detection.id]: {
                                          ...state.actions[detection.id],
                                          style: e.target.value as RedactionStyle
                                        }
                                      }
                                    } : state
                                  );
                                  updateFileStates(
                                    newStates,
                                    'change-redaction-style',
                                    `Changed ${detection.kind} redaction style to ${e.target.value}`
                                  );
                                }}
                                className="form-select"
                                style={{ minWidth: '120px' }}
                              >
                                <option value="BOX">Black Box</option>
                                <option value="BLUR">Blur</option>
                                <option value="PIXELATE">Pixelate</option>
                                <option value="LABEL">Label</option>
                              </select>
                            </div>
                          ))}
                        </div>
                        
                        <div className="card-footer" style={{ marginTop: 'var(--space-xl)' }}>
                          <button
                            onClick={() => handleSanitize(currentFileIndex)}
                            className="btn btn-primary btn-lg"
                            disabled={currentFileState.processing}
                          >
                            {currentFileState.processing ? (
                              <>
                                <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }}></div>
                                Processing...
                              </>
                            ) : (
                              <>🔒 Sanitize Document</>
                            )}
                          </button>
                          {currentFileState.outputUri && (
                            <button
                              onClick={() => handleDownload(currentFileIndex)}
                              className="btn btn-secondary btn-lg"
                            >
                              📥 Download Clean File
                            </button>
                          )}
                        </div>
                        
                        {/* Preview of sanitized file */}
                        {currentFileState.previewUri && (
                          <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>
                              🔒 Sanitized Preview
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                              {currentFileState.file.type.startsWith('image/') ? (
                                <img
                                  src={currentFileState.previewUri}
                                  alt="Sanitized preview"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '400px',
                                    borderRadius: 'var(--radius-sm)',
                                    boxShadow: 'var(--shadow-md)'
                                  }}
                                />
                              ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                                  <div style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-md)' }}>📄</div>
                                  <p>PDF sanitized successfully</p>
                                  <p style={{ fontSize: 'var(--font-size-sm)' }}>Click download to save the clean file</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="alert alert-success">
                        <div>
                          <strong>No sensitive information detected!</strong>
                          <p style={{ margin: '0', marginTop: 'var(--space-xs)' }}>
                            This document appears to be clean and safe to share.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Preset Management Modal */}
        <PresetManager
          isOpen={showPresetEditor && proUnlocked}
          onClose={() => setShowPresetEditor(false)}
          currentPresetId={presetId}
          onPresetSelect={(id) => {
            setPresetId(id);
            loadPresets(); // Refresh presets list in case new ones were created
            setShowPresetEditor(false);
          }}
        />

        {/* Processing History Dashboard */}
        <HistoryDashboard
          isOpen={showHistoryDashboard && proUnlocked}
          onClose={() => setShowHistoryDashboard(false)}
        />

        {/* Undo/Redo Manager */}
        <UndoRedoManager
          isOpen={showUndoRedoManager}
          onClose={() => setShowUndoRedoManager(false)}
          onUndo={() => undoRedoSystem.undo()}
          onRedo={() => undoRedoSystem.redo()}
          canUndo={undoRedoSystem.canUndo}
          canRedo={undoRedoSystem.canRedo}
          historyPreview={undoRedoSystem.getHistoryPreview(20)}
          onJumpTo={(index) => undoRedoSystem.jumpToIndex(index)}
        />

        {/* Floating Undo/Redo Controls */}
        {fileStates.length > 0 && (
          <UndoRedoControls
            onUndo={() => undoRedoSystem.undo()}
            onRedo={() => undoRedoSystem.redo()}
            canUndo={undoRedoSystem.canUndo}
            canRedo={undoRedoSystem.canRedo}
            onOpenHistory={() => setShowUndoRedoManager(true)}
          />
        )}

        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp
          isOpen={showKeyboardHelp}
          onClose={() => setShowKeyboardHelp(false)}
        />
      </div>
    </div>
  );
}