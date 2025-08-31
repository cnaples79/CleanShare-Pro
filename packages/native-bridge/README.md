## @cleanshare/native‑bridge

This package hosts Capacitor plugins that expose native functionality to the JavaScript layer used by CleanShare Pro.  Each plugin has separate implementations for Android (in `android/src/main/java`) and iOS (in `ios/Sources`).  These implementations are kept intentionally minimal in the repository scaffold; you should add native code as you develop the mobile features.

### Plugins

* **Share‑In** (`plugins/share-in`) — Receives files shared from other apps via the system share sheet.  On iOS this is implemented as a Share Extension; on Android it registers `ACTION_SEND` and `ACTION_SEND_MULTIPLE` intent filters.
* **Vision** (`plugins/vision`) — Wraps Apple Vision and Google ML Kit to perform OCR, face detection, and barcode scanning on device.  Falling back to Tesseract.js in the browser.
* **PDF Tools** (`plugins/pdf-tools`) — Intended for advanced PDF sanitisation (vector burn‑in).  This plugin is not implemented in the MVP but serves as a placeholder for future work.

Each plugin directory contains a `README.md` describing the intended API and usage.  You can generate the Capacitor plugin boilerplate using the Capacitor CLI and then copy the resulting code into these directories.
