import type { RedactionAction, ApplyOptions, ApplyResult, Detection, DetectionKind, RedactionConfig } from '../types';
import { analyzeDocument as analyze } from './analyze';
import type { AnalyzeOptions, AnalyzeResult } from '../types';
import { PDFDocument, rgb } from 'pdf-lib';

// A module‑scoped variable to store the last analysis result.  applyRedactions()
// uses this map to resolve detection IDs to bounding boxes.  In a real
// application you should pass the detections directly to avoid shared
// mutable state.  This simplified implementation is sufficient for the
// demonstration.
let lastResult: AnalyzeResult | null = null;

/** Override the exported analyse function to capture the last result. */
export async function analyzeDocument(file: File | Blob, opts: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  const result = await analyze(file, opts);
  lastResult = result;
  return result;
}

/** Internal helper: convert a canvas to a data URI. */
function canvasToDataURL(canvas: HTMLCanvasElement, mimeType = 'image/png', quality = 0.92): string {
  return canvas.toDataURL(mimeType, quality);
}

/** Internal helper: convert a File/Blob into a HTMLImageElement. */
async function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
  const dataURL = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise<void>(resolve => {
    img.onload = () => resolve();
    img.src = dataURL;
  });
  return img;
}

/** Apply redactions to an image.  Returns a Data URI. */
async function applyRedactionsToImage(file: File | Blob, actions: RedactionAction[], quality = 0.92, detectionResult?: {detections: Detection[]}): Promise<string> {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot obtain 2D context');
  // Draw original image
  ctx.drawImage(img, 0, 0);
  // Build detection map
  const map = new Map<string, Detection>();
  const detectionsToUse = detectionResult || lastResult;
  if (detectionsToUse) {
    for (const det of detectionsToUse.detections) {
      map.set(det.id, det);
    }
  }
  // Utility helpers for drawing various redaction styles on images
  function drawBox(x: number, y: number, w: number, h: number, config: RedactionConfig = {}): void {
    const color = config.color || 'black';
    const opacity = config.opacity ?? 1.0;
    const cornerRadius = config.cornerRadius || 0;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    
    if (cornerRadius > 0) {
      // Draw rounded rectangle
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, cornerRadius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
    
    // Add border if specified
    if (config.borderWidth && config.borderColor) {
      ctx.lineWidth = config.borderWidth;
      ctx.strokeStyle = config.borderColor;
      if (cornerRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, cornerRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
      }
    }
    
    ctx.restore();
  }

  // Enhanced solid color redaction with configuration support
  function drawSolidColor(x: number, y: number, w: number, h: number, config: RedactionConfig = {}): void {
    drawBox(x, y, w, h, config);
  }

  // Gradient redaction
  function drawGradient(x: number, y: number, w: number, h: number, config: RedactionConfig = {}): void {
    const color1 = config.color || 'black';
    const color2 = config.secondaryColor || 'gray';
    const opacity = config.opacity ?? 1.0;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    
    ctx.fillStyle = gradient;
    
    if (config.cornerRadius && config.cornerRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, config.cornerRadius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
    
    ctx.restore();
  }

  // Pattern redaction
  function drawPattern(x: number, y: number, w: number, h: number, config: RedactionConfig = {}): void {
    const color = config.color || 'black';
    const opacity = config.opacity ?? 1.0;
    const patternType = config.patternType || 'diagonal';
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Fill background first
    ctx.fillStyle = config.secondaryColor || '#f0f0f0';
    ctx.fillRect(x, y, w, h);
    
    // Draw pattern
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    switch (patternType) {
      case 'diagonal':
        for (let i = -h; i < w + h; i += 8) {
          ctx.beginPath();
          ctx.moveTo(x + i, y);
          ctx.lineTo(x + i + h, y + h);
          ctx.stroke();
        }
        break;
        
      case 'dots':
        const dotSize = 3;
        const spacing = 8;
        ctx.fillStyle = color;
        for (let dx = 0; dx < w; dx += spacing) {
          for (let dy = 0; dy < h; dy += spacing) {
            ctx.beginPath();
            ctx.arc(x + dx + spacing/2, y + dy + spacing/2, dotSize/2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
        
      case 'cross-hatch':
        // Diagonal lines one way
        for (let i = -h; i < w + h; i += 6) {
          ctx.beginPath();
          ctx.moveTo(x + i, y);
          ctx.lineTo(x + i + h, y + h);
          ctx.stroke();
        }
        // Diagonal lines the other way
        for (let i = 0; i < w + h; i += 6) {
          ctx.beginPath();
          ctx.moveTo(x + i, y + h);
          ctx.lineTo(x + i - h, y);
          ctx.stroke();
        }
        break;
        
      case 'waves':
        ctx.beginPath();
        for (let i = 0; i < w; i += 2) {
          const wave = Math.sin((i / w) * Math.PI * 4) * (h * 0.2);
          if (i === 0) {
            ctx.moveTo(x + i, y + h/2 + wave);
          } else {
            ctx.lineTo(x + i, y + h/2 + wave);
          }
        }
        ctx.stroke();
        break;
        
      case 'noise':
        ctx.fillStyle = color;
        for (let i = 0; i < w * h / 20; i++) {
          const nx = x + Math.random() * w;
          const ny = y + Math.random() * h;
          ctx.beginPath();
          ctx.arc(nx, ny, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
    
    ctx.restore();
  }
  // Apply a CSS blur filter to a region by drawing the original image with
  // the filter enabled only for that region.  Canvas 2D `filter` is
  // supported in modern browsers.  We temporarily clip the context to
  // restrict the blur effect to the redaction box.
  function drawBlur(x: number, y: number, w: number, h: number): void {
    ctx.save();
    ctx.filter = 'blur(8px)';
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
  // Pixelate by drawing the region scaled down and back up.  Choose a
  // pixel size relative to region size to maintain some obfuscation but
  // not degrade performance too much.
  function drawPixelate(x: number, y: number, w: number, h: number): void {
    const pixelSize = Math.max(4, Math.floor(Math.min(w, h) / 10));
    // Create a temporary canvas to hold the region scaled down
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.max(1, Math.floor(w / pixelSize));
    tempCanvas.height = Math.max(1, Math.floor(h / pixelSize));
    const tctx = tempCanvas.getContext('2d');
    if (!tctx) {
      drawBox(x, y, w, h);
      return;
    }
    // Draw the region scaled down onto the temp canvas
    tctx.drawImage(
      img,
      x,
      y,
      w,
      h,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );
    // Now draw the scaled up version onto the main canvas to pixelate
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      tempCanvas,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
      x,
      y,
      w,
      h
    );
    ctx.imageSmoothingEnabled = true;
  }
  // Enhanced label drawing with configuration support
  function drawLabel(x: number, y: number, w: number, h: number, text: string, config: RedactionConfig = {}): void {
    ctx.save();
    
    const bgColor = config.color || 'black';
    const textColor = config.secondaryColor || 'white';
    const opacity = config.opacity ?? 1.0;
    const fontSize = config.fontSize || Math.max(10, Math.floor(h * 0.6));
    const fontFamily = config.fontFamily || 'sans-serif';
    const cornerRadius = config.cornerRadius || 0;
    
    ctx.globalAlpha = opacity;
    
    // Draw background with optional rounded corners
    ctx.fillStyle = bgColor;
    if (cornerRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, cornerRadius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
    
    // Add shadow if specified
    if (config.shadow) {
      ctx.shadowOffsetX = config.shadow.offsetX;
      ctx.shadowOffsetY = config.shadow.offsetY;
      ctx.shadowBlur = config.shadow.blur;
      ctx.shadowColor = config.shadow.color;
    }
    
    // Draw text
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // Truncate text if it won't fit
    let label = text;
    const maxWidth = w - 8; // More padding for better appearance
    while (ctx.measureText(label).width > maxWidth && label.length > 1) {
      label = label.slice(0, -1);
    }
    if (label !== text && label.length > 0) {
      label = label.slice(0, -1) + '…';
    }
    
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.restore();
  }
  // Draw a mask that obscures all but the last four characters of the
  // provided preview text.  The mask uses asterisks for the hidden
  // portion.  Non‑digit characters are preserved in their positions.
  function drawMaskLast4(x: number, y: number, w: number, h: number, preview?: string): void {
    const text = preview || '';
    // Keep only last 4 alphanumeric characters; replace preceding
    // characters (letters or digits) with asterisks but preserve spaces and other symbols.
    let masked = '';
    let remaining = 4;
    for (let i = text.length - 1; i >= 0; i--) {
      const ch = text[i];
      if (/\w/.test(ch) && remaining > 0) {
        masked = ch + masked;
        remaining--;
      } else if (/\w/.test(ch)) {
        masked = '*' + masked;
      } else {
        masked = ch + masked;
      }
    }
    drawLabel(x, y, w, h, masked);
  }
  // Draw redactions using the selected style for each action.  If the
  // style is not recognised, fallback to a solid box.
  actions.forEach(action => {
    const det = map.get(action.detectionId);
    if (!det) return;
    const { box } = det;
    const x = box.x * canvas.width;
    const y = box.y * canvas.height;
    const w = box.w * canvas.width;
    const h = box.h * canvas.height;
    const config = action.config || {};
    
    switch (action.style) {
      case 'BLUR':
        drawBlur(x, y, w, h);
        break;
      case 'PIXELATE':
        drawPixelate(x, y, w, h);
        break;
      case 'LABEL':
        const labelText = config.labelText || action.labelText || det.kind;
        drawLabel(x, y, w, h, labelText, config);
        break;
      case 'MASK_LAST4':
        drawMaskLast4(x, y, w, h, det.preview);
        break;
      case 'PATTERN':
        drawPattern(x, y, w, h, config);
        break;
      case 'GRADIENT':
        drawGradient(x, y, w, h, config);
        break;
      case 'SOLID_COLOR':
        drawSolidColor(x, y, w, h, config);
        break;
      case 'VECTOR_OVERLAY':
        // Vector overlay for images - for now, fall back to enhanced box
        drawBox(x, y, w, h, config);
        break;
      case 'REMOVE_METADATA':
        // Metadata removal is handled by re‑encoding the image; no
        // drawing needed for this redaction.
        break;
      case 'BOX':
      default:
        drawBox(x, y, w, h, config);
    }
  });
  
  // Apply image sanitization options
  let outputFormat = 'image/jpeg';
  let outputQuality = quality;
  
  // Always re-encode to strip EXIF/metadata by default
  // The canvas.toDataURL() method automatically strips metadata
  return canvas.toDataURL(outputFormat, outputQuality);
}

/** Enhanced vector-based PDF redaction with advanced styling support */
async function applyRedactionsToPdf(file: File | Blob, actions: RedactionAction[], detectionResult?: {detections: Detection[]}, options: ApplyOptions = {}): Promise<string> {
  const origBytes = await file.arrayBuffer();
  const origPdf = await PDFDocument.load(origBytes);
  const newPdf = await PDFDocument.create();
  const detectionMap = new Map<string, Detection>();
  const detectionsToUse = detectionResult || lastResult;
  
  if (detectionsToUse) {
    for (const det of detectionsToUse.detections) {
      detectionMap.set(det.id, det);
    }
  }

  // Helper function to parse hex color to RGB values for pdf-lib
  function parseColorToRGB(hexColor: string): [number, number, number] {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;  
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b];
  }

  // Apply document sanitization if requested
  if (options.sanitization) {
    if (options.sanitization.removeMetadata) {
      // Remove PDF metadata
      newPdf.setTitle('');
      newPdf.setAuthor('');
      newPdf.setSubject('');
      newPdf.setKeywords([]);
      newPdf.setProducer('');
      newPdf.setCreator('');
      try {
        newPdf.setCreationDate(new Date(0));
        newPdf.setModificationDate(new Date(0));
      } catch (e) {
        // Some PDF operations might fail, continue with redaction
        console.warn('Could not set PDF dates:', e);
      }
    }
  }

  const total = origPdf.getPageCount();
  for (let i = 0; i < total; i++) {
    const [copiedPage] = await newPdf.copyPages(origPdf, [i]);
    const page = newPdf.addPage(copiedPage);
    const { width, height } = page.getSize();
    
    // Remove annotations if requested
    if (options.sanitization?.removeAnnotations) {
      // Note: pdf-lib doesn't have direct annotation removal API
      // This would need custom implementation or different library
    }
    
    // Filter actions for this page
    const pageActions = actions.filter(act => {
      const det = detectionMap.get(act.detectionId);
      return det && (det.box.page ?? 0) === i;
    });

    // Apply vector-based redactions
    for (const action of pageActions) {
      const det = detectionMap.get(action.detectionId);
      if (!det) continue;
      
      const { box } = det;
      const config = action.config || {};
      
      const x = box.x * width;
      // Convert from top-left origin to PDF bottom-left origin
      const y = (1 - box.y - box.h) * height;
      const w = box.w * width;
      const h = box.h * height;
      
      // Parse colors
      const primaryRGB = config.color ? parseColorToRGB(config.color) : [0, 0, 0];
      const secondaryRGB = config.secondaryColor ? parseColorToRGB(config.secondaryColor) : [1, 1, 1];
      const opacity = config.opacity ?? 1.0;
      
      switch (action.style) {
        case 'BOX':
        case 'SOLID_COLOR':
          page.drawRectangle({
            x, y, width: w, height: h,
            color: rgb(primaryRGB[0], primaryRGB[1], primaryRGB[2]),
            opacity,
            borderColor: config.borderColor ? rgb(...parseColorToRGB(config.borderColor)) : undefined,
            borderWidth: config.borderWidth || 0
          });
          break;
          
        case 'GRADIENT':
          // PDF gradients are complex - use solid color for now
          page.drawRectangle({
            x, y, width: w, height: h,
            color: rgb(primaryRGB[0], primaryRGB[1], primaryRGB[2]),
            opacity
          });
          break;
          
        case 'PATTERN':
          // Draw background
          page.drawRectangle({
            x, y, width: w, height: h,
            color: rgb(secondaryRGB[0], secondaryRGB[1], secondaryRGB[2]),
            opacity
          });
          
          // Add pattern overlay
          const patternType = config.patternType || 'diagonal';
          const lineColor = rgb(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
          
          if (patternType === 'diagonal') {
            for (let offset = -h; offset < w + h; offset += 8) {
              page.drawLine({
                start: { x: x + offset, y: y },
                end: { x: x + offset + h, y: y + h },
                color: lineColor,
                thickness: 2,
                opacity
              });
            }
          }
          break;
          
        case 'VECTOR_OVERLAY':
          // Enhanced vector redaction with proper PDF vector operations
          page.drawRectangle({
            x, y, width: w, height: h,
            color: rgb(primaryRGB[0], primaryRGB[1], primaryRGB[2]),
            opacity,
            borderColor: config.borderColor ? rgb(...parseColorToRGB(config.borderColor)) : undefined,
            borderWidth: config.borderWidth || 0
          });
          break;
          
        case 'LABEL':
          // Draw background
          page.drawRectangle({
            x, y, width: w, height: h,
            color: rgb(primaryRGB[0], primaryRGB[1], primaryRGB[2]),
            opacity
          });
          
          // Draw text
          const labelText = config.labelText || action.labelText || det.kind;
          const fontSize = config.fontSize || Math.max(8, h * 0.6);
          const maxChars = Math.floor((w - 8) / (fontSize * 0.6));
          let label = labelText;
          
          if (label.length > maxChars) {
            label = label.slice(0, maxChars > 3 ? maxChars - 1 : 0) + '…';
          }
          
          const estTextWidth = label.length * fontSize * 0.6;
          const xOffset = (w - estTextWidth) / 2;
          
          page.drawText(label, {
            x: x + Math.max(0, xOffset),
            y: y + h / 2 - fontSize / 2,
            size: fontSize,
            color: rgb(secondaryRGB[0], secondaryRGB[1], secondaryRGB[2]),
            opacity
          });
          break;
          
        case 'MASK_LAST4':
          // Draw background
          page.drawRectangle({
            x, y, width: w, height: h,
            color: rgb(primaryRGB[0], primaryRGB[1], primaryRGB[2]),
            opacity
          });
          
          // Create masked text
          const preview = det.preview || '';
          let masked = '';
          let remaining = 4;
          for (let i = preview.length - 1; i >= 0; i--) {
            const ch = preview[i];
            if (/\w/.test(ch) && remaining > 0) {
              masked = ch + masked;
              remaining--;
            } else if (/\w/.test(ch)) {
              masked = '*' + masked;
            } else {
              masked = ch + masked;
            }
          }
          
          const maskFontSize = Math.max(8, h * 0.6);
          const maskTextWidth = masked.length * maskFontSize * 0.6;
          const maskXOffset = (w - maskTextWidth) / 2;
          
          page.drawText(masked, {
            x: x + Math.max(0, maskXOffset),
            y: y + h / 2 - maskFontSize / 2,
            size: maskFontSize,
            color: rgb(secondaryRGB[0], secondaryRGB[1], secondaryRGB[2]),
            opacity
          });
          break;
          
        default:
          // Default to solid rectangle
          page.drawRectangle({
            x, y, width: w, height: h,
            color: rgb(primaryRGB[0], primaryRGB[1], primaryRGB[2]),
            opacity: opacity
          });
      }
    }
  }
  
  const pdfBytes = await newPdf.save();
  const base64 = typeof Buffer !== 'undefined' ? Buffer.from(pdfBytes).toString('base64') : btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
  return `data:application/pdf;base64,${base64}`;
}

/**
 * Apply redactions to a file using the previously analysed detections.
 *
 * Note: This implementation relies on `lastResult` set by analyzeDocument().
 * In a real application you should pass the detections explicitly to avoid
 * hidden state.
 */
export async function applyRedactions(file: File | Blob, actions: RedactionAction[], opts: ApplyOptions, detections?: Detection[]): Promise<ApplyResult> {
  // If detections are provided directly, create a temporary result object
  let result = lastResult;
  if (detections && detections.length > 0) {
    result = {
      detections: detections,
      pages: Math.max(...detections.map(d => d.box.page ?? 0)) + 1 || 1
    };
  }
  
  if (!result) {
    throw new Error('No analysis result available.  Call analyzeDocument() first.');
  }
  const mime = (file as any).type || '';
  let fileUri: string;
  if (mime === 'application/pdf' || opts.output === 'pdf') {
    fileUri = await applyRedactionsToPdf(file, actions, result, opts);
  } else {
    const quality = opts.quality ?? 0.92;
    fileUri = await applyRedactionsToImage(file, actions, quality, result);
  }
  // Build a simple report summarising redactions
  const report: any = {};
  if (result) {
    report.totalDetections = result.detections.length;
    report.redactedCount = actions.length;
    const counts: Record<string, number> = {};
    for (const action of actions) {
      const det = result.detections.find(d => d.id === action.detectionId);
      if (det) {
        counts[det.kind] = (counts[det.kind] || 0) + 1;
      }
    }
    report.byKind = counts;
  }
  return { fileUri, report };
}
