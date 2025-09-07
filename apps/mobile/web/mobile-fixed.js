// Fixed mobile app - properly handle React components and hooks
console.log('=== 🚀 FIXED MOBILE APP WITH PRESET MANAGER - V2 ===');

let isAppInitialized = false;

// ===== MOBILE PRESET MANAGER IMPLEMENTATION =====
// Complete Phase 2.4 feature parity with web version

const DETECTION_KINDS = [
  'FACE', 'EMAIL', 'PHONE', 'PAN', 'IBAN', 'SSN', 'PASSPORT', 
  'JWT', 'API_KEY', 'BARCODE', 'NAME', 'ADDRESS', 'OTHER'
];

const REDACTION_STYLES = [
  'BOX', 'BLUR', 'PIXELATE', 'LABEL', 'MASK_LAST4', 'PATTERN', 
  'GRADIENT', 'SOLID_COLOR', 'VECTOR_OVERLAY', 'REMOVE_METADATA'
];

const DOMAINS = ['Healthcare', 'Finance', 'Legal', 'Government', 'Education', 'Technology', 'General'];

// Built-in presets for mobile (simulating core-detect functionality)
const MOBILE_BUILTIN_PRESETS = [
  {
    id: 'all',
    name: 'All Detectors',
    description: 'Detect all types of sensitive information',
    domain: 'General',
    enabledKinds: DETECTION_KINDS,
    styleMap: {},
    customRegex: [],
    customPatterns: [],
    defaultRedactionConfig: { color: '#000000', opacity: 0.9 },
    confidenceThreshold: 0.6,
    isUserCreated: false
  },
  {
    id: 'healthcare',
    name: 'Healthcare HIPAA',
    description: 'HIPAA-compliant detection for healthcare documents',
    domain: 'Healthcare',
    enabledKinds: ['EMAIL', 'PHONE', 'SSN', 'NAME', 'ADDRESS'],
    styleMap: { 'SSN': 'MASK_LAST4', 'EMAIL': 'BLUR', 'PHONE': 'BOX' },
    customRegex: [],
    customPatterns: [],
    defaultRedactionConfig: { color: '#dc2626', opacity: 0.8 },
    confidenceThreshold: 0.8,
    isUserCreated: false
  },
  {
    id: 'finance',
    name: 'Financial PCI-DSS',
    description: 'PCI-DSS compliant for financial documents',
    domain: 'Finance',
    enabledKinds: ['PAN', 'IBAN', 'SSN', 'EMAIL', 'PHONE'],
    styleMap: { 'PAN': 'MASK_LAST4', 'IBAN': 'BOX', 'SSN': 'SOLID_COLOR' },
    customRegex: [],
    customPatterns: [],
    defaultRedactionConfig: { color: '#059669', opacity: 0.9 },
    confidenceThreshold: 0.9,
    isUserCreated: false
  },
  {
    id: 'legal',
    name: 'Legal Document',
    description: 'Legal document processing with attorney-client privilege protection',
    domain: 'Legal',
    enabledKinds: ['EMAIL', 'PHONE', 'ADDRESS', 'NAME', 'SSN'],
    styleMap: { 'EMAIL': 'LABEL', 'PHONE': 'LABEL', 'NAME': 'BLUR' },
    customRegex: [],
    customPatterns: [],
    defaultRedactionConfig: { color: '#7c3aed', opacity: 0.85 },
    confidenceThreshold: 0.7,
    isUserCreated: false
  }
];

// Mobile preset storage (using localStorage)
function getMobilePresets() {
  const userPresets = JSON.parse(localStorage.getItem('cleanshare_user_presets') || '[]');
  return [...MOBILE_BUILTIN_PRESETS, ...userPresets];
}

function saveMobilePreset(preset) {
  if (!preset.isUserCreated) {
    throw new Error('Cannot modify built-in presets');
  }
  
  const userPresets = JSON.parse(localStorage.getItem('cleanshare_user_presets') || '[]');
  const existingIndex = userPresets.findIndex(p => p.id === preset.id);
  
  if (existingIndex >= 0) {
    userPresets[existingIndex] = preset;
  } else {
    preset.id = preset.id || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    preset.isUserCreated = true;
    userPresets.push(preset);
  }
  
  localStorage.setItem('cleanshare_user_presets', JSON.stringify(userPresets));
}

function deleteMobilePreset(presetId) {
  if (MOBILE_BUILTIN_PRESETS.find(p => p.id === presetId)) {
    return false; // Cannot delete built-in presets
  }
  
  const userPresets = JSON.parse(localStorage.getItem('cleanshare_user_presets') || '[]');
  const filteredPresets = userPresets.filter(p => p.id !== presetId);
  localStorage.setItem('cleanshare_user_presets', JSON.stringify(filteredPresets));
  return true;
}

function duplicateMobilePreset(presetId) {
  const presets = getMobilePresets();
  const original = presets.find(p => p.id === presetId);
  if (!original) return null;
  
  const duplicate = {
    ...original,
    id: 'copy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: original.name + ' (Copy)',
    isUserCreated: true
  };
  
  saveMobilePreset(duplicate);
  return duplicate;
}


