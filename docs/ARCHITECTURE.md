# Architecture Overview

CleanShare Pro is built as a monorepo containing discrete packages that each serve a specific purpose.  The goal is to keep concerns separated and to enable reuse across web, mobile, and CLI.  At its core the system is divided into **UI**, **core detection**, **WASM helpers**, **native bridges**, and **apps**.

## Packages

### `packages/ui`

This package contains the Next.js application that powers the user interface.  It is responsible for rendering the file picker, review canvas, detection overlay, and export screen.  The UI imports functions from `core‑detect` to analyse documents and apply redactions.  The code is written in TypeScript and uses React.  When bundled with Capacitor, it is rendered inside a WebView on both iOS and Android.

Key responsibilities:

* Manage the file selection and preview flow.
* Spawn Web Workers for heavy operations (OCR, PDF parsing) using Comlink.
* Render detection boxes and allow the user to toggle redaction styles.
* Invoke `core‑detect` APIs and present results.
* Export the final sanitised file and trigger the system share sheet.

### `packages/core-detect`

This package houses the core detection logic used by both the UI and the CLI.  It provides type definitions and high‑level asynchronous functions to analyse a document and to apply redactions.

It is deliberately platform agnostic: the package does not import any browser‑specific globals.  The OCR implementation can be swapped: when running in the mobile app, native OCR via Capacitor plugins is used; when running in a web worker, Tesseract.js is imported dynamically.

Key components:

* **Types**: definitions for `InputFile`, `Box`, `DetectionKind`, `Detection`, `RedactionStyle`, `AnalyzeOptions`, `AnalyzeResult`, etc.
* **Detectors**: Pure functions that take a token (text string) and determine if it matches a sensitive pattern.  Examples include email, phone, credit card (Luhn check), IBAN (MOD 97), JWT, and AWS key validators.
* **Pipeline**: Orchestrates OCR, runs detectors on extracted tokens, and constructs the result list with bounding boxes.
* **Redaction**: Draws redaction rectangles on images and PDFs.  On images it uses an HTML canvas; on PDFs it uses pdf‑lib to insert rectangles and rebuild a new PDF without hidden layers.

### `packages/wasm`

This package contains WebAssembly‑powered workers that perform CPU intensive tasks in isolation.  For the MVP these workers include:

* **Tesseract.js**: For OCR fallback when native detection is unavailable.  Running Tesseract in a separate worker prevents blocking the UI thread.
* **PDF rebuild**: A helper that rasterises pages and then rebuilds a sanitised PDF.  It may wrap pdf‑lib with additional sanitisation logic.

Workers are spun up via Comlink in the UI and exposed as asynchronous functions.

### `packages/native-bridge`

This package contains Capacitor plugins that bridge native functionality to the JavaScript world.  There are separate folders for Android and iOS implementations of each plugin.  The MVP focuses on three plugins:

1. **Share‑In**: Receives files from other apps via the system share sheet and hands them to the UI.  On iOS this is a Share Extension; on Android this is an `Intent` filter.
2. **Vision/OCR**: Exposes Apple Vision and Google ML Kit for text and face detection to JavaScript.  Provides a unified interface that mirrors the Tesseract API used by the fallback.
3. **PDF Tools**: (Post‑MVP) Handles vector burn‑in redactions and advanced PDF sanitisation at the native level.

### CLI and Mobile Apps

Under `apps/` live the entry points for each runtime:

* `apps/mobile`: The Capacitor project that wraps the Next.js build.  It includes native code, icons, splash screens, and configuration for iOS and Android.
* `apps/cli`: A lightweight Node program that leverages `core‑detect` and `wasm` packages to sanitise files from the command line.  This is particularly useful for automated testing and bulk processing on developer machines.

## Data flow

1. **File selection**: The user selects an image or PDF either via the UI or by sharing from another app.  A JavaScript `File` object is passed to the detection pipeline.
2. **Analysis**: The UI calls `analyzeDocument` from `core‑detect`.  This function decides whether to use native OCR (if available) or to fall back to Tesseract.js running in a worker.  The OCR results are tokenised and each token is checked by the detectors.  Detections are returned with bounding box coordinates relative to the page.
3. **User review**: The UI draws bounding boxes over the preview and allows the user to change styles or disable redactions.
4. **Redaction**: When the user confirms, the UI calls `applyRedactions`, passing in the original file and the set of actions selected by the user.  The function draws redaction boxes on each page (image or PDF) and produces a new file with metadata stripped.
5. **Export**: The new file is returned to the UI, which saves it locally and triggers the system share sheet for the user to share or save the sanitised copy.

## Extensibility

* **Additional detectors** can be added to `core‑detect/src/detectors` without modifying the pipeline.  They simply implement a `detect(token: string)` function and return metadata if they match.
* **Vector PDF redaction** can be added in the native PDF Tools plugin or the WASM layer and integrated into `applyRedactions` behind a feature flag.
* **Cloud assist** can be implemented by sending only the OCR tokens and bounding boxes to a remote service.  Because the core pipeline is abstracted, this would simply be another detection source merged with the local results.
