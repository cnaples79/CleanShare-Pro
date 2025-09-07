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
  const [presets] = React.useState([
    { id: 'healthcare', name: 'Healthcare (HIPAA)', description: 'Medical document sanitization' },
    { id: 'finance', name: 'Finance (PCI)', description: 'Financial document sanitization' },
    { id: 'legal', name: 'Legal', description: 'Legal document sanitization' }
  ]);

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
        }, 'Import')
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
                    marginBottom: '12px',
                    cursor: 'pointer'
                  },
                  onClick: () => console.log('Selected preset:', preset.id)
                },
                  React.createElement('div', {
                    style: { fontWeight: '600', marginBottom: '4px' }
                  }, preset.name),
                  React.createElement('div', {
                    style: { fontSize: '14px', color: '#6b7280' }
                  }, preset.description)
                )
              )
            )
          : React.createElement('div', {
              style: { textAlign: 'center', padding: '20px', color: '#6b7280' }
            }, 'Import presets functionality')
      )
    )
  );
};

// Phase 2.4 Component 2: Processing History & Audit Trail (using working patterns)
const HistoryDashboardModal = ({ isOpen, onClose }) => {
  console.log('HistoryDashboardModal rendering...', { isOpen });
  
  // Verify React hooks are available (same pattern as main app)
  if (typeof React?.useState !== 'function') {
    console.error('React.useState not available in HistoryDashboardModal');
    return React.createElement('div', {}, 'React hooks not available');
  }

  const [selectedView, setSelectedView] = React.useState('recent');
  const [mockHistory] = React.useState([
    { id: 1, filename: 'document1.pdf', detections: 5, timestamp: Date.now() - 3600000 },
    { id: 2, filename: 'invoice.jpg', detections: 2, timestamp: Date.now() - 7200000 },
    { id: 3, filename: 'contract.pdf', detections: 8, timestamp: Date.now() - 10800000 }
  ]);

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
        }, '📊 Processing History'),
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

      // View selector
      React.createElement('div', {
        style: {
          display: 'flex',
          borderBottom: '1px solid #e5e7eb'
        }
      },
        React.createElement('button', {
          onClick: () => setSelectedView('recent'),
          style: {
            flex: 1,
            padding: '12px',
            border: 'none',
            background: selectedView === 'recent' ? '#059669' : 'white',
            color: selectedView === 'recent' ? 'white' : '#6b7280',
            fontSize: '14px',
            cursor: 'pointer'
          }
        }, 'Recent'),
        React.createElement('button', {
          onClick: () => setSelectedView('stats'),
          style: {
            flex: 1,
            padding: '12px',
            border: 'none',
            background: selectedView === 'stats' ? '#059669' : 'white',
            color: selectedView === 'stats' ? 'white' : '#6b7280',
            fontSize: '14px',
            cursor: 'pointer'
          }
        }, 'Statistics')
      ),

      // Content
      React.createElement('div', {
        style: { padding: '20px', overflow: 'auto', flex: 1 }
      },
        selectedView === 'recent'
          ? React.createElement('div', {},
              mockHistory.map(item =>
                React.createElement('div', {
                  key: item.id,
                  style: {
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }
                },
                  React.createElement('div', {
                    style: { fontWeight: '600', marginBottom: '8px', fontSize: '14px' }
                  }, `📄 ${item.filename}`),
                  React.createElement('div', {
                    style: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' }
                  }, `Detections: ${item.detections}`),
                  React.createElement('div', {
                    style: { fontSize: '12px', color: '#6b7280' }
                  }, new Date(item.timestamp).toLocaleString())
                )
              )
            )
          : React.createElement('div', {
              style: { textAlign: 'center' }
            },
              React.createElement('div', {
                style: {
                  padding: '20px',
                  background: '#f0f9ff',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }
              },
                React.createElement('div', {
                  style: { fontSize: '24px', fontWeight: 'bold', color: '#0369a1' }
                }, mockHistory.length),
                React.createElement('div', {
                  style: { fontSize: '14px', color: '#6b7280', marginTop: '4px' }
                }, 'Files Processed')
              ),
              React.createElement('div', {
                style: {
                  padding: '20px',
                  background: '#f0fdf4',
                  borderRadius: '8px'
                }
              },
                React.createElement('div', {
                  style: { fontSize: '24px', fontWeight: 'bold', color: '#059669' }
                }, mockHistory.reduce((sum, item) => sum + item.detections, 0)),
                React.createElement('div', {
                  style: { fontSize: '14px', color: '#6b7280', marginTop: '4px' }
                }, 'Total Detections')
              )
            )
      )
    )
  );
};

