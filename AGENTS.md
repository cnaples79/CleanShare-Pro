# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by `pnpm` workspaces.
- `apps/cli`: Node CLI (entry at `apps/cli/bin/index.js`, currently a stub).
- `apps/mobile`: Capacitor shell; serves a pure WebView from `apps/mobile/web/`.
- `packages/ui`: Next.js app (`pages/`, `styles/`).
- `packages/core-detect`, `packages/wasm`: TypeScript libs with `src/` → `dist/`.
- `packages-disabled/native-bridge`: Native plugins are currently disabled to keep 100% WebView builds.
- `docs/` (architecture, roadmap) and `test-samples/` (sample PDF).

## Important Folders & Files
- Root: `package.json` (workspace scripts), `pnpm-workspace.yaml`, `.editorconfig`, `README.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/MVP_SCOPE.md`, `docs/POC_PLAN.md`.
- `apps/cli/bin/index.js`: CLI entry (prints “not implemented”).
- `apps/mobile/capacitor.config.ts`, `android/`, `ios/`: Capacitor config and native shells.
- `apps/mobile/web/`: Mobile WebView entry (`index.html`, `main.js`, styling, Capacitor stub for dev).
- `apps/mobile/web/mobile-fixed.js`: Mobile Preset Manager, History, and action bar for Phase 2.4 parity. Load before `main.js` in `index.html`.
- `packages/ui/pages/index.tsx`: Main UI flow (upload → detect → redact/export). Supporting files: `_app.tsx`, `_error.tsx`, `404.tsx`, `styles/globals.css`, `next.config.js`.
- `packages/core-detect/src/types.ts`: Core types. `detectors/index.ts`: token heuristics (Luhn, IBAN, SSN, JWT, AWS). `pipeline/analyze.ts`: OCR (Tesseract) + PDF render (pdfjs) + barcode (jsQR). `pipeline/apply.ts`: draw redactions (canvas/pdf-lib). `presets.ts`: built-in presets. `history.ts`: processing history and analytics.
- `packages/wasm/src/index.ts`: Comlink worker manager. `workers/ocr-worker.ts`: Tesseract wrapper. `workers/pdf-worker.ts`: pdf-lib helpers (currently partial stubs).

