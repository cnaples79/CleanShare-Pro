import { registerPlugin } from '@capacitor/core';
import { ShareInWeb } from './share-in-web';
import { VisionWeb } from './vision-web';
import { PdfToolsWeb } from './pdf-tools-web';

// Register web implementations
export const ShareInWeb_Plugin = registerPlugin('ShareIn', {
  web: () => new ShareInWeb()
});

export const VisionWeb_Plugin = registerPlugin('Vision', {
  web: () => new VisionWeb()
});

export const PdfToolsWeb_Plugin = registerPlugin('PdfTools', {
  web: () => new PdfToolsWeb()
});

export { ShareInWeb, VisionWeb, PdfToolsWeb };