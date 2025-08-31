## @cleanshare/core‑detect

This package contains the core detection and redaction logic used by CleanShare Pro.  It is designed to run in both browser environments (via Web Workers) and native contexts (via Capacitor plugins).  The public API exposes functions for analysing files, returning a list of sensitive detections, and applying redactions to produce a sanitised copy.

### Installation

```
pnpm add @cleanshare/core-detect
```

### Usage

```ts
import { analyzeDocument, applyRedactions } from '@cleanshare/core-detect';

// Accept a file from an input element
async function onFileSelected(file: File) {
  const { detections } = await analyzeDocument(file, {});
  // Present detections to the user and collect redaction actions
  const actions = detections.map(det => ({ detectionId: det.id, style: 'BOX' }));
  const result = await applyRedactions(file, actions, { output: 'image' });
  const url = result.fileUri;
  // Download or share the sanitised file
}
```

See `src/types.ts` for type definitions and `src/detectors/index.ts` for the list of supported detectors.  The pipeline uses Tesseract.js as a fallback for OCR.  When running inside a mobile app you should provide native implementations for OCR and face detection via the `@cleanshare/native-bridge` package; these will automatically override the WASM fallback.
