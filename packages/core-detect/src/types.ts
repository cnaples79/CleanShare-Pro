export interface InputFile {
  /**
   * A URI or Data URI representing the file contents.  In browsers this can be
   * obtained via `URL.createObjectURL()` or `FileReader.readAsDataURL()`.
   */
  uri: string;
  /**
   * The MIME type of the file, e.g. `image/png` or `application/pdf`.
   */
  type: 'image' | 'pdf' | 'heic' | 'webp' | 'tiff' | 'document';
  /**
   * Optional name for the file.
   */
  name?: string;
  /**
   * Raw `File` or `Blob` object when available.  This is not required for
   * analysis but may be used by native plugins.
   */
  file?: File | Blob;
}

export interface Box {
  /** x coordinate (0–1) from left */
  x: number;
  /** y coordinate (0–1) from top */
  y: number;
  /** width (0–1) */
  w: number;
  /** height (0–1) */
  h: number;
  /** optional page index for multi‑page documents */
  page?: number;
}

export type DetectionKind =
  | 'FACE'
  | 'EMAIL'
  | 'PHONE'
  | 'PAN'
  | 'IBAN'
  | 'SSN'
  | 'PASSPORT'
  | 'JWT'
  | 'API_KEY'
  | 'BARCODE'
  | 'NAME'
  | 'ADDRESS'
  | 'OTHER';

export interface Detection {
  /** A stable identifier for the detection */
  id: string;
  /** The kind of sensitive content detected */
  kind: DetectionKind;
  /** Bounding box for the detection, normalised to 0–1 */
  box: Box;
  /** Confidence score (0–1) */
  confidence: number;
  /** A human‑readable reason or explanation */
  reason: string;
  /** Optional snippet of the detected text */
  preview?: string;
}

export type RedactionStyle =
  | 'BLUR'
  | 'PIXELATE'
  | 'BOX'
  | 'LABEL'
  | 'MASK_LAST4'
  | 'PATTERN'
  | 'GRADIENT'
  | 'SOLID_COLOR'
  | 'VECTOR_OVERLAY'
  | 'REMOVE_METADATA';

export interface RedactionConfig {
  /** Primary color for redaction (hex color) */
  color?: string;
  /** Secondary color for gradients/patterns (hex color) */
  secondaryColor?: string;
  /** Opacity level (0-1) */
  opacity?: number;
  /** Pattern type for PATTERN style */
  patternType?: 'diagonal' | 'dots' | 'cross-hatch' | 'waves' | 'noise';
  /** Border width in pixels */
  borderWidth?: number;
  /** Border color (hex color) */
  borderColor?: string;
  /** Corner radius for rounded rectangles */
  cornerRadius?: number;
  /** Custom text for LABEL style */
  labelText?: string;
  /** Font size for labels */
  fontSize?: number;
  /** Font family for labels */
  fontFamily?: string;
  /** Shadow configuration */
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

export interface CustomPattern {
  /** Unique identifier for the pattern */
  id: string;
  /** Human-readable name for the pattern */
  name: string;
  /** Regular expression pattern to match */
  pattern: string;
  /** Detection kind to assign to matches */
  kind: DetectionKind;
  /** Confidence score (0-1) for matches */
  confidence: number;
  /** Description of what this pattern detects */
  description: string;
  /** Whether the pattern is case-sensitive */
  caseSensitive?: boolean;
}

export interface AnalyzeOptions {
  /** Optional preset identifier to use for enabling/disabling detectors */
  presetId?: string;
  /** Allow sending OCR snippets to a remote cloud service for additional analysis */
  useCloudAssist?: boolean;
  /** Custom detection patterns to apply */
  customPatterns?: CustomPattern[];
  /** Minimum confidence threshold (0-1) for including detections */
  confidenceThreshold?: number;
}

export interface AnalyzeResult {
  detections: Detection[];
  pages: number;
  ocrStats?: any;
}

export interface RedactionAction {
  detectionId: string;
  style: RedactionStyle;
  /** Configuration for the redaction style */
  config?: RedactionConfig;
  /** Only used when style is LABEL - kept for backward compatibility */
  labelText?: string;
}

export interface DocumentSanitizationOptions {
  /** Remove EXIF data from images */
  removeExif?: boolean;
  /** Remove PDF metadata (author, creator, etc.) */
  removeMetadata?: boolean;
  /** Remove PDF annotations and comments */
  removeAnnotations?: boolean;
  /** Remove PDF form fields */
  removeFormFields?: boolean;
  /** Remove PDF JavaScript */
  removeJavaScript?: boolean;
  /** Remove PDF embedded files */
  removeEmbeddedFiles?: boolean;
  /** Flatten PDF layers */
  flattenLayers?: boolean;
  /** Remove color profiles */
  removeColorProfiles?: boolean;
}

export interface ApplyOptions {
  output?: 'image' | 'pdf';
  /** JPEG quality (0–1) for image exports */
  quality?: number;
  /** Document sanitization options */
  sanitization?: DocumentSanitizationOptions;
  /** Use vector-based redaction for PDFs (instead of raster overlay) */
  useVectorRedaction?: boolean;
}

export interface ApplyResult {
  /** Data URI for the redacted file */
  fileUri: string;
  /** Optional report with details about redactions */
  report?: any;
}

export interface BulkProcessingOptions {
  /** Maximum number of files to process concurrently */
  maxConcurrency?: number;
  /** Callback for progress updates */
  onProgress?: (processed: number, total: number, currentFile: string) => void;
  /** Callback for individual file completion */
  onFileComplete?: (file: InputFile, result: ApplyResult | null, error?: Error) => void;
  /** Stop processing on first error */
  stopOnError?: boolean;
  /** Common analyze options to apply to all files */
  analyzeOptions?: AnalyzeOptions;
  /** Common apply options to apply to all files */
  applyOptions?: ApplyOptions;
}

export interface BulkProcessingResult {
  /** Number of files successfully processed */
  successful: number;
  /** Number of files that failed processing */
  failed: number;
  /** Total number of files processed */
  total: number;
  /** Results for each file (null if failed) */
  results: (ApplyResult | null)[];
  /** Errors encountered during processing */
  errors: (Error | null)[];
  /** Processing time in milliseconds */
  duration: number;
}

export interface DocumentConversionOptions {
  /** Target format for document conversion */
  targetFormat: 'pdf';
  /** Quality settings for conversion */
  quality?: number;
  /** Page layout options */
  layout?: {
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margins?: { top: number; right: number; bottom: number; left: number };
  };
  /** Whether to preserve original formatting */
  preserveFormatting?: boolean;
}

export interface SupportedFileTypes {
  /** Image formats and their MIME types */
  images: {
    'image/jpeg': string[];
    'image/png': string[];
    'image/webp': string[];
    'image/tiff': string[];
    'image/heic': string[];
    'image/heif': string[];
  };
  /** PDF formats */
  pdf: {
    'application/pdf': string[];
  };
  /** Document formats */
  documents: {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': string[];
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': string[];
    'application/vnd.ms-excel': string[];
    'text/csv': string[];
  };
}
