# MVP Scope

## 0) One‑liner

**CleanShare Pro**: Take an image or PDF, automatically detect sensitive content (faces, PII, secrets, barcodes, metadata), let the user tweak, then export a truly sanitized copy (burned‑in redactions, no hidden layers).

## 1) Target users & jobs‑to‑be‑done

* **Developers/Analysts**: Remove keys/tokens/IDs from logs & screenshots.
* **Support/Banking/Insurance staff**: Sanitize account numbers, emails, names.
* **General users**: Blur faces, remove EXIF/GPS before sharing.

## 2) Platforms / devices

* iOS 16+ and Android 10+ (Capacitor 7 + Next.js 14)
* Optimized for phones (works great on foldables with two‑pane review)
* Offline‑first. No uploads by default.

## 3) MVP scope (what ships)

### 3.1 Inputs

* Pick from Files/Photos
* Share‑in from other apps (iOS Share Extension; Android `ACTION_SEND`)
* Camera capture (simple photo; optional doc‑edge auto‑crop after MVP)

### 3.2 Detection (on device by default)

* **OCR text extraction**: Apple Vision / ML Kit; Tesseract.js WASM fallback.
* **Face detection**: Vision/ML Kit.
* **Barcode/QR detection**.
* **PII/Secrets detection via rules + validators**:
  * Emails, phones, postal codes, dates.
  * PAN (credit card) with Luhn; IBAN (MOD 97).
  * SSN (US format with validity checks).
  * JWTs (3‑segment Base64URL).
  * Common cloud/API keys (e.g. AWS AKIA… patterns).
* **Metadata discovery & stripping** (EXIF/XMP/GPS).

### 3.3 Redaction actions

* Per‑category toggles: Faces / Text PII / Barcodes / Metadata.
* Styles: blur, pixelate, solid box, or replace with label (`[EMAIL]`, `****1234`).
* PDF export uses **safe** method:
  * **Baseline**: re‑render pages to raster canvases and rebuild PDF → no text layer/hidden content.
  * **Pro (post‑MVP)**: vector “burn‑in” redaction of original PDF (WASM tool if feasible in MVP time).

### 3.4 Review & editing

* Split “Before/After” preview.
* Tap detection to change style, resize/move, or unmask.
* “Find” panel lists detections with confidence + reason (e.g., “Luhn valid PAN”).
* Presets:
  * **Developer Secrets**
  * **Work Screenshot** (emails, names, phones, PAN mask except last 4)
  * **Custom** (user regex list)

### 3.5 Export & sharing

* Export sanitized **image** (PNG/JPEG) with metadata removed.
* Export **PDF** (rebuilt) for PDFs or multi‑image jobs.
* Share via system share sheet; originals remain untouched.

### 3.6 Settings

* **Privacy**: “Cloud assist” OFF by default (entire app works offline).
* Manage presets (enable/disable detectors, masking styles).
* Toggle “Keep processing logs” (defaults to minimal).

## 4) Non‑goals (MVP)

* No Office docs (DOCX/XLSX) conversion in app (Phase 2).
* No live video redaction (Phase 2).
* No team/cloud collaboration or storage (Phase 2).
* No server analytics on document content (never).

## 5) Architecture (high level)

```
apps/
  mobile/            # Capacitor iOS/Android wrapper (bundles Next.js build)
  cli/               # Node CLI for batch tests (Termux‑friendly)
packages/
  ui/                # Next.js UI (components/pages); shared with mobile via build
  core-detect/       # TS pipeline: regex validators, orchestration, types
  wasm/              # WASM workers: tesseract.js/opencv.js/pdf rebuild
  native-bridge/     # Capacitor plugins (iOS Share Extension, Android Intents, OCR/Face/Barcode bridges)
docs/                # Product and architectural docs (MVP scope, POC plan, etc.)
```

Pipelines run in Web Workers to keep the UI responsive. Native OCR/Face/Barcode detection is preferred when available via Capacitor plugins; WASM fallbacks (Tesseract.js, pdf-lib) are used when running on the web or during local development.

## 6) Key Capacitor/native integrations

* **Camera**, **Filesystem**, **Share**.
* Custom plugin: **Share‑In bridge**
  * iOS: Share Extension target → App Group temp files → main app.
  * Android: `ACTION_SEND`/`ACTION_SEND_MULTIPLE` URIs → main app.
* Native ML Bridges:
  * iOS: Vision (text/faces/barcodes) + NaturalLanguage (names/places).
  * Android: ML Kit (text/faces/barcodes) + Entity Extraction.

## 7) Core APIs (internal)

The core detection package exposes two high‑level functions:

```ts
analyzeDocument(file: InputFile, opts: AnalyzeOptions): Promise<AnalyzeResult>
applyRedactions(file: InputFile, actions: RedactionAction[], opts: ApplyOptions): Promise<ApplyResult>
```

See the `packages/core-detect` README for type definitions and usage.

## 8) Data model (local only)

* **Preset**: id, name, enabledDetectors[], styleMap{kind→style}, customRegex[].
* **Job Log** (optional): id, startedAt, durations, counts (no original content paths by default).
* **Report (Pro)**: JSON of detections + chosen redactions.

## 9) Performance budgets (MVP)

* Single screenshot: < 800 ms detection on recent phones with native OCR.
* PDF: 150–300 ms/page detection; visible progressive preview.
* Memory: stream PDFs page by page; avoid loading entire file in RAM.
* UI: no main‑thread blocking; all heavy work in workers/native.

## 10) Security & privacy

* Offline by default; **no document leaves the device**.
* Optional “Cloud assist” only sends **OCR text spans + bounding boxes**, never raw images/PDFs.
* Irreversible redactions on export (images & rebuilt PDFs).
* Clear in‑app “What sanitization means” explainer.

## 11) Accessibility

* Large touch targets for boxes.
* VoiceOver/TalkBack labels for the detections list.
* High‑contrast mask styles.

## 12) Store compliance (minimum)

* iOS “Privacy Nutrition Label”: Data Not Collected (if you keep everything offline).
* Play “Data Safety”: No data shared/collected (same assumptions).
* No call recording; respects clipboard privacy; no deceptive claims (use “helps detect” language).

## 13) Risks & mitigations

* **OCR variance** → Use native OCR when possible; offer quick manual edits.
* **False positives** → Show “reason” and easy unmask; preset tuning.
* **PDF redaction correctness** → Prefer rebuild method for MVP; phase in vector burn‑in after robust tests.
* **Share‑in complexity** → Dedicated plugin + integration tests for Photos/Files/GDrive/Chrome.

## 14) MVP acceptance criteria

* Import: image and PDF via picker + share‑in on both platforms.
* Detects & highlights faces, barcodes, and text PII/secrets (at least emails, phones, PAN w/ Luhn, JWT, AWS key patterns).
* Strip EXIF/GPS on image export.
* Rebuilt PDF contains **no live text** and **no hidden content** (copy/paste returns sanitized or nothing).
* User can change per‑detection style and re‑export.
* All processing works with “Cloud assist” disabled.
* App stays responsive during 10‑page PDF processing.

## 15) Roadmap (post‑MVP quick wins)

* Batch mode.
* Team presets (export/import JSON).
* Pro: vector burn‑in redaction for PDFs.
* Doc scan auto‑crop; logo/badge detection.
* Additional secret patterns (GCP/Azure, OAuth, Slack tokens, etc.).