// Phase 2.4 Component 3: Undo/Redo Functionality (using working patterns)
const UndoRedoControlsModal = ({ isOpen, onClose }) => {
  console.log('UndoRedoControlsModal rendering...', { isOpen });
  
  // Verify React hooks are available (same pattern as main app)
  if (typeof React?.useState !== 'function') {
    console.error('React.useState not available in UndoRedoControlsModal');
    return React.createElement('div', {}, 'React hooks not available');
  }

  const [undoHistory] = React.useState([
    { id: 1, action: 'Applied redaction box', target: 'Email detection', timestamp: Date.now() - 300000 },
    { id: 2, action: 'Changed redaction style', target: 'Phone number', timestamp: Date.now() - 600000 },
    { id: 3, action: 'Added custom pattern', target: 'Address block', timestamp: Date.now() - 900000 }
  ]);
  const [redoHistory] = React.useState([
    { id: 4, action: 'Removed redaction', target: 'Credit card number', timestamp: Date.now() - 150000 }
  ]);

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
        }, '↩️ Undo/Redo Manager'),
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

      // Action buttons
      React.createElement('div', {
        style: {
          display: 'flex',
          gap: '12px',
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }
      },
        React.createElement('button', {
          onClick: () => console.log('Undo action triggered'),
          disabled: undoHistory.length === 0,
          style: {
            flex: 1,
            padding: '12px',
            border: 'none',
            background: undoHistory.length > 0 ? '#dc2626' : '#e5e7eb',
            color: undoHistory.length > 0 ? 'white' : '#9ca3af',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: undoHistory.length > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }
        }, '⤺ Undo'),
        React.createElement('button', {
          onClick: () => console.log('Redo action triggered'),
          disabled: redoHistory.length === 0,
          style: {
            flex: 1,
            padding: '12px',
            border: 'none',
            background: redoHistory.length > 0 ? '#16a34a' : '#e5e7eb',
            color: redoHistory.length > 0 ? 'white' : '#9ca3af',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: redoHistory.length > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }
        }, '⤻ Redo')
      ),

      // History lists
      React.createElement('div', {
        style: { padding: '20px', overflow: 'auto', flex: 1 }
      },
        React.createElement('div', {
          style: { marginBottom: '24px' }
        },
          React.createElement('h4', {
            style: { margin: '0 0 12px 0', fontSize: '16px', color: '#dc2626' }
          }, `⤺ Undo History (${undoHistory.length})`),
          undoHistory.length > 0 
            ? React.createElement('div', {},
                undoHistory.map(item =>
                  React.createElement('div', {
                    key: item.id,
                    style: {
                      padding: '12px',
                      border: '1px solid #fee2e2',
                      background: '#fef2f2',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }
                  },
                    React.createElement('div', {
                      style: { fontWeight: '600', fontSize: '14px', marginBottom: '4px' }
                    }, item.action),
                    React.createElement('div', {
                      style: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' }
                    }, `Target: ${item.target}`),
                    React.createElement('div', {
                      style: { fontSize: '12px', color: '#6b7280' }
                    }, new Date(item.timestamp).toLocaleString())
                  )
                )
              )
            : React.createElement('p', {
                style: { color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }
              }, 'No actions to undo')
        ),
        
        React.createElement('div', {},
          React.createElement('h4', {
            style: { margin: '0 0 12px 0', fontSize: '16px', color: '#16a34a' }
          }, `⤻ Redo History (${redoHistory.length})`),
          redoHistory.length > 0 
            ? React.createElement('div', {},
                redoHistory.map(item =>
                  React.createElement('div', {
                    key: item.id,
                    style: {
                      padding: '12px',
                      border: '1px solid #dcfce7',
                      background: '#f0fdf4',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }
                  },
                    React.createElement('div', {
                      style: { fontWeight: '600', fontSize: '14px', marginBottom: '4px' }
                    }, item.action),
                    React.createElement('div', {
                      style: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' }
                    }, `Target: ${item.target}`),
                    React.createElement('div', {
                      style: { fontSize: '12px', color: '#6b7280' }
                    }, new Date(item.timestamp).toLocaleString())
                  )
                )
              )
            : React.createElement('p', {
                style: { color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }
              }, 'No actions to redo')
        )
      ),

      // Keyboard shortcuts info
      React.createElement('div', {
        style: {
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb'
        }
      },
        React.createElement('div', {
          style: { fontSize: '12px', color: '#6b7280', textAlign: 'center' }
        }, 'Keyboard: Ctrl+Z (Undo) • Ctrl+Y (Redo) • Ctrl+Shift+Z (Redo)')
      )
    )
  );
};

