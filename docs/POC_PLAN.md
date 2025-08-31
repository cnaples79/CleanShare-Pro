# Proof‑of‑Concept (POC) Plan

## 0) Goal

Prove the full pipeline end‑to‑end on device: **import → analyze (OCR + regex detection) → review → export**.  The POC should demonstrate sanitising at least one image and one PDF, using on‑device detection and redaction only.

## 1) Timebox

Allocate **3–5 focused days** to build the proof of concept.  Keep all cloud features off.  Target a single preset: **Developer Secrets**.

## 2) Deliverables (checklist)

* A Capacitor mobile app with a simple Next.js UI (three screens: Select, Review, Export).
* File picker supporting images and PDFs.
* Android share‑in (one file); iOS share‑in optional if time permits.
* Worker pipeline including:
  * Native OCR (ML Kit/Apple Vision) and Tesseract fallback.
  * Regex detectors: email, phone, PAN (Luhn), JWT, AWS key pattern.
  * EXIF strip on image export.
* PDF re‑render → rebuilt PDF without a text layer.
* Review screen with tap‑to‑toggle style (BOX vs BLUR).
* Export/share of the sanitised file.
* CLI tool (`apps/cli`) to batch sanitise a folder (Termux‑friendly).

## 3) Scope cutlines (POC)

* No barcode detection in POC (can add later).
* No presets UI (hardcode “Developer Secrets”).
* No custom regex editor.
* Skip iOS Share Extension if it threatens the timeline (focus on Android first).

## 4) Implementation steps

### Day 1 — Project + minimal pipeline

1. **Repo setup**
   * Create a pnpm workspace; add packages (`ui`, `core‑detect`, `native‑bridge`, `wasm`, etc.).
   * Create a simple Next.js app with a file picker UI.
2. **Worker & types**
   * Set up Web Worker + Comlink; define `analyzeDocument`/`applyRedactions` types.
3. **Regex detectors (JS)**
   * Implement patterns for email, phone, PAN (Luhn), JWT, AWS key id.

### Day 2 — Native OCR + image export

1. **Android**
   * ML Kit Text Recognition & Face Detection via Capacitor plugin.
   * Read a file → convert to bitmap → run OCR/faces → map to detections.
2. **Image export**
   * Apply masks on canvas; re‑encode JPEG/PNG; ensure EXIF stripped.
3. **Review UI**
   * Overlay boxes; tap to toggle BOX/BLUR; recompute preview.

### Day 3 — PDF rebuild + share‑in (Android)

1. **PDF preview + page streaming**
   * Use PDF.js to render each page to a canvas; OCR per page; collect detections.
2. **Rebuild sanitised PDF**
   * Render pages with masks applied; assemble via pdf‑lib.
3. **Android share‑in**
   * Intent filter to receive `image/*` and `application/pdf` and open in app.

### Buffer (Day 4–5) — iOS & polish

* iOS Vision OCR/faces and Share Extension (if time).
* Simple “reason” text on each detection.
* Basic performance tuning (offload heavy work to workers).

## 5) Test dataset & validation

* **Images**: 5+ mobile screenshots containing: emails, phones, fake PANs (valid Luhn), JWTs, AWS keys, faces.
* **PDFs**: A 5–10 page PDF with mixed text and screenshots.  Confirm that post‑export:
  * Copy/paste from sanitised PDF returns **no sensitive text**.
  * PDF metadata fields are blank/default.
* **Manual QA**:
  * Toggle styles; move/resize a box; re‑export; confirm visual & text are sanitised.
* **CLI**:
  * Run `pnpm cli sanitize ./samples` to create an `/out` folder with sanitised results.

## 6) Success criteria (POC)

* Processes one image in < 1 s on a modern Android phone; 10‑page PDF in < 5 s total (progressive).
* Correctly finds at least: emails, phones, PAN valid by Luhn, JWTs, AWS key patterns, faces.
* Image exports contain **no EXIF/GPS**.
* Rebuilt PDFs have **no selectable original text**; masked regions appear where expected.
* No crashes across 20 sample files.

## 7) Developer experience (Fold + Termux)

* Start the dev server on a Galaxy Fold: `pnpm dev --filter @cleanshare/ui`.
* Build Android debug APK on device or via laptop + `adb install`.
* Use `apps/cli` to quickly regression‑test a folder of screenshots on the device.
* Keep heavy libs in workers; avoid crashing the WebView on low RAM.

## 8) Next steps → MVP

* Add barcode/QR + Entity Extraction detectors.
* Presets UI + custom regex editor.
* iOS Share Extension parity.
* Batch mode + basic audit JSON export.
* Paywall (one‑time unlock or Pro subscription) and store assets.