// Mobile Toast Notification System (removed to keep UI purely React)
// Preset API aligned with web (localStorage-backed)
const USER_PRESETS_KEY = 'cleanshare_user_presets';
function listBuiltinPresets() { return MOBILE_BUILTIN_PRESETS.slice(); }
function listUserPresets() { return JSON.parse(localStorage.getItem(USER_PRESETS_KEY) || '[]'); }
function listPresets() { return [...listBuiltinPresets(), ...listUserPresets()]; }
function listPresetsByDomain(domain) { return listPresets().filter(p => p.domain === domain); }
function getPreset(id) { return listPresets().find(p => p.id === id); }
function savePreset(preset) { return saveMobilePreset({ ...preset, isUserCreated: true, updatedAt: new Date().toISOString(), createdAt: preset.createdAt || new Date().toISOString() }); }
function createPreset(name, options = {}) {
  const preset = {
    id: 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name,
    description: options.description || '',
    domain: options.domain || 'General',
    enabledKinds: options.enabledKinds || [],
    styleMap: options.styleMap || {},
    customRegex: options.customRegex || [],
    customPatterns: options.customPatterns || [],
    defaultRedactionConfig: options.defaultRedactionConfig || { color: '#000000', opacity: 0.9 },
    confidenceThreshold: options.confidenceThreshold || 0.6,
    isUserCreated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  saveMobilePreset(preset);
  return preset;
}
function validatePreset(preset) {
  const errors = []; const warnings = [];
  if (!preset || typeof preset !== 'object') errors.push('Preset must be an object');
  if (!preset.name || typeof preset.name !== 'string') errors.push('Preset name is required');
  if (!Array.isArray(preset.enabledKinds)) warnings.push('enabledKinds should be an array');
  if (preset.customPatterns && Array.isArray(preset.customPatterns)) {
    preset.customPatterns.forEach((pattern, i) => {
      if (!pattern.id || !pattern.name || !pattern.pattern) {
        errors.push(`Custom pattern ${i + 1} is missing required fields`);
      } else {
        try { new RegExp(pattern.pattern); } catch { errors.push(`Invalid regex in custom pattern ${i + 1}`); }
      }
    });
  }
  if (preset.confidenceThreshold != null) {
    const v = preset.confidenceThreshold; if (typeof v !== 'number' || v < 0 || v > 1) warnings.push('confidenceThreshold should be 0–1');
  }
  return { success: errors.length === 0, preset, errors, warnings };
}
function importPreset(json) {
  try {
    const data = JSON.parse(json);
    const validation = validatePreset(data);
    if (!validation.success) return validation;
    const existing = getPreset(validation.preset.id);
    if (existing) {
      validation.preset.id = 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      validation.preset.name = `${validation.preset.name} (Imported)`;
      validation.warnings.push('ID conflict: generated new ID');
    }
    saveMobilePreset({ ...validation.preset, isUserCreated: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return { ...validation, success: true };
  } catch (e) {
    return { success: false, errors: ['Invalid JSON: ' + (e.message || String(e))], warnings: [] };
  }
}
function importMultiplePresets(json) {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [{ success: false, errors: ['Expected JSON array of presets'], warnings: [] }];
    return arr.map(p => importPreset(JSON.stringify(p)));
  } catch (e) {
    return [{ success: false, errors: ['Invalid JSON: ' + (e.message || String(e))], warnings: [] }];
  }
}
function exportPreset(id, options = {}) {
  const preset = getPreset(id); if (!preset) return null;
  const data = { ...preset };
  if (!options.includeMetadata) { delete data.createdAt; delete data.updatedAt; delete data.isUserCreated; }
  return options.format === 'compact' ? JSON.stringify(data) : JSON.stringify(data, null, 2);
}
function exportAllUserPresets(options = {}) {
  const arr = listUserPresets().map(p => {
    const d = { ...p }; if (!options.includeMetadata) { delete d.createdAt; delete d.updatedAt; delete d.isUserCreated; } return d;
  });
  return options.format === 'compact' ? JSON.stringify(arr) : JSON.stringify(arr, null, 2);
}
function resetUserPresets() { localStorage.setItem(USER_PRESETS_KEY, JSON.stringify([])); }

// History API aligned with web (localStorage-backed)
const SESSIONS_KEY = 'cleanshare_processing_sessions';
const RECORDS_KEY = 'cleanshare_file_records';
function _loadArray(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function _saveArray(key, arr) { try { localStorage.setItem(key, JSON.stringify(arr)); } catch {} }
function _genId() { return `${Date.now()}_${Math.random().toString(36).substr(2,9)}`; }
function startSession(opts) {
  const sessions = _loadArray(SESSIONS_KEY);
  const session = {
    id: _genId(),
    startTime: new Date().toISOString(),
    status: 'running',
    totalFiles: opts.totalFiles || 0,
    processedFiles: 0,
    failedFiles: 0,
    presetId: opts.presetId,
    presetName: opts.presetName,
    options: { analyze: opts.analyzeOptions, apply: opts.applyOptions }
  };
  sessions.push(session); _saveArray(SESSIONS_KEY, sessions); return session.id;
}
function endSession(sessionId, status='completed') { const sessions = _loadArray(SESSIONS_KEY); const s = sessions.find(x=>x.id===sessionId); if (s){ s.endTime=new Date().toISOString(); s.status=status; _saveArray(SESSIONS_KEY,sessions);} }
function startFileProcessing(opts) {
  const records = _loadArray(RECORDS_KEY);
  const rec = {
    id: _genId(), sessionId: opts.sessionId, fileName: opts.fileName, fileSize: opts.fileSize, fileType: opts.fileType,
    timestamp: new Date().toISOString(), processingTime: 0, status: 'analyzing', error: undefined,
    detections: [], detectionCounts: {}, totalDetections: 0, averageConfidence: 0,
    appliedRedactions: [], redactionStats: { total: 0, byType: {}, byStyle: {} },
    confidenceDistribution: { low: 0, medium: 0, high: 0 }
  };
  records.push(rec); _saveArray(RECORDS_KEY, records); return rec.id;
}
function recordAnalysisResults(recordId, opts) {
  const sessions = _loadArray(SESSIONS_KEY); const records = _loadArray(RECORDS_KEY);
  const rec = records.find(r=>r.id===recordId); if (!rec) return;
  if (opts.error){ rec.status='failed'; rec.error=opts.error; const s=sessions.find(x=>x.id===rec.sessionId); if (s) s.failedFiles++; }
  else {
    rec.status='applying'; rec.detections=opts.detections||[];
    const counts={}; let totalConf=0; const dist={low:0,medium:0,high:0};
    rec.detections.forEach(d=>{ counts[d.kind]=(counts[d.kind]||0)+1; totalConf+=d.confidence||0; const c=d.confidence||0; if (c<0.5) dist.low++; else if(c<0.8) dist.medium++; else dist.high++; });
    rec.detectionCounts=counts; rec.totalDetections=rec.detections.length; rec.averageConfidence=rec.detections.length? totalConf/rec.detections.length:0; rec.confidenceDistribution=dist;
    rec.ocrTime=opts.ocrTime; rec.detectionTime=opts.detectionTime;
  }
  _saveArray(RECORDS_KEY, records); _saveArray(SESSIONS_KEY, sessions);
}
function recordRedactionResults(recordId, opts) {
  const sessions=_loadArray(SESSIONS_KEY); const records=_loadArray(RECORDS_KEY);
  const rec=records.find(r=>r.id===recordId); if (!rec) return;
  const start=new Date(rec.timestamp).getTime(); rec.processingTime=Date.now()-start;
  if (opts.error){ rec.status='failed'; rec.error=opts.error; const s=sessions.find(x=>x.id===rec.sessionId); if (s) s.failedFiles++; }
  else {
    rec.status='completed'; rec.appliedRedactions=opts.appliedRedactions||[]; rec.redactionTime=opts.redactionTime; rec.outputSize=opts.outputSize;
    const byStyle={}; rec.appliedRedactions.forEach(a=>{ byStyle[a.style]=(byStyle[a.style]||0)+1; }); rec.redactionStats={ total: rec.appliedRedactions.length, byType: {}, byStyle };
    const s=sessions.find(x=>x.id===rec.sessionId); if (s) s.processedFiles++;
  }
  _saveArray(RECORDS_KEY, records); _saveArray(SESSIONS_KEY, sessions);
}
function getSessions(){ return _loadArray(SESSIONS_KEY).slice().reverse(); }
function getAllRecords(){ return _loadArray(RECORDS_KEY).slice().reverse(); }
function getProcessingStats(){ const records=_loadArray(RECORDS_KEY); const sessions=_loadArray(SESSIONS_KEY); const completed=records.filter(r=>r.status==='completed'); const stats={ totalSessions:sessions.length, totalFiles:records.length, totalDetections:records.reduce((s,r)=>s+(r.totalDetections||0),0), averageProcessingTime:completed.length? completed.reduce((s,r)=>s+(r.processingTime||0),0)/completed.length:0, successRate:records.length? completed.length/records.length:0, detectionsByType:{}, detectionsByConfidence:{low:0,medium:0,high:0}, redactionsByStyle:{}, processingTimesByDate:[], presetUsage:{} };
  records.forEach(r=>{ Object.entries(r.detectionCounts||{}).forEach(([k,v])=>{ stats.detectionsByType[k]=(stats.detectionsByType[k]||0)+v; }); const c=r.confidenceDistribution||{low:0,medium:0,high:0}; stats.detectionsByConfidence.low+=c.low; stats.detectionsByConfidence.medium+=c.medium; stats.detectionsByConfidence.high+=c.high; Object.entries((r.redactionStats&&r.redactionStats.byStyle)||{}).forEach(([k,v])=>{ stats.redactionsByStyle[k]=(stats.redactionsByStyle[k]||0)+v; }); const s=sessions.find(x=>x.id===r.sessionId); if (s?.presetName){ stats.presetUsage[s.presetName]=(stats.presetUsage[s.presetName]||0)+1; } });
  const map=new Map(); completed.forEach(r=>{ const d=new Date(r.timestamp).toISOString().split('T')[0]; const cur=map.get(d)||{total:0,count:0}; map.set(d,{ total:cur.total+(r.processingTime||0), count:cur.count+1 }); }); stats.processingTimesByDate=Array.from(map.entries()).map(([date,v])=>({date, averageTime:v.total/v.count, fileCount:v.count})).sort((a,b)=>a.date.localeCompare(b.date)); return stats; }
function clearHistory(){ _saveArray(SESSIONS_KEY, []); _saveArray(RECORDS_KEY, []); }
function exportHistory(options={format:'json'}){
  if (options.format==='json') { const data={ sessions:getSessions(), records:getAllRecords(), stats:getProcessingStats(), exportedAt:new Date().toISOString() }; return JSON.stringify(data, null, 2); }
  // CSV
  const headers=['Session ID','File Name','File Size','File Type','Timestamp','Processing Time (ms)','Status','Total Detections','Average Confidence','High Confidence Count','Medium Confidence Count','Low Confidence Count','Total Redactions','Preset Name','Error'];
  const rows=getAllRecords().map(r=>{ const s=_loadArray(SESSIONS_KEY).find(x=>x.id===r.sessionId); return [r.sessionId, r.fileName, r.fileSize, r.fileType, r.timestamp, r.processingTime, r.status, r.totalDetections, (r.averageConfidence||0).toFixed(3), r.confidenceDistribution?.high||0, r.confidenceDistribution?.medium||0, r.confidenceDistribution?.low||0, r.redactionStats?.total||0, s?.presetName||'', r.error||'']; });
  return [headers, ...rows].map(row => row.map(cell => '"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\n');
}
/* function showMobileToast(message, duration = 3000) {
  // Remove existing toast
  const existingToast = document.querySelector('.mobile-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'mobile-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-dark);
    color: var(--text-inverse);
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-lg);
    z-index: 20000;
    font-size: var(--font-size-sm);
    font-weight: 500;
    white-space: nowrap;
    max-width: 90vw;
    text-align: center;
    animation: slideInFromTop 0.3s ease-out;
  `;

  document.body.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideOutToTop 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, duration);
} */

// Add toast animations to the page
// (toast animations removed)


/*
// Real detection logic from core-detect package
function isLuhnValid(value) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = value.length - 1; i >= 0; i--) {
    const c = value.charCodeAt(i) - 48;
    if (c < 0 || c > 9) return false;
    let digit = c;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function detectToken(token) {
  const raw = token.trim();
  if (!raw) return null;
  
  // Email
  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (emailPattern.test(raw)) {
    return { kind: 'EMAIL', reason: 'Matches email pattern' };
  }
  
  // Phone number (very permissive, minimum 7 digits)
  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length >= 7 && /\d{3,}/.test(digitsOnly)) {
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return { kind: 'PHONE', reason: 'Potential phone number' };
    }
  }
  
  // Credit card number (PAN) – 13–19 digits with Luhn valid
  if (digitsOnly.length >= 13 && digitsOnly.length <= 19 && isLuhnValid(digitsOnly)) {
    return { kind: 'PAN', reason: 'Luhn valid primary account number' };
  }
  
  return null;
}

// OCR with Tesseract.js
async function performOcrWithTesseract(file) {
  try {
    console.log('Mobile: Starting Tesseract OCR...');
    
    if (typeof Tesseract === 'undefined') {
      console.warn('Mobile: Tesseract not available, skipping OCR');
      return [];
    }

    // Get actual image dimensions by loading the image
    const imageInfo = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
    
    console.log(`Mobile: Actual image dimensions: ${imageInfo.width}x${imageInfo.height}`);

    const worker = await Tesseract.createWorker();
    console.log('Mobile: Tesseract worker created');

    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    console.log('Mobile: Tesseract initialized');

    const { data } = await worker.recognize(file);
    console.log(`Mobile: OCR completed, found ${data.words?.length || 0} words`);

    const detections = [];
    
    // Process OCR words - check different possible data structures
    console.log('Mobile: Tesseract data structure:', data);
    console.log('Mobile: Available data properties:', Object.keys(data));
    console.log(`Mobile: Image dimensions from Tesseract - width: ${data.width}, height: ${data.height}`);
    
    // Use actual image dimensions instead of relying on Tesseract data
    const imageWidth = imageInfo.width;
    const imageHeight = imageInfo.height;
    console.log(`Mobile: Using actual image dimensions - width: ${imageWidth}, height: ${imageHeight}`);
    
    if (data.words) {
      console.log(`Mobile: Processing ${data.words.length} words from Tesseract`);
      for (const word of data.words) {
        if (!word.text || !word.text.trim()) continue;
        
        console.log('Mobile: Word object structure:', word);
        console.log('Mobile: Word bbox:', word.bbox);
        
        const match = detectToken(word.text);
        if (match) {
          const { kind, reason } = match;
          
          // Try different possible bbox formats
          let bbox = null;
          
          if (word.bbox && typeof word.bbox === 'object') {
            // Format 1: {x0, y0, x1, y1}
            if (word.bbox.x0 !== undefined) {
              bbox = {
                x0: word.bbox.x0,
                y0: word.bbox.y0,
                x1: word.bbox.x1,
                y1: word.bbox.y1
              };
            }
            // Format 2: {left, top, right, bottom}
            else if (word.bbox.left !== undefined) {
              bbox = {
                x0: word.bbox.left,
                y0: word.bbox.top,
                x1: word.bbox.right,
                y1: word.bbox.bottom
              };
            }
          }
          
          // Fallback: check if word has direct coordinate properties
          if (!bbox && word.x0 !== undefined) {
            bbox = {
              x0: word.x0,
              y0: word.y0,
              x1: word.x1,
              y1: word.y1
            };
          }
          
          // Another fallback: check common Tesseract formats
          if (!bbox && word.left !== undefined) {
            bbox = {
              x0: word.left,
              y0: word.top,
              x1: word.left + word.width,
              y1: word.top + word.height
            };
          }
          
          console.log(`Mobile: Extracted bbox for "${word.text}":`, bbox);
          
          if (!bbox || bbox.x0 === undefined || isNaN(bbox.x0)) {
            console.error(`Mobile: Invalid bbox for word "${word.text}"`, bbox);
            continue;
          }
          
          // Convert to normalized format using resolved dimensions
          if (!imageWidth || !imageHeight || isNaN(imageWidth) || isNaN(imageHeight)) {
            console.error(`Mobile: Invalid image dimensions for normalization: ${imageWidth}x${imageHeight}`);
            continue;
          }
          
          const box = {
            x: bbox.x0 / imageWidth,
            y: bbox.y0 / imageHeight,
            width: (bbox.x1 - bbox.x0) / imageWidth,
            height: (bbox.y1 - bbox.y0) / imageHeight
          };
          
          console.log(`Mobile: Tesseract detected "${word.text}" at bbox (${bbox.x0}, ${bbox.y0}, ${bbox.x1}, ${bbox.y1}) image ${imageWidth}x${imageHeight}`);
          console.log(`Mobile: Normalized to (${box.x.toFixed(3)}, ${box.y.toFixed(3)}) size ${box.width.toFixed(3)}x${box.height.toFixed(3)}`);
          
          // Validate normalized coordinates
          if (isNaN(box.x) || isNaN(box.y) || isNaN(box.width) || isNaN(box.height)) {
            console.error(`Mobile: Normalization failed - got NaN values:`, box);
            console.error(`Mobile: bbox:`, bbox);
            console.error(`Mobile: dimensions:`, {imageWidth, imageHeight});
            continue;
          }
          
          detections.push({
            id: `${kind}_${detections.length}`,
            kind,
            text: word.text,
            confidence: word.confidence / 100,
            reason,
            box,
            page: 0 // Images are single page
          });
          
          console.log(`Mobile: Found ${kind}: "${word.text}" (${word.confidence}% confidence)`);
        }
      }
    }

    await worker.terminate();
    console.log(`Mobile: Tesseract OCR completed with ${detections.length} detections`);
    
    return detections;
  } catch (error) {
    console.error('Mobile: Tesseract OCR failed:', error);
    return [];
  }
}

// PDF analysis with pdfjs-dist
async function analyzePdfWithPdfjs(file) {
  try {
    if (typeof pdfjsLib === 'undefined') {
      console.warn('Mobile: pdfjs-dist not available, falling back to empty result');
      return { detections: [], pages: 1 };
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log('Mobile: Loading PDF with pdfjs-dist...');
    
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    console.log(`Mobile: PDF loaded, ${pdf.numPages} pages`);
    
    const detections = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      console.log(`Mobile: Processing page ${pageNum}, found ${textContent.items.length} text items`);
      
      // Extract text items with positions
      for (const item of textContent.items) {
        if (!item.str || !item.str.trim()) continue;
        
        const text = item.str.trim();
        const match = detectToken(text);
        
        if (match) {
          const { kind, reason } = match;
          
          const transform = item.transform;
          const x = transform[4];
          const y = transform[5];
          const width = item.width || 50;
          const height = item.height || 12;
          
          // pdfjs-dist coordinates are already in PDF coordinate system (bottom-left origin)
          // Use direct coordinate mapping - no transformation needed
          const box = {
            x: x / viewport.width,
            y: y / viewport.height,
            width: width / viewport.width,
            height: height / viewport.height
          };
          
          detections.push({
            id: `${kind}_${detections.length}`,
            kind,
            text: text,
            confidence: 0.9, // High confidence for extracted text
            reason,
            box,
            page: pageNum - 1 // Convert to 0-based page index
          });
          
          console.log(`Mobile: Found ${kind} on page ${pageNum}: "${text}"`);
        }
      }
    }
    
    console.log(`Mobile: PDF analysis completed with ${detections.length} detections`);
    return { detections, pages: pdf.numPages };
  } catch (error) {
    console.error('Mobile: PDF analysis failed:', error);
    return { detections: [], pages: 1 };
  }
}

// File analysis function
async function analyzeDocument(file) {
  console.log(`Mobile: Analyzing file: ${file.name} (${file.type})`);
  
  try {
    let detections = [];
    let pages = 1;
    
    if (file.type === 'application/pdf') {
      const result = await analyzePdfWithPdfjs(file);
      detections = result.detections;
      pages = result.pages;
    } else if (file.type.startsWith('image/')) {
      detections = await performOcrWithTesseract(file);
      pages = 1;
    } else {
      console.warn(`Mobile: Unsupported file type: ${file.type}`);
      return { detections: [], pages: 1 };
    }
    
    console.log(`Mobile: Analysis complete - ${detections.length} detections found`);
    return { detections, pages };
  } catch (error) {
    console.error('Mobile: Document analysis failed:', error);
    return { detections: [], pages: 1 };
  }
}

// Sanitization function
async function applyRedactions(file, detections, options = {}) {
  console.log(`Mobile: Applying redactions to ${file.name}...`);
  
  try {
    if (file.type === 'application/pdf') {
      return await redactPdfFile(file, detections, options);
    } else if (file.type.startsWith('image/')) {
      return await redactImageFile(file, detections, options);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    console.error('Mobile: Redaction failed:', error);
    throw error;
  }
}

// PDF redaction using pdf-lib
async function redactPdfFile(file, detections, options = {}) {
  if (typeof PDFLib === 'undefined') {
    throw new Error('PDF-lib not available');
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  
  console.log(`Mobile: Redacting PDF with ${detections.length} detections across ${pages.length} pages`);
  
  for (const detection of detections) {
    const pageIndex = detection.page || 0;
    if (pageIndex >= pages.length) continue;
    
    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    
    // Convert normalized coordinates to PDF coordinates
    // Use direct coordinate mapping - both pdfjs-dist and pdf-lib use same coordinate system
    const x = detection.box.x * pageWidth;
    const y = detection.box.y * pageHeight;
    const width = detection.box.width * pageWidth;
    const height = detection.box.height * pageHeight;
    
    // Draw redaction rectangle
    page.drawRectangle({
      x: x,
      y: y,
      width: width,
      height: height,
      color: PDFLib.rgb(0, 0, 0), // Black redaction
      opacity: 1.0
    });
    
    console.log(`Mobile: Redacted ${detection.kind} on page ${pageIndex + 1}`);
  }
  
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  
  console.log(`Mobile: PDF redaction complete, output size: ${blob.size} bytes`);
  return blob;
}

// Image redaction using Canvas
async function redactImageFile(file, detections, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Draw redaction boxes
        ctx.fillStyle = 'black';
        console.log(`Mobile: Canvas size: ${canvas.width}x${canvas.height}, Image size: ${img.width}x${img.height}`);
        
        for (const detection of detections) {
          const x = detection.box.x * img.width;
          const y = detection.box.y * img.height;
          const width = detection.box.width * img.width;
          const height = detection.box.height * img.height;
          
          console.log(`Mobile: Drawing image redaction for "${detection.text}":`);
          console.log(`Mobile: Normalized box: (${detection.box.x.toFixed(3)}, ${detection.box.y.toFixed(3)}) size ${detection.box.width.toFixed(3)}x${detection.box.height.toFixed(3)}`);
          console.log(`Mobile: Canvas coords: (${x.toFixed(2)}, ${y.toFixed(2)}) size ${width.toFixed(2)}x${height.toFixed(2)}`);
          
          // Draw a thick red border for debugging (easier to see than black)
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          
          // Draw the black fill
          ctx.fillRect(x, y, width, height);
          console.log(`Mobile: Drew redaction box for ${detection.kind} at (${x.toFixed(2)}, ${y.toFixed(2)})`);
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`Mobile: Image redaction complete, output size: ${blob.size} bytes`);
            resolve(blob);
          } else {
            reject(new Error('Failed to create redacted image blob'));
          }
        }, file.type);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

*/
// Phase 2.4 Component 1: Preset Management (using working patterns)
const PresetManagerModal = ({ isOpen, onClose }) => {
  console.log('PresetManagerModal rendering...', { isOpen });
  
  // Verify React hooks are available (same pattern as main app)
  if (typeof React?.useState !== 'function') {
    console.error('React.useState not available in PresetManagerModal');
    return React.createElement('div', {}, 'React hooks not available');
  }

  const [selectedTab, setSelectedTab] = React.useState('browse');
  const [presets, setPresets] = React.useState(listPresets());
  const [importText, setImportText] = React.useState('');
  const [exportText, setExportText] = React.useState('');
  const refreshPresets = () => setPresets(listPresets());

  if (!isOpen) return null;

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }
  },
    React.createElement('div', {
      style: {
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }
    },
      // Header
      React.createElement('div', {
        style: {
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      },
        React.createElement('h3', {
          style: { margin: 0, fontSize: '18px', color: '#1f2937' }
        }, '🎛️ Preset Manager'),
        React.createElement('button', {
          onClick: onClose,
          style: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            color: '#6b7280'
          }
        }, '×')
      ),

      // Tab buttons
      React.createElement('div', {
        style: {
          display: 'flex',
          borderBottom: '1px solid #e5e7eb'
        }
      },
        React.createElement('button', {
          onClick: () => setSelectedTab('browse'),
          style: {
            flex: 1,
            padding: '12px',
            border: 'none',
            background: selectedTab === 'browse' ? '#2563eb' : 'white',
            color: selectedTab === 'browse' ? 'white' : '#6b7280',
            fontSize: '14px',
            cursor: 'pointer'
          }
        }, 'Browse'),
        React.createElement('button', {
          onClick: () => setSelectedTab('import'),
          style: {
            flex: 1,
            padding: '12px',
            border: 'none',
            background: selectedTab === 'import' ? '#2563eb' : 'white',
            color: selectedTab === 'import' ? 'white' : '#6b7280',
            fontSize: '14px',
            cursor: 'pointer'
          }
        }, 'Import'),
        React.createElement('button', {
          onClick: () => setSelectedTab('export'),
          style: {
            flex: 1,
            padding: '12px',
            border: 'none',
            background: selectedTab === 'export' ? '#2563eb' : 'white',
            color: selectedTab === 'export' ? 'white' : '#6b7280',
            fontSize: '14px',
            cursor: 'pointer'
          }
        }, 'Export')
      ),

      // Content
      React.createElement('div', {
        style: { padding: '20px', overflow: 'auto', flex: 1 }
      },
        selectedTab === 'browse'
          ? React.createElement('div', {},
              presets.map(preset =>
                React.createElement('div', {
                  key: preset.id,
                  style: {
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }
                },
                  React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } },
                    React.createElement('div', { style: { fontWeight: '600' } }, preset.name),
                    React.createElement('div', {}, !preset.isUserCreated ? React.createElement('span', { style: { fontSize: '12px', color: '#059669' } }, 'Built-in') : null)
                  ),
                  preset.description ? React.createElement('div', { style: { fontSize: '14px', color: '#6b7280', marginBottom: '8px' } }, preset.description) : null,
                  React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                    React.createElement('button', { onClick: () => { const exp = exportPreset(preset.id, { format: 'json', includeMetadata: false }); setExportText(exp || ''); setSelectedTab('export'); }, style: { padding: '8px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Export'),
                    preset.isUserCreated ? React.createElement('button', { onClick: () => { deleteMobilePreset(preset.id); refreshPresets(); }, style: { padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Delete') : null,
                    React.createElement('button', { onClick: () => { const d = duplicateMobilePreset(preset.id); if (d) refreshPresets(); }, style: { padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Duplicate')
                  )
                )
              )
            )
          : selectedTab === 'import' ? React.createElement('div', {},
              React.createElement('textarea', { value: importText, onChange: (e) => setImportText(e.target.value), placeholder: 'Paste preset JSON (single or array)…', style: { width: '100%', height: '160px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', marginBottom: '8px' } }),
              React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                React.createElement('button', { onClick: () => { const res = importPreset(importText); alert(res.success ? 'Imported preset' : 'Import failed:\n' + res.errors.join('\n')); refreshPresets(); }, style: { padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Import One'),
                React.createElement('button', { onClick: () => { const res = importMultiplePresets(importText); const ok = res.filter(r => r.success).length; const bad = res.length - ok; alert(`Imported: ${ok}, Failed: ${bad}`); refreshPresets(); }, style: { padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Import Many')
              )
            ) : React.createElement('div', {},
              React.createElement('textarea', { value: exportText, readOnly: true, placeholder: 'Exported preset JSON will appear here…', style: { width: '100%', height: '160px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', marginBottom: '8px' } }),
              React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                React.createElement('button', { onClick: () => { const all = exportAllUserPresets({ format: 'json', includeMetadata: false }); setExportText(all); }, style: { padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Export All User Presets'),
                React.createElement('button', { onClick: () => { navigator.clipboard.writeText(exportText || ''); alert('Copied to clipboard'); }, style: { padding: '8px 12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Copy'),
                React.createElement('button', { onClick: () => { resetUserPresets(); refreshPresets(); alert('User presets cleared'); }, style: { padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Reset User Presets')
              )
            )
      )
    )
  );
};

// Phase 2.4 Component 2: Processing History & Audit Trail (using working patterns)
const HistoryDashboardModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return React.createElement('div', { style: { position:'fixed', top:0,left:0,right:0,bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
    React.createElement('div', { style: { background:'white', borderRadius:'12px', width:'100%', maxWidth:'420px', maxHeight:'80vh', overflow:'auto', display:'flex', flexDirection:'column' } },
      React.createElement('div', { style: { padding:'16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' } },
        React.createElement('h3', { style:{ margin:0, fontSize:'18px', color:'#1f2937' } }, '📊 Processing History'),
        React.createElement('button', { onClick:onClose, style:{ background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#6b7280' }}, '×')
      ),
      React.createElement('div', { style:{ padding:'16px', display:'grid', gap:'8px' } },
        React.createElement('button', { onClick: () => { const data = exportHistory({ format:'json' }); navigator.clipboard.writeText(data); alert('History JSON copied'); }, style:{ padding:'8px 12px', background:'#0ea5e9', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' } }, 'Export JSON'),
        React.createElement('button', { onClick: () => { const data = exportHistory({ format:'csv' }); navigator.clipboard.writeText(data); alert('History CSV copied'); }, style:{ padding:'8px 12px', background:'#0ea5e9', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' } }, 'Export CSV'),
        React.createElement('button', { onClick: () => { if (confirm('Clear all history?')) { clearHistory(); alert('History cleared'); } }, style:{ padding:'8px 12px', background:'#ef4444', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' } }, 'Clear History')
      )
    )
  );
};
const MobileApp = () => {
  // Core single-file state
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState(null);
  const [isSanitizing, setIsSanitizing] = React.useState(false);
  const [sanitizedBlob, setSanitizedBlob] = React.useState(null);
  const [previewUri, setPreviewUri] = React.useState(null);
  const [currentStep, setCurrentStep] = React.useState('upload');
  const [detectionFilter, setDetectionFilter] = React.useState({});

  // Modals
  const [showPresets, setShowPresets] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showUndo, setShowUndo] = React.useState(false);
  const [showKeyboard, setShowKeyboard] = React.useState(false);

  // Sessions for history
  const [currentSessionId, setCurrentSessionId] = React.useState(null);

  // Multi-file state
  const [fileStates, setFileStates] = React.useState([]);
  const [currentFileIndex, setCurrentFileIndex] = React.useState(0);

  // Single-file upload handler
  const handleFileSelect = React.useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setCurrentStep('review');
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      if (!window.CleanSharePro || typeof window.CleanSharePro.processFile !== 'function') {
        throw new Error('Processing engine not ready');
      }
      const res = await window.CleanSharePro.processFile(file);
      if (!res || !res.success) throw new Error(res?.error || 'Analysis failed');
      const result = { detections: res.detections || [], pages: res.pages || 1 };
      setAnalysisResult(result);
      const filter = {}; result.detections.forEach(d => filter[d.id] = true); setDetectionFilter(filter);
    } catch (e) {
      alert(`Analysis failed: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Multi-file: add files (append to fileStates)
  const handleAddFiles = React.useCallback((event) => {
    const list = Array.from(event.target.files || []);
    if (!list.length) return;
    setFileStates(prev => {
      const appended = list.map((f) => ({
        file: f,
        detections: [],
        pages: 1,
        selected: {},
        actions: {},
        analyzing: false,
        sanitizing: false,
        outputUri: null,
        previewUri: null,
        error: null,
        analyzed: false,
        sanitized: false
      }));
      const next = [...prev, ...appended];
      if (prev.length === 0) setCurrentFileIndex(0);
      return next;
    });
    // allow the same files to be reselected later
    event.target.value = '';
  }, []);

  // Analyze one file by index
  const analyzeOne = React.useCallback(async (index) => {
    setFileStates(prev => prev.map((s, i) => i === index ? { ...s, analyzing: true, error: null } : s));
    try {
      if (!window.CleanSharePro || typeof window.CleanSharePro.processFile !== 'function') {
        throw new Error('Processing engine not ready');
      }
      const s = fileStates[index];
      let recordId = null;
      if (currentSessionId) {
        recordId = startFileProcessing({ sessionId: currentSessionId, fileName: s.file.name, fileSize: s.file.size, fileType: s.file.type });
      }
      const res = await window.CleanSharePro.processFile(s.file);
      if (!res || !res.success) throw new Error(res?.error || 'Analysis failed');
      const detections = res.detections || [];
      const selected = {}; const actions = {};
      detections.forEach(d => { selected[d.id] = true; actions[d.id] = { style: 'BOX' }; });
      setFileStates(prev => prev.map((fs, i) => i === index ? { ...fs, detections, pages: res.pages || 1, selected, actions, analyzed: true, analyzing: false } : fs));
      if (recordId) recordAnalysisResults(recordId, { detections });
    } catch (err) {
      setFileStates(prev => prev.map((s, i) => i === index ? { ...s, analyzing: false, error: err.message } : s));
    }
  }, [fileStates, currentSessionId]);

  // Sanitize one file by index
  const sanitizeOne = React.useCallback(async (index) => {
    setFileStates(prev => prev.map((s, i) => i === index ? { ...s, sanitizing: true, error: null } : s));
    try {
      if (!window.CleanSharePro || typeof window.CleanSharePro.applyRedactions !== 'function') {
        throw new Error('Processing engine not ready');
      }
      const s = fileStates[index];
      let recordId = null; if (currentSessionId) { recordId = startFileProcessing({ sessionId: currentSessionId, fileName: s.file.name, fileSize: s.file.size, fileType: s.file.type }); }
      const actions = (s.detections || []).filter(d => s.selected[d.id]).map(d => ({ detectionId: d.id, style: (s.actions[d.id]?.style) || 'BOX' }));
      const res = await window.CleanSharePro.applyRedactions(s.file, actions, { detections: s.detections });
      if (!res || !res.success) throw new Error(res?.error || 'Sanitization failed');
      const mime = s.file.type === 'application/pdf' ? 'application/pdf' : (s.file.type && s.file.type.startsWith('image/') ? s.file.type : 'application/octet-stream');
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      setFileStates(prev => prev.map((fs, i) => i === index ? { ...fs, outputUri: url, previewUri: url, sanitizing: false, sanitized: true } : fs));
      if (recordId) recordRedactionResults(recordId, { appliedRedactions: actions, outputSize: blob.size });
    } catch (err) {
      setFileStates(prev => prev.map((s, i) => i === index ? { ...s, sanitizing: false, error: err.message } : s));
    }
  }, [fileStates, currentSessionId]);

  // Concurrency helper
  const runWithConcurrency = React.useCallback(async (indexes, worker, limit = 3) => {
    const queue = [...indexes];
    const runners = new Array(Math.min(limit, queue.length)).fill(0).map(async () => {
      while (queue.length) {
        const idx = queue.shift();
        try { await worker(idx); } catch {}
      }
    });
    await Promise.all(runners);
  }, []);

  // Bulk actions
  const analyzeAll = React.useCallback(async () => {
    const sid = startSession({ totalFiles: fileStates.length });
    setCurrentSessionId(sid);
    const toAnalyze = fileStates.map((s, i) => ({ s, i })).filter(x => !x.s.analyzed && !x.s.analyzing);
    await runWithConcurrency(toAnalyze.map(x => x.i), analyzeOne, 3);
  }, [fileStates, analyzeOne, runWithConcurrency]);

  const sanitizeAll = React.useCallback(async () => {
    const toSanitize = fileStates.map((s, i) => ({ s, i })).filter(x => x.s.analyzed && !x.s.sanitized && !x.s.sanitizing);
    await runWithConcurrency(toSanitize.map(x => x.i), sanitizeOne, 3);
    if (currentSessionId) endSession(currentSessionId, 'completed');
  }, [fileStates, sanitizeOne, runWithConcurrency, currentSessionId]);
  const downloadAll = React.useCallback(() => {
    fileStates.forEach((s, i) => {
      if (s.outputUri) {
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = s.outputUri;
          a.download = `sanitized_${s.file.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }, i * 100);
      }
    });
  }, [fileStates]);

  // Sanitization handler
  const handleSanitize = React.useCallback(async () => {
    if (!selectedFile || !analysisResult) {
      console.error('No file or analysis result available');
      return;
    }

    // Filter detections based on user selection
    const enabledDetections = analysisResult.detections.filter(
      detection => detectionFilter[detection.id]
    );

    console.log(`Sanitizing with ${enabledDetections.length} enabled detections`);
    setIsSanitizing(true);
    setSanitizedBlob(null);
    setPreviewUri(null);

    try {
      if (!window.CleanSharePro || typeof window.CleanSharePro.applyRedactions !== 'function') {
        throw new Error('Processing engine not ready');
      }
      // Build simple BOX actions for enabled detections
      const actions = enabledDetections.map(d => ({ detectionId: d.id, style: 'BOX' }));
      const res = await window.CleanSharePro.applyRedactions(
        selectedFile,
        actions,
        { detections: analysisResult.detections }
      );
      if (!res || !res.success) {
        throw new Error(res?.error || 'Sanitization failed');
      }
      const mime = selectedFile.type === 'application/pdf'
        ? 'application/pdf'
        : (selectedFile.type && selectedFile.type.startsWith('image/') ? selectedFile.type : 'application/octet-stream');
      const blob = new Blob([res.data], { type: mime });
      setSanitizedBlob(blob);

      // Create preview URL
      const previewUrl = URL.createObjectURL(blob);
      setPreviewUri(previewUrl);
      setCurrentStep('preview');

      console.log('Sanitization completed successfully');
    } catch (error) {
      console.error('Sanitization failed:', error);
      alert(`Sanitization failed: ${error.message}`);
    } finally {
      setIsSanitizing(false);
    }
  }, [selectedFile, analysisResult, detectionFilter]);

  // Download handler
  const handleDownload = React.useCallback(() => {
    if (!sanitizedBlob || !selectedFile) return;
    
    // Create download link
    const url = URL.createObjectURL(sanitizedBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate sanitized filename
    const extension = selectedFile.name.includes('.') 
      ? selectedFile.name.split('.').pop() 
      : (selectedFile.type === 'application/pdf' ? 'pdf' : 'jpg');
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}_sanitized.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Download triggered for sanitized file');
  }, [sanitizedBlob, selectedFile]);

  // Reset handler
  const handleReset = React.useCallback(() => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setSanitizedBlob(null);
    setPreviewUri(null);
    setCurrentStep('upload');
    setDetectionFilter({});
    setIsAnalyzing(false);
    setIsSanitizing(false);
    
    // Clean up any preview URLs
    if (previewUri) {
      URL.revokeObjectURL(previewUri);
    }
    
    console.log('App state reset');
  }, [previewUri]);

  // Keyboard shortcuts event listener
  React.useEffect(() => {
    if (typeof React?.useEffect !== 'function') {
      console.log('useEffect not available, skipping keyboard shortcuts');
      return;
    }

    const handleKeyDown = (event) => {
      // Only handle if no modals are open (to avoid conflicts)
      if (showPresets || showHistory || showUndo || showKeyboard) return;

      // Ctrl+O - File upload
      if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        const multi = document.getElementById('multi-file-input');
        if (multi) multi.click(); else document.getElementById('file-input')?.click();
      }

      // Ctrl+Z - Undo
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        console.log('Ctrl+Z pressed - opening undo manager');
        setShowUndo(true);
      }
      
      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        console.log('Redo shortcut pressed - opening undo manager');
        setShowUndo(true);
      }

      // ? or F1 - Keyboard shortcuts help
      if (event.key === '?' || event.key === 'F1') {
        event.preventDefault();
        console.log('Help shortcut pressed - opening keyboard shortcuts');
        setShowKeyboard(true);
      }

      // Escape - Close any open modal or reset
      if (event.key === 'Escape') {
        if (showPresets || showHistory || showUndo || showKeyboard) {
          console.log('Escape pressed - closing modals');
          setShowPresets(false);
          setShowHistory(false);
          setShowUndo(false);
          setShowKeyboard(false);
        } else if (currentStep !== 'upload') {
          console.log('Escape pressed - resetting app');
          handleReset();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    console.log('Full app keyboard shortcuts event listener added');
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      console.log('Full app keyboard shortcuts event listener removed');
    };
  }, [showPresets, showHistory, showUndo, showKeyboard, currentStep, handleReset]);

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '0',
      fontFamily: 'system-ui, sans-serif'
    }
  },
    // Header
    React.createElement('div', {
      style: {
        background: 'white',
        padding: '20px',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }
    },
      React.createElement('h1', {
        style: { margin: '0 0 10px 0', color: '#2563eb', fontSize: '28px' }
      }, '🔒 CleanShare Pro'),
      React.createElement('p', {
        style: { margin: 0, color: '#6b7280', fontSize: '16px' }
      }, 'Privacy-First Document Sanitization • Phase 2.4')
    ),

    // Phase 2.4 Quick Actions Bar
    React.createElement('div', {
      style: {
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 20px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        borderBottom: '1px solid #e5e7eb'
      }
    },
      React.createElement('button', {
        onClick: () => document.getElementById('multi-file-input')?.click(),
        style: { padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }
      }, '➕ Add Files'),
      React.createElement('input', { id: 'multi-file-input', type: 'file', multiple: true, accept: 'image/*,application/pdf', style: { display: 'none' }, onChange: handleAddFiles }),
      React.createElement('button', { onClick: analyzeAll, style: { padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' } }, '🔍 Analyze All'),
      React.createElement('button', { onClick: sanitizeAll, style: { padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' } }, '🧼 Sanitize All'),
      React.createElement('button', { onClick: downloadAll, style: { padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' } }, '⬇️ Download All'),
      React.createElement('button', { onClick: () => { setFileStates(prev => { prev.forEach(s => { if (s.previewUri) try{URL.revokeObjectURL(s.previewUri);}catch{} }); return []; }); }, style: { padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' } }, '🧹 Clear List'),
      React.createElement('button', {
        onClick: () => setShowPresets(true),
        style: {
          padding: '8px 16px',
          background: '#059669',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          cursor: 'pointer',
          fontWeight: '600'
        }
      }, '🎛️ Presets'),
      React.createElement('button', {
        onClick: () => setShowHistory(true),
        style: {
          padding: '8px 16px',
          background: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          cursor: 'pointer',
          fontWeight: '600'
        }
      }, '📊 History'),
      React.createElement('button', {
        onClick: () => setShowUndo(true),
        style: {
          padding: '8px 16px',
          background: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          cursor: 'pointer',
          fontWeight: '600'
        }
      }, '↩️ Undo/Redo'),
      React.createElement('button', {
        onClick: () => setShowKeyboard(true),
        style: {
          padding: '8px 16px',
          background: '#1f2937',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          cursor: 'pointer',
          fontWeight: '600'
        }
      }, '⌨️ Help')
    ),

    // Multi-file layout
    fileStates.length > 0 ? React.createElement('div', { style: { padding: '20px' } },
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' } },
        // File list
        React.createElement('div', { style: { background: 'white', borderRadius: '12px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxHeight: '70vh', overflowY: 'auto' } },
          fileStates.map((s, i) => React.createElement('div', {
            key: i, onClick: () => setCurrentFileIndex(i),
            style: { padding: '10px', border: i === currentFileIndex ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', background: i === currentFileIndex ? '#eff6ff' : 'white' }
          },
            React.createElement('div', { style: { fontWeight: 600, fontSize: '14px', color: '#1f2937' } }, s.file.name),
            React.createElement('div', { style: { fontSize: '12px', color: '#6b7280' } }, s.error ? `❌ ${s.error}` : s.sanitized ? '✅ Sanitized' : s.analyzed ? `🔍 ${s.detections.length} detections` : (s.analyzing ? '🔄 Analyzing…' : '⏳ Pending'))
          ))
        ),
        // Detail pane
        (() => {
          const fs = fileStates[currentFileIndex] || {};
          return React.createElement('div', { style: { background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } },
            // Actions
            React.createElement('div', { style: { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' } },
              React.createElement('button', { onClick: () => analyzeOne(currentFileIndex), disabled: fs.analyzing, style: { padding: '8px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: fs.analyzing ? 'not-allowed' : 'pointer' } }, fs.analyzing ? 'Analyzing…' : 'Analyze'),
              React.createElement('button', { onClick: () => sanitizeOne(currentFileIndex), disabled: !fs.analyzed || fs.sanitizing, style: { padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: (!fs.analyzed || fs.sanitizing) ? 'not-allowed' : 'pointer' } }, fs.sanitizing ? 'Sanitizing…' : 'Sanitize'),
              React.createElement('button', { onClick: () => { if (fs.outputUri) { const a = document.createElement('a'); a.href = fs.outputUri; a.download = `sanitized_${fs.file.name}`; document.body.appendChild(a); a.click(); document.body.removeChild(a); } }, disabled: !fs.outputUri, style: { padding: '8px 12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: fs.outputUri ? 'pointer' : 'not-allowed' } }, 'Download'),
              React.createElement('button', { onClick: () => { setFileStates(prev => { const next = prev.slice(); const removed = next.splice(currentFileIndex, 1)[0]; try { if (removed?.previewUri) URL.revokeObjectURL(removed.previewUri); } catch {} return next; }); setCurrentFileIndex(i => Math.max(0, i - 1)); }, style: { padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Remove')
            ),
            // Detections
            fs.analyzed ? React.createElement('div', { style: { marginBottom: '12px' } },
              React.createElement('h3', { style: { margin: '0 0 8px 0', fontSize: '16px', color: '#1f2937' } }, `Detections (${fs.detections.length})`),
              fs.detections.length === 0 ? React.createElement('div', { style: { color: '#059669' } }, 'No sensitive information detected') :
                React.createElement('div', { style: { display: 'grid', gap: '6px' } },
                  fs.detections.map(d => React.createElement('label', { key: d.id, style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' } },
                    React.createElement('input', { type: 'checkbox', checked: !!fs.selected[d.id], onChange: (e) => setFileStates(prev => prev.map((s, ii) => ii === currentFileIndex ? { ...s, selected: { ...s.selected, [d.id]: e.target.checked } } : s)) }),
                    React.createElement('span', { style: { minWidth: '80px', color: '#374151' } }, d.kind),
                    React.createElement('span', { style: { color: '#6b7280' } }, d.preview || d.text || ''),
                    React.createElement('select', { value: (fs.actions[d.id]?.style) || 'BOX', onChange: (e) => setFileStates(prev => prev.map((s, ii) => ii === currentFileIndex ? { ...s, actions: { ...s.actions, [d.id]: { style: e.target.value } } } : s)) },
                      ['BOX', 'BLUR', 'PIXELATE', 'LABEL', 'MASK_LAST4'].map(opt => React.createElement('option', { key: opt, value: opt }, opt))
                    )
                  ))
                )
            ) : React.createElement('div', { style: { color: '#6b7280', marginBottom: '12px' } }, 'Analyze to view detections'),
            // Preview
            fs.previewUri ? React.createElement('div', { style: { marginTop: '8px' } },
              fs.file && fs.file.type === 'application/pdf' ? React.createElement('embed', { src: fs.previewUri, type: 'application/pdf', style: { width: '100%', height: '400px', border: '1px solid #e5e7eb', borderRadius: '8px' } })
                : React.createElement('img', { src: fs.previewUri, alt: 'Preview', style: { maxWidth: '100%', maxHeight: '400px', border: '1px solid #e5e7eb', borderRadius: '8px' } })
            ) : null
          );
        })()
      )
    ) : null,

    // Main Content - File Processing Interface
    (fileStates.length === 0) && React.createElement('div', {
      style: { padding: '20px', maxWidth: '800px', margin: '0 auto' }
    },
      
      // Step 1: File Upload
      currentStep === 'upload' ? React.createElement('div', {
        style: {
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }
      },
        React.createElement('div', {
          style: { fontSize: '48px', marginBottom: '16px' }
        }, '📁'),
        React.createElement('h2', {
          style: { margin: '0 0 16px 0', color: '#1f2937', fontSize: '24px' }
        }, 'Upload Document'),
        React.createElement('p', {
          style: { margin: '0 0 24px 0', color: '#6b7280', fontSize: '16px' }
        }, 'Select a PDF or image file to analyze and sanitize'),
        
        React.createElement('input', {
          id: 'file-input',
          type: 'file',
          accept: '.pdf,.jpg,.jpeg,.png,.bmp,.tiff,.webp',
          onChange: handleFileSelect,
          style: { display: 'none' }
        }),
        
        React.createElement('button', {
          onClick: () => document.getElementById('file-input').click(),
          style: {
            padding: '16px 32px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
          }
        }, '📁 Choose File'),
        
        React.createElement('div', {
          style: { marginTop: '24px', fontSize: '14px', color: '#6b7280' }
        }, 'Supported formats: PDF, JPEG, PNG, BMP, TIFF, WebP')
      ) : null,

      // Step 2: Review & Analysis
      currentStep === 'review' ? React.createElement('div', {
        style: {
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }
      },
        // File info header
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }
        },
          React.createElement('div', {},
            React.createElement('h2', {
              style: { margin: '0 0 8px 0', color: '#1f2937', fontSize: '20px' }
            }, '📋 Analysis & Review'),
            selectedFile ? React.createElement('div', {
              style: { fontSize: '14px', color: '#6b7280' }
            }, `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`) : null
          ),
          React.createElement('button', {
            onClick: handleReset,
            style: {
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600'
            }
          }, '← Back')
        ),

        // Analysis status
        isAnalyzing ? React.createElement('div', {
          style: {
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280'
          }
        },
          React.createElement('div', {
            style: { fontSize: '32px', marginBottom: '16px' }
          }, '⏳'),
          React.createElement('h3', {
            style: { margin: '0 0 8px 0' }
          }, 'Analyzing Document...'),
          React.createElement('p', {
            style: { margin: 0 }
          }, 'Using OCR and pattern recognition to detect sensitive information')
        ) : analysisResult ? React.createElement('div', {},
          // Detection results
          React.createElement('div', {
            style: { marginBottom: '24px' }
          },
            React.createElement('h3', {
              style: { margin: '0 0 16px 0', color: '#059669', fontSize: '18px' }
            }, `✅ Found ${analysisResult.detections.length} Detections`),
            
            analysisResult.detections.length === 0 ? React.createElement('div', {
              style: {
                textAlign: 'center',
                padding: '40px',
                background: '#f9fafb',
                borderRadius: '8px',
                color: '#6b7280'
              }
            },
              React.createElement('div', { style: { fontSize: '32px', marginBottom: '16px' } }, '🎉'),
              React.createElement('p', { style: { margin: 0, fontSize: '16px' } }, 'No sensitive information detected!')
            ) : React.createElement('div', {
              style: { display: 'flex', flexDirection: 'column', gap: '12px' }
            },
              analysisResult.detections.map((detection, index) =>
                React.createElement('div', {
                  key: detection.id,
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: detectionFilter[detection.id] ? '#fef2f2' : '#f9fafb',
                    border: `1px solid ${detectionFilter[detection.id] ? '#fecaca' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }
                },
                  React.createElement('input', {
                    type: 'checkbox',
                    checked: detectionFilter[detection.id] || false,
                    onChange: (e) => {
                      setDetectionFilter({
                        ...detectionFilter,
                        [detection.id]: e.target.checked
                      });
                    },
                    style: { width: '18px', height: '18px', cursor: 'pointer' }
                  }),
                  React.createElement('div', { style: { flex: 1 } },
                    React.createElement('div', {
                      style: { fontWeight: '600', marginBottom: '4px' }
                    }, `${detection.kind}: "${detection.text}"`),
                    React.createElement('div', {
                      style: { fontSize: '14px', color: '#6b7280' }
                    }, `Confidence: ${Math.round(detection.confidence * 100)}% • Page ${detection.page + 1}`)
                  )
                )
              )
            )
          ),

          // Action buttons
          React.createElement('div', {
            style: {
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb'
            }
          },
            React.createElement('button', {
              onClick: () => {
                const newFilter = {};
                analysisResult.detections.forEach(d => newFilter[d.id] = false);
                setDetectionFilter(newFilter);
              },
              style: {
                padding: '12px 24px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '600'
              }
            }, 'Unselect All'),
            React.createElement('button', {
              onClick: () => {
                const newFilter = {};
                analysisResult.detections.forEach(d => newFilter[d.id] = true);
                setDetectionFilter(newFilter);
              },
              style: {
                padding: '12px 24px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '600'
              }
            }, 'Select All'),
            React.createElement('button', {
              onClick: handleSanitize,
              disabled: isSanitizing || Object.values(detectionFilter).every(v => !v),
              style: {
                padding: '12px 24px',
                background: Object.values(detectionFilter).some(v => v) && !isSanitizing ? '#dc2626' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: Object.values(detectionFilter).some(v => v) && !isSanitizing ? 'pointer' : 'not-allowed',
                fontWeight: '600'
              }
            }, isSanitizing ? '⏳ Sanitizing...' : '🔒 Sanitize Document')
          )
        ) : React.createElement('div', {
          style: {
            textAlign: 'center',
            padding: '40px',
            color: '#dc2626'
          }
        }, 'Analysis failed. Please try again.')
      ) : null,

      // Step 3: Preview & Download
      currentStep === 'preview' ? React.createElement('div', {
        style: {
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }
      },
        // Preview header
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }
        },
          React.createElement('div', {},
            React.createElement('h2', {
              style: { margin: '0 0 8px 0', color: '#1f2937', fontSize: '20px' }
            }, '🎉 Sanitization Complete!'),
            React.createElement('div', {
              style: { fontSize: '14px', color: '#6b7280' }
            }, 'Your document has been successfully sanitized')
          ),
          React.createElement('button', {
            onClick: handleReset,
            style: {
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600'
            }
          }, '🔄 Process Another')
        ),

        // Preview area
        previewUri ? React.createElement('div', {
          style: {
            marginBottom: '24px',
            textAlign: 'center'
          }
        },
          selectedFile && selectedFile.type === 'application/pdf' ?
            React.createElement('embed', {
              src: previewUri,
              type: 'application/pdf',
              style: {
                width: '100%',
                height: '400px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }
            }) :
            React.createElement('img', {
              src: previewUri,
              alt: 'Sanitized preview',
              style: {
                maxWidth: '100%',
                maxHeight: '400px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }
            })
        ) : null,

        // Download button
        React.createElement('div', {
          style: {
            textAlign: 'center',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }
        },
          React.createElement('button', {
            onClick: handleDownload,
            style: {
              padding: '16px 32px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
            }
          }, '⬇️ Download Sanitized File')
        )
      ) : null
    ),

    // Phase 2.4 Modal Components (render at end to ensure proper layering)
    React.createElement(PresetManagerModal, {
      isOpen: showPresets,
      onClose: () => {
        console.log('Closing preset manager');
        setShowPresets(false);
      }
    }),
    React.createElement(HistoryDashboardModal, {
      isOpen: showHistory,
      onClose: () => {
        console.log('Closing history dashboard');
        setShowHistory(false);
      }
    }),
    React.createElement(UndoRedoControlsModal, {
      isOpen: showUndo,
      onClose: () => {
        console.log('Closing undo/redo manager');
        setShowUndo(false);
      }
    }),
    React.createElement(KeyboardShortcutsModal, {
      isOpen: showKeyboard,
      onClose: () => {
        console.log('Closing keyboard shortcuts');
        setShowKeyboard(false);
      }
    })
  );
};

// Minimal Undo/Redo modal to prevent undefined component errors
const UndoRedoControlsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return React.createElement('div', { style: { position:'fixed', top:0,left:0,right:0,bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
    React.createElement('div', { style: { background:'white', borderRadius:'12px', width:'100%', maxWidth:'420px', maxHeight:'80vh', overflow:'auto', display:'flex', flexDirection:'column' } },
      React.createElement('div', { style: { padding:'16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' } },
        React.createElement('h3', { style:{ margin:0, fontSize:'18px', color:'#1f2937' } }, '↩️ Undo/Redo'),
        React.createElement('button', { onClick:onClose, style:{ background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#6b7280' }}, '×')
      ),
      React.createElement('div', { style:{ padding:'16px', color:'#6b7280' } }, 'Use controls in main UI to undo/redo changes.')
    )
  );
};

// Minimal Keyboard Shortcuts modal
const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const item = (keys, desc) => React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:'6px' } },
    React.createElement('div', { style:{ fontFamily:'monospace' } }, keys),
    React.createElement('div', { style:{ color:'#6b7280' } }, desc)
  );
  return React.createElement('div', { style: { position:'fixed', top:0,left:0,right:0,bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
    React.createElement('div', { style: { background:'white', borderRadius:'12px', width:'100%', maxWidth:'420px', maxHeight:'80vh', overflow:'auto', display:'flex', flexDirection:'column' } },
      React.createElement('div', { style: { padding:'16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' } },
        React.createElement('h3', { style:{ margin:0, fontSize:'18px', color:'#1f2937' } }, '⌨️ Keyboard Shortcuts'),
        React.createElement('button', { onClick:onClose, style:{ background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#6b7280' }}, '×')
      ),
      React.createElement('div', { style:{ padding:'16px' } },
        item('Ctrl+O', 'Open file picker'),
        item('Ctrl+Z', 'Undo (opens manager)'),
        item('Ctrl+Y / Ctrl+Shift+Z', 'Redo (opens manager)'),
        item('?', 'Open this help')
      )
    )
  );
};

// Initialize function with extensive error handling
function initFixedMobileApp() {
  if (isAppInitialized) {
    console.log('App already initialized, skipping...');
    return true;
  }

  console.log('Starting fixed mobile app initialization...');
  
  const container = document.getElementById('app');
  if (!container) {
    console.error('No app container element found');
    return false;
  }

  try {
    console.log('Clearing container...');
    container.innerHTML = '';

    console.log('Checking React availability...');
    console.log('typeof React:', typeof React);
    console.log('typeof ReactDOM:', typeof ReactDOM);
    console.log('typeof React.createElement:', typeof React?.createElement);
    console.log('typeof React.useState:', typeof React?.useState);

    if (typeof React === 'undefined') {
      throw new Error('React is not defined');
    }

    if (typeof ReactDOM === 'undefined') {
      throw new Error('ReactDOM is not defined');
    }

    console.log('Creating MobileApp element...');
    console.log('MobileApp function:', typeof MobileApp);

    // Create the element
    const appElement = React.createElement(MobileApp);
    console.log('App element created:', appElement);
    console.log('Element type:', appElement?.type);
    console.log('Element props:', appElement?.props);

    // Render
    if (typeof ReactDOM.createRoot === 'function') {
      console.log('Using React 18 createRoot...');
      const root = ReactDOM.createRoot(container);
      console.log('Root created:', root);
      root.render(appElement);
      console.log('Element rendered with createRoot');
    } else {
      console.log('Using legacy ReactDOM.render...');
      ReactDOM.render(appElement, container);
      console.log('Element rendered with legacy render');
    }

    isAppInitialized = true;
    console.log('✅ Fixed mobile app initialization completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Fixed mobile app initialization failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Show error in UI - COMMENTED OUT TO PREVENT VANILLA FALLBACK
    // container.innerHTML = `
    //   <div style="padding: 20px; background: #fee; color: #c00; font-family: monospace;">
    //     <h2>Initialization Error</h2>
    //     <p><strong>Error:</strong> ${error.message}</p>
    //     <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack || 'No stack trace'}</pre>
    //   </div>
    // `;
    console.error('❌ REACT ERROR FALLBACK DISABLED - Check console for errors');
    
    return false;
  }
}

// Export
window.FixedMobileApp = {
  initFixedMobileApp,
  MobileApp
};

console.log('Fixed mobile app script loaded successfully');
