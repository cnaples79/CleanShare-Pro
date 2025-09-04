export interface InputFile {
  /**
   * A URI or Data URI representing the file contents.  In browsers this can be
   * obtained via `URL.createObjectURL()` or `FileReader.readAsDataURL()`.
   */
  uri: string;
  /**
   * The MIME type of the file, e.g. `image/png` or `application/pdf`.
   */
  type: 'image' | 'pdf';
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
  | 'REMOVE_METADATA';

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
  /** Only used when style is LABEL */
  labelText?: string;
}

export interface ApplyOptions {
  output: 'image' | 'pdf';
  /** JPEG quality (0–1) for image exports */
  quality?: number;
}

export interface ApplyResult {
  /** Data URI for the redacted file */
  fileUri: string;
  /** Optional report with details about redactions */
  report?: any;
}
