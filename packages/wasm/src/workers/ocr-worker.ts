import * as Comlink from 'comlink';
import { createWorker, Worker } from 'tesseract.js';

interface OCRResult {
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
}

class OCRWorker {
  private worker: Worker | null = null;
  private initialized = false;

  async initialize(language: string = 'eng'): Promise<void> {
    if (this.initialized) return;

    this.worker = await createWorker({
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    await this.worker.loadLanguage(language);
    await this.worker.initialize(language);

    this.initialized = true;
  }

  async recognizeText(
    imageData: any,
    options?: {
      rectangle?: { left: number; top: number; width: number; height: number };
    }
  ): Promise<OCRResult> {
    if (!this.worker) {
      throw new Error('OCR Worker not initialized');
    }

    const result = await this.worker.recognize(imageData, {
      rectangle: options?.rectangle
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      }))
    };
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

const ocrWorker = new OCRWorker();

export type { OCRResult };
export default Comlink.expose(ocrWorker);