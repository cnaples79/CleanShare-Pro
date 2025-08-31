# Roadmap

This document outlines high‑level milestones for CleanShare Pro beyond the MVP.  It is meant to guide prioritisation and provide visibility into upcoming work.  Time estimates are intentionally left broad as they depend on available contributors and external dependencies.

## Near‑term (after MVP)

* **Batch processing:** Allow users to select multiple files or an entire folder and sanitise them in a single operation.  Requires a queue UI and progress tracking.
* **Presets editor:** Introduce a UI for managing presets (enable/disable detectors, customise masking styles, add custom regex patterns).
* **Vector burn‑in redaction for PDFs:** Implement a robust solution to insert redaction annotations directly into PDF vector content instead of rasterising pages.  This will reduce file sizes and improve fidelity.  Likely implemented in the native PDF Tools plugin or via a WASM library.
* **Barcode and QR detection:** Expand the detection pipeline to include barcodes and QR codes.  These will be masked or replaced with a `[QRCODE]` label.
* **Entity Extraction for names and addresses:** Use Apple NaturalLanguage and Android ML Kit Entity Extraction to recognise names, places, and organisations in addition to simple regex matches.
* **Doc scan auto‑crop:** Integrate document scanning (edge detection and auto‑crop) for paper documents captured via the camera.
* **Audit reports:** Provide an optional JSON or PDF report summarising what was detected and redacted in each job.  Useful for compliance and auditing.
* **Paywall & subscriptions:** Implement a one‑time purchase to unlock Pro features and/or a recurring subscription for continuous support and updates.

## Mid‑term

* **Team sharing & collaboration:** Allow organisations to share presets, synchronise detection logs, and maintain a shared database of allowlist/denylist terms.  Explore secure cloud storage options.
* **Browser extension:** Reuse the core detection pipeline to build a browser extension that sanitises images before they are uploaded to web forms or messaging apps.
* **Desktop app:** Wrap the UI in Electron to target macOS and Windows for local bulk sanitisation.
* **Internationalisation (i18n):** Support multiple UI languages and adapt detector patterns (phone, address, government IDs) to different locales.

## Long‑term

* **AI‑assisted suggestions:** Train a lightweight model to recommend which detections should be redacted or retained based on context and past decisions.  Could run entirely on device.
* **Video sanitisation:** Extend detection and redaction to video files, including face tracking, speech‑to‑text for audio, and frame‑accurate redactions.
* **Integration with secure storage:** Allow users to store their original and sanitised documents in an encrypted vault.  Consider integration with existing secure file providers.

The roadmap is subject to change based on user feedback and evolving privacy regulations.  Contributions and suggestions are welcome.
