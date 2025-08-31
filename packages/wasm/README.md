## @cleanshare/wasm

This package contains WebAssembly helpers used by CleanShare Pro.  By offloading heavy computation to workers, the UI remains responsive even when processing large documents.  The package is organised to support multiple workers:

* **OCR Worker**: Runs Tesseract.js in a Web Worker.  It exposes a function to recognise text from an image or canvas and returns bounding boxes.  The worker is loaded via Comlink to provide a Promise‑based API.
* **PDF Rebuild Worker**: Renders pages of a PDF into canvases and rebuilds a new PDF with optional redaction rectangles.  It uses pdf‑lib under the hood and is also exposed via Comlink.

Workers are compiled at build time and loaded dynamically by the UI.  This separation prevents bundling heavy dependencies into the main thread.

This package currently does not contain any implementation; it serves as a placeholder for future performance enhancements.