## Build, Test, and Development Commands
- Install: `pnpm install` (bootstraps all workspaces).
- UI dev: `pnpm --filter @cleanshare/ui dev` (http://localhost:3000).
- Build all: `pnpm -r build` (or `pnpm --filter <pkg> build`).
- UI prod: `pnpm --filter @cleanshare/ui start` after building.
- CLI: placeholder only (`node apps/cli/bin/index.js` reports not implemented).
- Mobile dev server (vanilla WebView): `node apps/mobile/serve-mobile.js` (serves `apps/mobile/web/` at http://localhost:8081).
- Mobile package flow (pure WebView):
  - Option A (current): maintain `apps/mobile/web/` manually (uses CDN Tesseract/pdf.js).  Use Capacitor to package.
  - Option B (preferred): `pnpm --filter @cleanshare/ui build && pnpm --filter @cleanshare/ui exec next export -o ../../apps/mobile/web` then `(cd apps/mobile && npx cap sync)` to package.

## Coding Style & Naming Conventions
- Indentation: 2 spaces, LF, final newline (see `.editorconfig`).
- TypeScript throughout; prefer named exports.
- Files: `kebab-case.ts` for libs; `PascalCase.tsx` for React components; route files under `packages/ui/pages/` follow Next.js conventions.
- No repo-wide ESLint/Prettier yet—if adding, match current formatting and 2‑space indent.

## Web & Mobile Deployment
- Current readiness: Web UI runs; Mobile WebView runs with CDN-loaded `tesseract.js`, `pdfjs-dist`, and `pdf-lib`. Native plugin code is disabled; heavy OCR/PDF work largely runs on the main thread.
- Goal: Keep 100% pure WebView + Capacitor for iOS/Android store builds (no custom native plugins). Replace CDN in production with locally bundled assets.
- PDF.js worker: ensure a worker is bundled and referenced via `pdfjsLib.GlobalWorkerOptions.workerSrc` (Next.js: ship under `packages/ui/public/`; Mobile: ship alongside `apps/mobile/web/`).
- Mobile fixed shell: `apps/mobile/web/index.html` now loads React 18 UMD and `mobile-fixed.js` before `main.js` to enable Preset Manager, History UI, and the action bar. Keep CDNs for dev; replace with locally bundled assets for production/offline.
- Architecture improvements to pursue:
  - Workers by default: route Tesseract/pdf.js via `packages/wasm` Comlink workers to avoid UI blocking.
  - Platform adapters: inject OCR/Barcode/PDF via web workers (both web + mobile) instead of using DOM APIs in core.
  - PDF safety: prefer rasterized PDF rebuild to remove live text and hidden content; keep vector overlays simple and deterministic.
  - Explicit APIs: remove shared state in redaction; pass detections directly (core has helper for this already).
  - Packaging: eliminate runtime CDNs for store builds; lazy‑load heavy deps; static export for UI.
- Build/release flow:
  - Web: `pnpm --filter @cleanshare/ui build && pnpm --filter @cleanshare/ui exec next export -o out` (deploy `packages/ui/out/`).
  - Mobile: `pnpm --filter @cleanshare/ui exec next export -o ../../apps/mobile/web && (cd apps/mobile && npx cap sync)` then build in Xcode/Android Studio.
  - CI suggestions: add a simple workflow to run `pnpm -r build`, type-check packages, and publish web artifacts. Cache pnpm store. Optionally attach mobile web bundle as artifact. Note: `.github/workflows` is not present yet.
  - Note (mobile export): ensure `apps/mobile/web/mobile-fixed.js` remains present after export; if your export step wipes the folder, re-copy this file before packaging.

## Phase 2.4 Fix & Optimize Plan (Pure WebView)
- Status: baseline parity working on web and mobile. Mobile Preset Manager + History implemented in `apps/mobile/web/mobile-fixed.js`; detection and PDF/image redaction use CDN `tesseract.js`, `pdfjs-dist`, and `pdf-lib`. Next: workerize heavy paths and replace CDNs with bundled assets.
- Align detection across web/mobile: remove duplicate mobile-only token code by reusing `@cleanshare/core-detect` detectors in mobile bundle; ensure the same presets and thresholds apply on both.
- Workerize heavy paths: swap `tesseract.js` and PDF page rendering to `packages/wasm` workers in both web and mobile to keep the main thread responsive.
- PDF correctness & safety: add a rasterized rebuild path for PDFs in workers (baseline) and keep current simple vector overlays only when safe; verify no live text remains.
- Mobile UI polish: improve touch targets, reduce DOM weight, add progressive states, and ensure offline assets (no CDNs in production); keep the vanilla mobile shell and avoid Ionic to minimize footprint.
- Performance telemetry: instrument analysis/redaction timings and memory hints; surface summary in the History dashboard for ad‑hoc profiling.
- Export pipeline: unify image/PDF export; strip metadata; ensure downloads work on mobile WebView; test large files and multi‑page PDFs.

## Testing Guidelines
- Add package‑level tests using `*.test.ts` under `src/` or `src/__tests__/` (mock `tesseract.js`, `pdfjs-dist`, and workers).
- Add smoke scripts to exercise analyze/apply on a corpus (see root `test-*.js` scripts as seeds). Run via Node against `dist/` builds.
- Add a detection QA set: at least 10 screenshots + 3 PDFs with seeded emails/phones/PAN/IBAN/SSN/JWT/AWS to measure precision/recall; record results in `docs/`.
- Run suite with `pnpm -r test`. Use `tsc -p` type‑checking for quick feedback.

## Commit & Pull Request Guidelines
- Current history is minimal; adopt Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc., with scopes like `ui:`, `core-detect:`, `wasm:`, `mobile:`.
- PRs: clear description, linked issues, reproduction steps, before/after screenshots for UI, list affected packages, and update docs when behavior changes.
- Do not commit build artifacts: exclude `packages/ui/.next/`, `packages/ui/out/`, and generated mobile export contents from commits. Prefer CI artifacts and ensure `.gitignore` rules cover these outputs.

## Security & Configuration Tips
- Do not commit secrets or real PII; use files under `samples/` or `test-samples/` for demos.
- Avoid large binaries in git; consider Git LFS if assets grow.

## Short-Term Deliverables (Next 2–3 weeks)
- Web parity: stabilize Phase 2.4 features on web (`packages/ui`) using workers; verify preset manager, history, undo/redo on mid‑range devices.
- Mobile parity: export UI statically and serve from `apps/mobile/web/`; validate identical detection results with the same files (1× JPG + 1× PDF now; expand corpus).
- Replace CDNs in mobile with local copies of `tesseract.js`, `pdfjs-dist` worker, and `pdf-lib` for offline/store compliance.
- Add a minimal CI workflow to build and type‑check packages and export the UI.