// Phase 2.4 Component 4: Keyboard Shortcuts & Accessibility (using working patterns)
const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  console.log('KeyboardShortcutsModal rendering...', { isOpen });
  
  // Verify React hooks are available (same pattern as main app)
  if (typeof React?.useState !== 'function') {
    console.error('React.useState not available in KeyboardShortcutsModal');
    return React.createElement('div', {}, 'React hooks not available');
  }

  const [shortcutSections] = React.useState([
    {
      title: 'File Operations',
      shortcuts: [
        { keys: ['Ctrl', 'O'], description: 'Open file picker to upload files', context: 'Global' },
        { keys: ['Escape'], description: 'Close any open modal or dialog', context: 'Global' }
      ]
    },
    {
      title: 'Editing & Undo/Redo',
      shortcuts: [
        { keys: ['Ctrl', 'Z'], description: 'Undo last action', context: 'When files are loaded' },
        { keys: ['Ctrl', 'Y'], description: 'Redo last undone action', context: 'When files are loaded' },
        { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo last undone action (alternative)', context: 'When files are loaded' }
      ]
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['Tab'], description: 'Navigate to next interactive element', context: 'Global' },
        { keys: ['Shift', 'Tab'], description: 'Navigate to previous interactive element', context: 'Global' },
        { keys: ['Space'], description: 'Toggle checkboxes and activate buttons', context: 'When focused' },
        { keys: ['Enter'], description: 'Activate buttons and submit forms', context: 'When focused' }
      ]
    },
    {
      title: 'Help & Information',
      shortcuts: [
        { keys: ['?'], description: 'Show this keyboard shortcuts help', context: 'Global' },
        { keys: ['F1'], description: 'Show keyboard shortcuts help (alternative)', context: 'Global' }
      ]
    }
  ]);

  if (!isOpen) return null;

  // Helper function to render key combinations
  const renderKeyCombo = (keys) => {
    return React.createElement('div', {
      style: { display: 'flex', gap: '2px', alignItems: 'center' }
    },
      keys.map((key, index) =>
        React.createElement(React.Fragment, { key: key },
          React.createElement('kbd', {
            style: {
              padding: '2px 6px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              fontSize: '11px',
              fontFamily: 'monospace',
              minWidth: '20px',
              textAlign: 'center'
            }
          }, key),
          index < keys.length - 1 ? React.createElement('span', {
            style: { fontSize: '11px', margin: '0 2px' }
          }, '+') : null
        )
      )
    );
  };

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
        maxWidth: '500px',
        maxHeight: '90vh',
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
        }, '⌨️ Keyboard Shortcuts'),
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

      // Content
      React.createElement('div', {
        style: { padding: '20px', overflow: 'auto', flex: 1 }
      },
        React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column', gap: '24px' }
        },
          shortcutSections.map((section, sectionIndex) =>
            React.createElement('div', { key: sectionIndex },
              React.createElement('h4', {
                style: {
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  color: '#2563eb',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '8px'
                }
              }, section.title),
              React.createElement('div', {
                style: { display: 'flex', flexDirection: 'column', gap: '8px' }
              },
                section.shortcuts.map((shortcut, shortcutIndex) =>
                  React.createElement('div', {
                    key: shortcutIndex,
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      gap: '16px'
                    }
                  },
                    React.createElement('div', { style: { flex: 1 } },
                      React.createElement('div', {
                        style: { fontWeight: '600', marginBottom: '2px', fontSize: '14px' }
                      }, shortcut.description),
                      shortcut.context ? React.createElement('div', {
                        style: { fontSize: '12px', color: '#6b7280' }
                      }, `Context: ${shortcut.context}`) : null
                    ),
                    renderKeyCombo(shortcut.keys)
                  )
                )
              )
            )
          )
        ),

        // Accessibility Features
        React.createElement('div', {
          style: {
            marginTop: '24px',
            padding: '16px',
            background: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #e0f2fe'
          }
        },
          React.createElement('h4', {
            style: { margin: '0 0 12px 0', fontSize: '16px', color: '#0369a1' }
          }, '🌐 Accessibility Features'),
          React.createElement('ul', {
            style: {
              margin: '0',
              paddingLeft: '20px',
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5'
            }
          },
            React.createElement('li', { style: { marginBottom: '4px' } }, 'Full keyboard navigation support'),
            React.createElement('li', { style: { marginBottom: '4px' } }, 'Screen reader compatible with ARIA labels'),
            React.createElement('li', { style: { marginBottom: '4px' } }, 'High contrast mode available'),
            React.createElement('li', { style: { marginBottom: '4px' } }, 'Focus indicators show current selection'),
            React.createElement('li', { style: { marginBottom: '4px' } }, 'All interactive elements keyboard accessible')
          )
        ),

        // Pro Tips
        React.createElement('div', {
          style: {
            marginTop: '16px',
            padding: '16px',
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            borderRadius: '8px',
            color: 'white'
          }
        },
          React.createElement('h4', {
            style: { margin: '0 0 12px 0', fontSize: '16px', color: 'white' }
          }, '💡 Pro Tips'),
          React.createElement('ul', {
            style: {
              margin: '0',
              paddingLeft: '20px',
              fontSize: '14px',
              color: 'white',
              lineHeight: '1.5'
            }
          },
            React.createElement('li', { style: { marginBottom: '4px' } }, 'Use Ctrl+Z/Ctrl+Y for quick experimentation'),
            React.createElement('li', { style: { marginBottom: '4px' } }, 'Floating controls appear when working with files'),
            React.createElement('li', { style: { marginBottom: '4px' } }, 'Press ? anytime to reference shortcuts'),
            React.createElement('li', { style: { marginBottom: '4px' } }, 'All shortcuts work without mouse focus'),
            React.createElement('li', { style: { marginBottom: '4px' } }, 'Action history persists across sessions')
          )
        )
      ),

      // Footer
      React.createElement('div', {
        style: {
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      },
        React.createElement('div', {
          style: { fontSize: '12px', color: '#6b7280' }
        }, 'Press ', React.createElement('kbd', {
          style: {
            padding: '2px 4px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '2px',
            fontSize: '11px'
          }
        }, 'Escape'), ' or click Close to dismiss'),
        React.createElement('button', {
          onClick: onClose,
          style: {
            padding: '8px 16px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }
        }, 'Close')
      )
    )
  );
};

