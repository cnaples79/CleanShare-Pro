import * as Comlink from 'comlink';

export interface WorkerAPI {
  ocr: {
    initialize: (language?: string) => Promise<void>;
    recognizeText: (
      imageData: ImageData | string | ArrayBuffer,
      options?: {
        rectangle?: { left: number; top: number; width: number; height: number };
      }
    ) => Promise<{
      text: string;
      confidence: number;
      words: Array<{
        text: string;
        confidence: number;
        bbox: {
          x0: number;
          y0: number;
          x1: number;
          y1: number;
        };
      }>;
    }>;
    terminate: () => Promise<void>;
  };
  pdf: {
    loadPDF: (pdfBytes: ArrayBuffer) => Promise<{
      document: any;
      pageCount: number;
    }>;
    extractPageImages: (
      pdfBytes: ArrayBuffer,
      pageNumbers?: number[]
    ) => Promise<{
      images: Array<{
        pageNumber: number;
        imageData: string;
        width: number;
        height: number;
      }>;
    }>;
    applyRedactions: (
      pdfBytes: ArrayBuffer,
      redactions: Array<{
        pageNumber: number;
        boxes: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          color?: { r: number; g: number; b: number };
        }>;
      }>
    ) => Promise<{
      pdfBytes: Uint8Array;
      pageCount: number;
      processedPages: number;
    }>;
    optimizePDF: (pdfBytes: ArrayBuffer) => Promise<{
      originalSize: number;
      optimizedSize: number;
      pdfBytes: Uint8Array;
    }>;
    splitPDF: (
      pdfBytes: ArrayBuffer,
      ranges: Array<{ start: number; end: number }>
    ) => Promise<Array<{
      range: { start: number; end: number };
      pdfBytes: Uint8Array;
    }>>;
  };
}

export class WorkerManager {
  private ocrWorker: Comlink.Remote<any> | null = null;
  private pdfWorker: Comlink.Remote<any> | null = null;

  async initializeOCRWorker(): Promise<Comlink.Remote<any>> {
    if (this.ocrWorker) return this.ocrWorker;

    const worker = new Worker(
      new URL('./workers/ocr-worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    this.ocrWorker = Comlink.wrap(worker);
    return this.ocrWorker;
  }

  async initializePDFWorker(): Promise<Comlink.Remote<any>> {
    if (this.pdfWorker) return this.pdfWorker;

    const worker = new Worker(
      new URL('./workers/pdf-worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    this.pdfWorker = Comlink.wrap(worker);
    return this.pdfWorker;
  }

  async getOCRWorker(): Promise<Comlink.Remote<any>> {
    return this.ocrWorker || this.initializeOCRWorker();
  }

  async getPDFWorker(): Promise<Comlink.Remote<any>> {
    return this.pdfWorker || this.initializePDFWorker();
  }

  async terminateAll(): Promise<void> {
    const promises = [];
    
    if (this.ocrWorker) {
      promises.push(this.ocrWorker.terminate());
      this.ocrWorker = null;
    }
    
    if (this.pdfWorker) {
      // PDF worker doesn't have terminate method, just destroy reference
      this.pdfWorker = null;
    }

    await Promise.all(promises);
  }
}

export const workerManager = new WorkerManager();

export * from './workers/ocr-worker';
export * from './workers/pdf-worker';