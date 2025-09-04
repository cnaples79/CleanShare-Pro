import { SupportedFileTypes, InputFile, BulkProcessingOptions, BulkProcessingResult, DocumentConversionOptions } from './types';

/**
 * Supported file types and their extensions
 */
export const SUPPORTED_FILE_TYPES: SupportedFileTypes = {
  images: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/tiff': ['.tiff', '.tif'],
    'image/heic': ['.heic'],
    'image/heif': ['.heif'],
  },
  pdf: {
    'application/pdf': ['.pdf'],
  },
  documents: {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
    'text/csv': ['.csv'],
  },
};

/**
 * Get file type from MIME type or filename
 */
export function getFileType(file: File | string): InputFile['type'] {
  const mimeType = typeof file === 'string' ? getMimeTypeFromFilename(file) : file.type;
  const filename = typeof file === 'string' ? file : file.name;

  // Check image formats
  for (const [mime, extensions] of Object.entries(SUPPORTED_FILE_TYPES.images)) {
    if (mimeType === mime || extensions.some(ext => filename.toLowerCase().endsWith(ext))) {
      if (mime === 'image/heic' || mime === 'image/heif') return 'heic';
      if (mime === 'image/webp') return 'webp';
      if (mime === 'image/tiff') return 'tiff';
      return 'image';
    }
  }

  // Check PDF
  if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }

  // Check documents
  for (const [mime, extensions] of Object.entries(SUPPORTED_FILE_TYPES.documents)) {
    if (mimeType === mime || extensions.some(ext => filename.toLowerCase().endsWith(ext))) {
      return 'document';
    }
  }

  // Default to image for unknown types
  return 'image';
}

/**
 * Get MIME type from filename extension
 */
function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    heic: 'image/heic',
    heif: 'image/heif',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
  };

  return mimeMap[ext || ''] || 'application/octet-stream';
}

/**
 * Check if a file type is supported
 */
export function isSupportedFile(file: File | string): boolean {
  const type = getFileType(file);
  return ['image', 'pdf', 'heic', 'webp', 'tiff', 'document'].includes(type);
}

/**
 * Get supported file extensions as a string for file input accept attribute
 */
export function getSupportedExtensions(): string {
  const allExtensions: string[] = [];
  
  // Add image extensions
  Object.values(SUPPORTED_FILE_TYPES.images).forEach(extensions => {
    allExtensions.push(...extensions);
  });
  
  // Add PDF extensions
  Object.values(SUPPORTED_FILE_TYPES.pdf).forEach(extensions => {
    allExtensions.push(...extensions);
  });
  
  // Add document extensions
  Object.values(SUPPORTED_FILE_TYPES.documents).forEach(extensions => {
    allExtensions.push(...extensions);
  });
  
  return allExtensions.join(',');
}

/**
 * Convert HEIC/HEIF to JPEG for processing
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  // Note: This would require a HEIC decoder library like libheif-js or heic2any
  // For now, return a placeholder implementation
  console.warn('HEIC conversion not yet implemented - requires libheif-js or similar');
  
  // Placeholder: return original file (will likely fail processing)
  return new File([file], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
    type: 'image/jpeg'
  });
}

/**
 * Convert WebP to PNG/JPEG for better compatibility
 */
export async function convertWebPToStandard(file: File, targetFormat: 'png' | 'jpeg' = 'png'): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert WebP'));
          return;
        }
        
        const convertedFile = new File([blob], 
          file.name.replace(/\.webp$/i, `.${targetFormat}`), {
          type: `image/${targetFormat}`
        });
        
        resolve(convertedFile);
      }, `image/${targetFormat}`, 0.9);
    };
    
    img.onerror = () => reject(new Error('Failed to load WebP image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert TIFF to PNG for processing
 */
export async function convertTiffToPng(file: File): Promise<File> {
  // Note: This would require a TIFF decoder library like tiff.js
  console.warn('TIFF conversion not yet implemented - requires tiff.js or similar');
  
  // Placeholder: return as PNG type but original data (will likely fail)
  return new File([file], file.name.replace(/\.tiff?$/i, '.png'), {
    type: 'image/png'
  });
}

/**
 * Process bulk files with progress tracking
 */
export async function processBulkFiles(
  files: InputFile[],
  analyzeFn: (file: InputFile) => Promise<any>,
  applyFn: (file: InputFile, result: any) => Promise<any>,
  options: BulkProcessingOptions = {}
): Promise<BulkProcessingResult> {
  const {
    maxConcurrency = 3,
    onProgress,
    onFileComplete,
    stopOnError = false
  } = options;

  const startTime = Date.now();
  const results: (any | null)[] = [];
  const errors: (Error | null)[] = [];
  let successful = 0;
  let failed = 0;

  // Process files in batches to control concurrency
  for (let i = 0; i < files.length; i += maxConcurrency) {
    const batch = files.slice(i, i + maxConcurrency);
    
    const batchPromises = batch.map(async (file, batchIndex) => {
      const fileIndex = i + batchIndex;
      
      try {
        onProgress?.(fileIndex, files.length, file.name || `file-${fileIndex}`);
        
        // Analyze file
        const analyzeResult = await analyzeFn(file);
        
        // Apply redactions
        const applyResult = await applyFn(file, analyzeResult);
        
        results[fileIndex] = applyResult;
        errors[fileIndex] = null;
        successful++;
        
        onFileComplete?.(file, applyResult);
        
        return applyResult;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        results[fileIndex] = null;
        errors[fileIndex] = err;
        failed++;
        
        onFileComplete?.(file, null, err);
        
        if (stopOnError) {
          throw err;
        }
        
        return null;
      }
    });

    try {
      await Promise.all(batchPromises);
    } catch (error) {
      if (stopOnError) {
        break;
      }
    }
  }

  const duration = Date.now() - startTime;

  return {
    successful,
    failed,
    total: files.length,
    results,
    errors,
    duration
  };
}

/**
 * Convert document to PDF for processing
 */
export async function convertDocumentToPdf(
  file: File,
  options: DocumentConversionOptions = { targetFormat: 'pdf' }
): Promise<File> {
  // Note: This would require document conversion libraries
  // For DOCX: mammoth.js + html-to-pdf
  // For XLSX: xlsx + html-to-pdf
  
  console.warn(`Document conversion not yet implemented for ${file.type}`);
  console.log('Would convert:', file.name, 'with options:', options);
  
  // Placeholder: return original file
  return file;
}