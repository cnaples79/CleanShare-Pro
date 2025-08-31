import { registerPlugin } from '@capacitor/core';

/**
 * Entry point for the native bridge package.  Each exported value
 * corresponds to a Capacitor plugin that may have native
 * implementations on Android and iOS.  When executed in the web
 * context these plugins will fall back to stub implementations that
 * return empty results.
 */

export interface SharedFile {
  name: string;
  uri: string;
  type: 'image' | 'pdf';
}

export interface ShareInPlugin {
  /**
   * Retrieve any files that have been shared into the app via the
   * system share sheet.  On the web this returns an empty array.
   */
  getSharedFiles(): Promise<{ files: SharedFile[] }>;
}

export interface VisionPlugin {
  recognizeText(options: { uri: string }): Promise<{ words: { text: string; bbox: { x: number; y: number; width: number; height: number; } }[] }>;
  detectFaces(options: { uri: string }): Promise<{ faces: { bbox: { x: number; y: number; width: number; height: number; } }[] }>;
  detectBarcodes(options: { uri: string }): Promise<{ barcodes: { type: string; data: string; bbox: { x: number; y: number; width: number; height: number; } }[] }>;
}

export interface PdfToolsPlugin {
  sanitizePdf(options: { uri: string; redactions: any[] }): Promise<{ uri: string }>;
}

// Register each plugin with Capacitor.  The generic type arguments
// declare the API surface for TypeScript consumers.  If a native
// implementation is unavailable the plugin will still resolve but
// methods may reject at runtime.

export const ShareIn = registerPlugin<ShareInPlugin>('ShareIn');
export const Vision = registerPlugin<VisionPlugin>('Vision');
export const PdfTools = registerPlugin<PdfToolsPlugin>('PdfTools');

export default { ShareIn, Vision, PdfTools };