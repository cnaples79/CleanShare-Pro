import { WebPlugin } from '@capacitor/core';
import { VisionPlugin } from '../index';

export class VisionWeb extends WebPlugin implements VisionPlugin {
  private ocrWorker: any = null;

  private async getOCRWorker() {
    if (!this.ocrWorker) {
      // Dynamically import the WASM worker
      try {
        const { workerManager } = await import('@cleanshare/wasm');
        this.ocrWorker = await workerManager.getOCRWorker();
        await this.ocrWorker.initialize('eng');
      } catch (error) {
        console.error('Failed to initialize OCR worker:', error);
        throw new Error('OCR functionality not available in web environment');
      }
    }
    return this.ocrWorker;
  }

  private async uriToImageData(uri: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = uri;
    });
  }

  async recognizeText(options: { uri: string }): Promise<{
    words: {
      text: string;
      bbox: { x: number; y: number; width: number; height: number };
    }[];
  }> {
    try {
      const worker = await this.getOCRWorker();
      const imageData = await this.uriToImageData(options.uri);
      
      const result = await worker.recognizeText(imageData);
      
      // Convert Tesseract bbox format to our format
      const words = result.words.map((word: any) => ({
        text: word.text,
        bbox: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0
        }
      }));

      return { words };
    } catch (error) {
      console.error('Text recognition failed:', error);
      return { words: [] };
    }
  }

  async detectFaces(options: { uri: string }): Promise<{
    faces: { bbox: { x: number; y: number; width: number; height: number } }[];
  }> {
    // Face detection not implemented in web fallback
    // In a real implementation, you might use:
    // - MediaPipe Face Detection
    // - face-api.js
    // - TensorFlow.js face detection models
    
    console.warn('Face detection not implemented in web fallback');
    return { faces: [] };
  }

  async detectBarcodes(options: { uri: string }): Promise<{
    barcodes: {
      type: string;
      data: string;
      bbox: { x: number; y: number; width: number; height: number };
    }[];
  }> {
    // Barcode detection not implemented in web fallback
    // In a real implementation, you might use:
    // - ZXing browser library
    // - QuaggaJS for 1D barcodes
    // - jsQR for QR codes (already available in the UI package)
    
    try {
      // Use jsQR for QR code detection if available
      const { default: jsQR } = await import('jsqr');
      const imageData = await this.uriToImageData(options.uri);
      
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        return {
          barcodes: [{
            type: 'QR_CODE',
            data: code.data,
            bbox: {
              x: code.location.topLeftCorner.x,
              y: code.location.topLeftCorner.y,
              width: code.location.topRightCorner.x - code.location.topLeftCorner.x,
              height: code.location.bottomLeftCorner.y - code.location.topLeftCorner.y
            }
          }]
        };
      }
    } catch (error) {
      console.warn('QR code detection failed:', error);
    }
    
    return { barcodes: [] };
  }

  /**
   * Cleanup method to terminate workers when done
   */
  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      try {
        await this.ocrWorker.terminate();
        this.ocrWorker = null;
      } catch (error) {
        console.error('Failed to cleanup OCR worker:', error);
      }
    }
  }
}