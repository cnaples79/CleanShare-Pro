import { detectToken } from '../detectors';
import type { InputFile, AnalyzeOptions, AnalyzeResult, Detection, DetectionKind, Box } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
// Barcode detection library.  jsQR is a small library that can scan QR codes
// and linear barcodes from image pixel data.  It returns the location of the
// detected code if one is found.  See https://github.com/cozmo/jsQR for details.
import jsQR from 'jsqr';

// Import preset utilities to allow filtering detections based on enabled kinds
import { getPreset } from '../presets';

/*
 * The analyse pipeline orchestrates OCR and token detection for both images
 * and PDFs.  It uses native OCR when available (via Capacitor plugins) and
 * falls back to Tesseract.js running in the browser or a web worker.  PDF
 * pages are rendered to canvases via pdfjs-dist, then treated like images.
 */

/** Convert a File/Blob to a Data URI. */
async function fileToDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Perform OCR on a data URL and return detections. */
async function analyzeImageDataURL(dataURL: string, pageIndex = 0): Promise<Detection[]> {
  // Optionally perform a simple document auto‑crop before running OCR.  Many
  // scanned documents contain large white margins.  Cropping to the
  // bounding rectangle of non‑white pixels improves OCR accuracy and
  // reduces processing time.  We detect the smallest rectangle that
  // contains all pixels whose brightness is below a threshold.  If the
  // resulting crop covers almost the entire image (>95%), we skip the
  // crop to avoid losing content.  This heuristic is cheap to compute
  // and does not require external dependencies.  See docs/ROADMAP.md.
  async function autoCrop(dataUrl: string): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let minX = canvas.width;
        let maxX = 0;
        let minY = canvas.height;
        let maxY = 0;
        // Threshold to consider a pixel as background (very light)
        const isBg = (r: number, g: number, b: number) => r > 230 && g > 230 && b > 230;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            if (!isBg(r, g, b)) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        // If no foreground found, return original
        if (minX > maxX || minY > maxY) {
          resolve(dataUrl);
          return;
        }
        // Compute bounds width/height
        const bw = maxX - minX;
        const bh = maxY - minY;
        // If crop covers almost entire image, skip cropping
        if (bw / canvas.width > 0.95 && bh / canvas.height > 0.95) {
          resolve(dataUrl);
          return;
        }
        // Expand crop by 5% margins to avoid cutting content
        const marginX = Math.floor(bw * 0.05);
        const marginY = Math.floor(bh * 0.05);
        const cropX = Math.max(0, minX - marginX);
        const cropY = Math.max(0, minY - marginY);
        const cropW = Math.min(canvas.width - cropX, bw + marginX * 2);
        const cropH = Math.min(canvas.height - cropY, bh + marginY * 2);
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;
        const cctx = croppedCanvas.getContext('2d');
        if (!cctx) {
          resolve(dataUrl);
          return;
        }
        cctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(croppedCanvas.toDataURL());
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
  // Run Tesseract on the original Data URL.  Cropping is disabled by
  // default because adjusting bounding boxes back to the original
  // coordinates is non‑trivial.  To experiment with auto‑crop, call
  // autoCrop() on dataURL and adjust bounding boxes accordingly.
  const result = await Tesseract.recognize(dataURL, 'eng', { logger: () => {} });
  const { words } = result.data as any;
  const detections: Detection[] = [];
  // Determine image dimensions
  const img = new Image();
  await new Promise(resolve => {
    img.onload = resolve;
    img.src = dataURL;
  });
  const width = img.width;
  const height = img.height;
  for (const word of words) {
    const text = (word.text || '').trim();
    if (!text) continue;
    const match = detectToken(text);
    if (match) {
      const { kind, reason } = match;
      const bbox = word.bbox as any;
      const x0 = bbox.x0 ?? bbox.left ?? 0;
      const y0 = bbox.y0 ?? bbox.top ?? 0;
      const x1 = bbox.x1 ?? bbox.right ?? 0;
      const y1 = bbox.y1 ?? bbox.bottom ?? 0;
      const box: Box = {
        x: x0 / width,
        y: y0 / height,
        w: (x1 - x0) / width,
        h: (y1 - y0) / height,
        page: pageIndex
      };
      detections.push({
        id: uuidv4(),
        kind: kind as DetectionKind,
        box,
        confidence: word.confidence ?? 0.9,
        reason,
        preview: text
      });
    }
  }
  // Barcode detection using jsQR.  Draw the image onto a temporary canvas
  // and scan its pixels.  jsQR returns null if no code is found.
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.location) {
        // Compute bounding box from corner points
        const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = code.location;
        const xs = [topLeftCorner.x, topRightCorner.x, bottomRightCorner.x, bottomLeftCorner.x];
        const ys = [topLeftCorner.y, topRightCorner.y, bottomRightCorner.y, bottomLeftCorner.y];
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const bbox: Box = {
          x: minX / width,
          y: minY / height,
          w: (maxX - minX) / width,
          h: (maxY - minY) / height,
          page: pageIndex
        };
        detections.push({
          id: uuidv4(),
          kind: 'BARCODE' as DetectionKind,
          box: bbox,
          confidence: 1,
          reason: 'Detected barcode/QR code',
          preview: code.data?.slice(0, 64) // show truncated payload
        });
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Barcode detection failed:', err);
  }
  return detections;
}

/** Analyse a single file (image or PDF) and return detections across all pages. */
// Import preset utilities at the top level

export async function analyzeDocument(file: File | Blob, opts: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  // Determine the MIME type from the file object if possible
  const type = (file as any).type || '';
  const detections: Detection[] = [];
  let pages = 1;
  if (type === 'application/pdf') {
    // Read the PDF into an ArrayBuffer
    const buffer = await (file as Blob).arrayBuffer();
    // Configure worker for pdfjs if running in a browser
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (pdfjsLib.GlobalWorkerOptions && (pdfjsLib as any).workerSrc === undefined) {
      // Provide a default worker if none was set.  This requires that
      // `pdfjs-dist/build/pdf.worker.js` is available in the bundle.
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const workerSrc = require('pdfjs-dist/build/pdf.worker.js');
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;
      } catch (e) {
        // ignore if require fails – pdfjs will attempt to fallback
      }
    }
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    pages = pdf.numPages;
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (!context) continue;
      const renderContext = { canvasContext: context, viewport };
      await page.render(renderContext).promise;
      const dataURL = canvas.toDataURL();
      const pageDetections = await analyzeImageDataURL(dataURL, i - 1);
      detections.push(...pageDetections);
    }
  } else {
    // Assume image
    const dataURL = await fileToDataURL(file as Blob);
    const imgDetections = await analyzeImageDataURL(dataURL, 0);
    detections.push(...imgDetections);
  }
  // Filter detections by preset if provided
  if (opts.presetId) {
    const preset = getPreset(opts.presetId);
    if (preset && preset.enabledKinds && preset.enabledKinds.length > 0) {
      // Remove detections whose kind is not enabled
      for (let i = detections.length - 1; i >= 0; i--) {
        if (!preset.enabledKinds.includes(detections[i].kind)) {
          detections.splice(i, 1);
        }
      }
    }
  }
  return { detections, pages };
}
