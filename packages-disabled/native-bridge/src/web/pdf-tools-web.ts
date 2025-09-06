import { WebPlugin } from '@capacitor/core';
import { PdfToolsPlugin } from '../index';

interface RedactionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: { r: number; g: number; b: number };
}

export class PdfToolsWeb extends WebPlugin implements PdfToolsPlugin {
  private pdfWorker: any = null;

  private async getPDFWorker() {
    if (!this.pdfWorker) {
      try {
        const { workerManager } = await import('@cleanshare/wasm');
        this.pdfWorker = await workerManager.getPDFWorker();
      } catch (error) {
        console.error('Failed to initialize PDF worker:', error);
        throw new Error('PDF processing functionality not available in web environment');
      }
    }
    return this.pdfWorker;
  }

  private async uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
    try {
      // Handle different URI types
      if (uri.startsWith('data:')) {
        // Data URL
        const response = await fetch(uri);
        return await response.arrayBuffer();
      } else if (uri.startsWith('blob:')) {
        // Blob URL
        const response = await fetch(uri);
        return await response.arrayBuffer();
      } else {
        // Regular URL
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }
        return await response.arrayBuffer();
      }
    } catch (error) {
      throw new Error(`Failed to load PDF from URI: ${error}`);
    }
  }

  private createBlobUrl(data: Uint8Array, mimeType: string = 'application/pdf'): string {
    const blob = new Blob([data as any], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  async sanitizePdf(options: {
    uri: string;
    redactions: Array<{
      pageNumber: number;
      boxes: RedactionBox[];
    }>;
  }): Promise<{ uri: string }> {
    try {
      const worker = await this.getPDFWorker();
      const pdfBytes = await this.uriToArrayBuffer(options.uri);

      // Apply redactions using the PDF worker
      const result = await worker.applyRedactions(pdfBytes, options.redactions);

      // Create a new blob URL for the sanitized PDF
      const sanitizedUri = this.createBlobUrl(result.pdfBytes);

      return { uri: sanitizedUri };
    } catch (error) {
      console.error('PDF sanitization failed:', error);
      throw new Error(`PDF sanitization failed: ${error}`);
    }
  }

  /**
   * Additional web-specific PDF utilities
   */

  async optimizePdf(options: { uri: string }): Promise<{
    uri: string;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  }> {
    try {
      const worker = await this.getPDFWorker();
      const pdfBytes = await this.uriToArrayBuffer(options.uri);

      const result = await worker.optimizePDF(pdfBytes);
      const optimizedUri = this.createBlobUrl(result.pdfBytes);

      return {
        uri: optimizedUri,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        compressionRatio: result.optimizedSize / result.originalSize
      };
    } catch (error) {
      console.error('PDF optimization failed:', error);
      throw new Error(`PDF optimization failed: ${error}`);
    }
  }

  async extractPageImages(options: {
    uri: string;
    pageNumbers?: number[];
  }): Promise<{
    images: Array<{
      pageNumber: number;
      uri: string;
      width: number;
      height: number;
    }>;
  }> {
    try {
      const worker = await this.getPDFWorker();
      const pdfBytes = await this.uriToArrayBuffer(options.uri);

      const result = await worker.extractPageImages(pdfBytes, options.pageNumbers);

      // Convert base64 data URLs to blob URLs if needed
      const images = result.images.map((image: any) => ({
        pageNumber: image.pageNumber,
        uri: image.imageData, // Already a data URL from the worker
        width: image.width,
        height: image.height
      }));

      return { images };
    } catch (error) {
      console.error('PDF page extraction failed:', error);
      throw new Error(`PDF page extraction failed: ${error}`);
    }
  }

  async splitPdf(options: {
    uri: string;
    ranges: Array<{ start: number; end: number }>;
  }): Promise<{
    pdfs: Array<{
      range: { start: number; end: number };
      uri: string;
    }>;
  }> {
    try {
      const worker = await this.getPDFWorker();
      const pdfBytes = await this.uriToArrayBuffer(options.uri);

      const results = await worker.splitPDF(pdfBytes, options.ranges);

      const pdfs = results.map((result: any) => ({
        range: result.range,
        uri: this.createBlobUrl(result.pdfBytes)
      }));

      return { pdfs };
    } catch (error) {
      console.error('PDF splitting failed:', error);
      throw new Error(`PDF splitting failed: ${error}`);
    }
  }

  /**
   * Get PDF metadata and page count
   */
  async getPdfInfo(options: { uri: string }): Promise<{
    pageCount: number;
    metadata?: {
      title?: string;
      author?: string;
      subject?: string;
      creator?: string;
    };
  }> {
    try {
      const worker = await this.getPDFWorker();
      const pdfBytes = await this.uriToArrayBuffer(options.uri);

      const result = await worker.loadPDF(pdfBytes);

      return {
        pageCount: result.pageCount,
        metadata: {
          title: '',
          author: '',
          subject: '',
          creator: 'CleanShare Pro'
        }
      };
    } catch (error) {
      console.error('Failed to get PDF info:', error);
      throw new Error(`Failed to get PDF info: ${error}`);
    }
  }

  /**
   * Cleanup method to clean up blob URLs when done
   */
  async cleanup(uris: string[]): Promise<void> {
    for (const uri of uris) {
      if (uri.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(uri);
        } catch (error) {
          console.warn('Failed to cleanup blob URL:', uri, error);
        }
      }
    }
  }
}