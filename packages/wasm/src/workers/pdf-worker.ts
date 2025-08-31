import * as Comlink from 'comlink';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';

interface PDFProcessingResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  processedPages: number;
}

interface RedactionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: { r: number; g: number; b: number };
}

class PDFWorker {
  async loadPDF(pdfBytes: ArrayBuffer): Promise<{
    document: any;
    pageCount: number;
  }> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return {
      document: pdfDoc,
      pageCount: pdfDoc.getPageCount()
    };
  }

  async extractPageImages(
    pdfBytes: ArrayBuffer,
    pageNumbers?: number[]
  ): Promise<{
    images: Array<{
      pageNumber: number;
      imageData: string; // base64 data URL
      width: number;
      height: number;
    }>;
  }> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const targetPages = pageNumbers || pages.map((_, i) => i);
    
    const images = [];
    
    for (const pageIndex of targetPages) {
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        const { width, height } = page.getSize();
        
        // Create a canvas to render the PDF page
        // Note: This is a simplified approach - in a real implementation,
        // you'd use pdf2pic or similar for better page rendering
        images.push({
          pageNumber: pageIndex + 1,
          imageData: `data:image/png;base64,`, // Placeholder - would need actual rendering
          width,
          height
        });
      }
    }

    return { images };
  }

  async applyRedactions(
    pdfBytes: ArrayBuffer,
    redactions: Array<{
      pageNumber: number;
      boxes: RedactionBox[];
    }>
  ): Promise<PDFProcessingResult> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    let processedPages = 0;

    for (const redaction of redactions) {
      const pageIndex = redaction.pageNumber - 1;
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        const { height: pageHeight } = page.getSize();

        for (const box of redaction.boxes) {
          // Convert coordinates (PDF uses bottom-left origin)
          const pdfY = pageHeight - box.y - box.height;
          
          // Draw redaction rectangle
          page.drawRectangle({
            x: box.x,
            y: pdfY,
            width: box.width,
            height: box.height,
            color: rgb(
              (box.color?.r || 0) / 255,
              (box.color?.g || 0) / 255,
              (box.color?.b || 0) / 255
            )
          });
        }
        
        processedPages++;
      }
    }

    // Remove metadata for privacy
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('CleanShare Pro');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const finalPdfBytes = await pdfDoc.save();

    return {
      pdfBytes: finalPdfBytes,
      pageCount: pages.length,
      processedPages
    };
  }

  async optimizePDF(pdfBytes: ArrayBuffer): Promise<{
    originalSize: number;
    optimizedSize: number;
    pdfBytes: Uint8Array;
  }> {
    const originalSize = pdfBytes.byteLength;
    
    // Load and save with optimization
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Remove unused objects and compress
    const optimizedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });

    return {
      originalSize,
      optimizedSize: optimizedBytes.length,
      pdfBytes: optimizedBytes
    };
  }

  async splitPDF(
    pdfBytes: ArrayBuffer,
    ranges: Array<{ start: number; end: number }>
  ): Promise<Array<{
    range: { start: number; end: number };
    pdfBytes: Uint8Array;
  }>> {
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const results = [];

    for (const range of ranges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from(
        { length: range.end - range.start + 1 },
        (_, i) => range.start + i - 1
      );

      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      results.push({
        range,
        pdfBytes
      });
    }

    return results;
  }
}

const pdfWorker = new PDFWorker();

export type { PDFProcessingResult, RedactionBox };
export default Comlink.expose(pdfWorker);