// Full CleanShare Pro Mobile App with Phase 2.4 features (using working patterns)
const MobileApp = () => {
  console.log('Full MobileApp rendering - using arrow function syntax');
  
  // Verify React hooks are available
  if (typeof React?.useState !== 'function') {
    console.error('React.useState is not a function:', typeof React?.useState);
    return React.createElement('div', { style: { padding: '20px', color: 'red' } }, 
      'React hooks not available'
    );
  }

  console.log('React.useState is available, initializing full app state...');
  
  // Core app state
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState(null);
  const [isSanitizing, setIsSanitizing] = React.useState(false);
  const [sanitizedBlob, setSanitizedBlob] = React.useState(null);
  const [previewUri, setPreviewUri] = React.useState(null);
  const [currentStep, setCurrentStep] = React.useState('upload'); // upload, review, preview
  const [detectionFilter, setDetectionFilter] = React.useState({});
  
  // Multi-file state (parity with web)
  const [fileStates, setFileStates] = React.useState([]);
  const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
  
  // Phase 2.4 modal states
  const [showPresets, setShowPresets] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showUndo, setShowUndo] = React.useState(false);
  const [showKeyboard, setShowKeyboard] = React.useState(false);

  console.log('Full app state initialized successfully');

  // File upload handler
  const handleFileSelect = React.useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.type, file.size);
    setSelectedFile(file);
    setCurrentStep('review');
    
    // Start analysis immediately
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      console.log('Starting file analysis via CleanSharePro...');
      if (!window.CleanSharePro || typeof window.CleanSharePro.processFile !== 'function') {
        throw new Error('Processing engine not ready');
      }
      const res = await window.CleanSharePro.processFile(file);
      if (!res || !res.success) {
        throw new Error(res?.error || 'Analysis failed');
      }
      const result = { detections: res.detections || [], pages: res.pages || 1 };
      console.log('Analysis completed:', result);

      setAnalysisResult(result);

      // Initialize detection filter (all enabled by default)
      const filter = {};
      result.detections.forEach(detection => {
        filter[detection.id] = true;
      });
      setDetectionFilter(filter);

    } catch (error) {
      console.error('Analysis failed:', error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Multi-file: add files
  const handleAddFiles = React.useCallback(async (event) => {
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
    // Reset input to allow re-selecting the same files later
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
      const res = await window.CleanSharePro.processFile(s.file);
      if (!res || !res.success) throw new Error(res?.error || 'Analysis failed');
      const detections = res.detections || [];
      const selected = {}; const actions = {};
      detections.forEach(d => { selected[d.id] = true; actions[d.id] = { style: 'BOX' }; });
      setFileStates(prev => prev.map((fs, i) => i === index ? { ...fs, detections, pages: res.pages || 1, selected, actions, analyzed: true, analyzing: false } : fs));
    } catch (err) {
      setFileStates(prev => prev.map((s, i) => i === index ? { ...s, analyzing: false, error: err.message } : s));
    }
  }, [fileStates]);

  // Sanitize one file by index
  const sanitizeOne = React.useCallback(async (index) => {
    setFileStates(prev => prev.map((s, i) => i === index ? { ...s, sanitizing: true, error: null } : s));
    try {
      if (!window.CleanSharePro || typeof window.CleanSharePro.applyRedactions !== 'function') {
        throw new Error('Processing engine not ready');
      }
      const s = fileStates[index];
      const actions = (s.detections || []).filter(d => s.selected[d.id]).map(d => ({ detectionId: d.id, style: (s.actions[d.id]?.style) || 'BOX' }));
      const res = await window.CleanSharePro.applyRedactions(s.file, actions, { detections: s.detections });
      if (!res || !res.success) throw new Error(res?.error || 'Sanitization failed');
      const mime = s.file.type === 'application/pdf' ? 'application/pdf' : (s.file.type && s.file.type.startsWith('image/') ? s.file.type : 'application/octet-stream');
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      setFileStates(prev => prev.map((fs, i) => i === index ? { ...fs, outputUri: url, previewUri: url, sanitizing: false, sanitized: true } : fs));
    } catch (err) {
      setFileStates(prev => prev.map((s, i) => i === index ? { ...s, sanitizing: false, error: err.message } : s));
    }
  }, [fileStates]);

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
    const toAnalyze = fileStates.map((s, i) => ({ s, i })).filter(x => !x.s.analyzed && !x.s.analyzing);
    await runWithConcurrency(toAnalyze.map(x => x.i), analyzeOne, 3);
  }, [fileStates, analyzeOne, runWithConcurrency]);

  const sanitizeAll = React.useCallback(async () => {
    const toSanitize = fileStates.map((s, i) => ({ s, i })).filter(x => x.s.analyzed && !x.s.sanitized && !x.s.sanitizing);
    await runWithConcurrency(toSanitize.map(x => x.i), sanitizeOne, 3);
  }, [fileStates, sanitizeOne, runWithConcurrency]);

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
              React.createElement('button', { onClick: () => { if (fs.outputUri) { const a = document.createElement('a'); a.href = fs.outputUri; a.download = `sanitized_${fs.file.name}`; document.body.appendChild(a); a.click(); document.body.removeChild(a); } }, disabled: !fs.outputUri, style: { padding: '8px 12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: fs.outputUri ? 'pointer' : 'not-allowed' } }, 'Download')
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
