import type { RedactionAction, ApplyOptions, ApplyResult, Detection, DetectionKind } from '../types';
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
  function drawBox(x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, w, h);
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
  // Draw a label over the region.  Fill a semi‑opaque box then draw
  // the label text centred within.  When the label is too long to fit,
  // truncate and append an ellipsis.
  function drawLabel(x: number, y: number, w: number, h: number, text: string): void {
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'white';
    const fontSize = Math.max(10, Math.floor(h * 0.6));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    // Truncate text if it won't fit
    let label = text;
    const maxWidth = w - 4;
    while (ctx.measureText(label).width > maxWidth && label.length > 1) {
      label = label.slice(0, -1);
    }
    if (label !== text) {
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
    switch (action.style) {
      case 'BLUR':
        drawBlur(x, y, w, h);
        break;
      case 'PIXELATE':
        drawPixelate(x, y, w, h);
        break;
      case 'LABEL':
        drawLabel(x, y, w, h, action.labelText || det.kind);
        break;
      case 'MASK_LAST4':
        drawMaskLast4(x, y, w, h, det.preview);
        break;
      case 'REMOVE_METADATA':
        // Metadata removal is handled by re‑encoding the image; no
        // drawing needed for this redaction.
        break;
      default:
        drawBox(x, y, w, h);
    }
  });
  // Return a data URI without metadata (re‑encoding strips EXIF)
  return canvas.toDataURL('image/jpeg', quality);
}

/** Apply redactions to a PDF.  Returns a Data URI of the new PDF. */
async function applyRedactionsToPdf(file: File | Blob, actions: RedactionAction[], detectionResult?: {detections: Detection[]}): Promise<string> {
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
  const total = origPdf.getPageCount();
  for (let i = 0; i < total; i++) {
    const [copiedPage] = await newPdf.copyPages(origPdf, [i]);
    newPdf.addPage(copiedPage);
    const { width, height } = copiedPage.getSize();
    // Filter actions for this page
    const pageActions = actions.filter(act => {
      const det = detectionMap.get(act.detectionId);
      return det && (det.box.page ?? 0) === i;
    });
    // Draw each redaction.  Always draw a black rectangle; then if the
    // style supports text (LABEL or MASK_LAST4) overlay text on top.
    for (const action of pageActions) {
      const det = detectionMap.get(action.detectionId);
      if (!det) continue;
      const { box } = det;
      const x = box.x * width;
      // Convert from top-left origin to PDF bottom-left origin
      const y = (1 - box.y - box.h) * height;
      const w = box.w * width;
      const h = box.h * height;
      // Draw base rectangle
      copiedPage.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: rgb(0, 0, 0),
        opacity: 1
      });
      // Overlay text for LABEL or MASK_LAST4
      if (action.style === 'LABEL' || action.style === 'MASK_LAST4') {
        let text = '';
        if (action.style === 'LABEL') {
          text = action.labelText || det.kind;
        } else if (action.style === 'MASK_LAST4') {
          const preview = det.preview || '';
          // Mask all but last four alphanumeric characters
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
          text = masked;
        }
        // Ensure font size reasonably scales with height
        const fontSize = Math.max(8, h * 0.6);
        // Constrain text width; if too long, truncate and add ellipsis
        let label = text;
        // pdf-lib drawText does not provide measureText; approximate by
        // character count relative to width and font size
        const maxChars = Math.floor((w - 4) / (fontSize * 0.6));
        if (label.length > maxChars) {
          label = label.slice(0, maxChars > 3 ? maxChars - 1 : 0) + '…';
        }
        // Approximate horizontal centering.  Estimate each character width as
        // 0.6 × fontSize and compute offset relative to the region width.
        const estTextWidth = label.length * fontSize * 0.6;
        const xOffset = (w - estTextWidth) / 2;
        copiedPage.drawText(label, {
          x: x + Math.max(0, xOffset),
          y: y + h / 2 - fontSize / 2,
          size: fontSize,
          color: rgb(1, 1, 1)
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
    fileUri = await applyRedactionsToPdf(file, actions, result);
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
