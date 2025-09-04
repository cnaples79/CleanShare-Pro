# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by `pnpm` workspaces.
- `apps/cli`: Node CLI (entry at `apps/cli/bin/index.js`).
- `apps/mobile`: Capacitor shell; serves built UI from `apps/mobile/web/`.
- `packages/ui`: Next.js app (`pages/`, `styles/`).
- `packages/core-detect`, `packages/native-bridge`, `packages/wasm`: TypeScript libs with `src/` → `dist/`.
- `docs/` (architecture, roadmap) and `samples/` (images, pdfs).

## Important Folders & Files
- Root: `package.json` (workspace scripts), `pnpm-workspace.yaml`, `.editorconfig`, `.github/workflows/ci.yml` (UI build), `README.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/MVP_SCOPE.md`, `docs/POC_PLAN.md`, `samples/`.
- `apps/cli/bin/index.js`: CLI entry (currently prints “not implemented”).
- `apps/mobile/capacitor.config.ts`, `android/`, `ios/`: Capacitor config and native shells.
- `packages/ui/pages/index.tsx`: Main UI flow (upload → detect → redact/export). Supporting files: `_app.tsx`, `_error.tsx`, `404.tsx`, `styles/globals.css`, `next.config.js`, `.babelrc`.
- `packages/core-detect/src/types.ts`: Core types. `detectors/index.ts`: token heuristics (Luhn, IBAN, SSN, JWT, AWS). `pipeline/analyze.ts`: OCR (Tesseract) + PDF render (pdfjs) + barcode (jsQR). `pipeline/apply.ts`: draw redactions (canvas/pdf-lib). `presets.ts`: built-in presets.
- `packages/native-bridge/src/index.ts`: Capacitor plugin interfaces. `src/web/*.ts`: web fallbacks (OCR, PDF tools, share-in) using workers.
- `packages/wasm/src/index.ts`: Comlink worker manager. `workers/ocr-worker.ts`: Tesseract wrapper. `workers/pdf-worker.ts`: pdf-lib helpers (some stubs).

## Build, Test, and Development Commands
- Install: `pnpm install` (bootstraps all workspaces).
- UI dev: `pnpm --filter @cleanshare/ui dev` (http://localhost:3000).
- Build all: `pnpm -r build` (or `pnpm --filter <pkg> build`).
- UI prod: `pnpm --filter @cleanshare/ui start` after building.
- CLI: placeholder only (`node apps/cli/bin/index.js` reports not implemented).
- Mobile: `pnpm --filter @cleanshare/ui build`, copy output into `apps/mobile/web/`, then package/open with the Capacitor CLI.

## Coding Style & Naming Conventions
- Indentation: 2 spaces, LF, final newline (see `.editorconfig`).
- TypeScript throughout; prefer named exports.
- Files: `kebab-case.ts` for libs; `PascalCase.tsx` for React components; route files under `packages/ui/pages/` follow Next.js conventions.
- No repo-wide ESLint/Prettier yet—if adding, match current formatting and 2‑space indent.

## Web & Mobile Deployment
- Current readiness: Web UI is exportable; Capacitor shell exists. Native plugin code is stubbed; heavy OCR/PDF work runs on main thread.
- Gaps to stores: Implement native plugins (Share‑In, Vision/OCR, PDF tools), add store assets/permissions, and ensure pdf.js worker is bundled from `public/` via `GlobalWorkerOptions.workerSrc`.
- Architecture improvements:
  - Platform adapters: inject OCR/Barcode/PDF via web workers (web) or Capacitor (mobile) instead of using DOM APIs in core.
  - Workers by default: route Tesseract/pdf.js through `packages/wasm` Comlink workers to avoid UI blocking.
  - PDF safety: prefer rasterized PDF rebuild to remove live text and hidden content.
  - Explicit APIs: remove global state in redaction; pass detections directly.
  - Packaging: add `public/pdf.worker.min.js`, lazy‑load heavy deps, and use static export for the UI.
- Build/release flow:
  - Web: `pnpm --filter @cleanshare/ui build && pnpm --filter @cleanshare/ui exec next export -o out` (deploy `packages/ui/out/`).
  - Mobile: `pnpm --filter @cleanshare/ui exec next export -o ../../apps/mobile/web && (cd apps/mobile && npx cap sync)` then build in Xcode/Android Studio.
- CI suggestions: `pnpm -r build`, run tests across packages, cache pnpm store, and publish web artifacts; optionally attach mobile build artifacts.

## Next Steps (Plan)
- Add platform adapters and wire UI to select web/native.
- Workerize OCR/PDF paths using `packages/wasm`.
- Switch to rasterized PDF redaction and add verification.
- Make redaction API explicit (no shared state).
- Add export/sync scripts and extend CI for web/mobile pipelines.

## Testing Guidelines
- Tests not yet defined; add per package using `*.test.ts` co-located under `src/` or `src/__tests__/`.
- Mock heavy deps (e.g., `tesseract.js`, `pdfjs-dist`) in unit tests.
- Add `"test"` scripts in each package; run suite with `pnpm -r test`. Use type-checking via `tsc -p` for quick feedback.

## Commit & Pull Request Guidelines
- Current history is minimal (e.g., “update”); adopt Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc. Include scopes like `ui:`, `core-detect:`, `native-bridge:`.
- PRs: clear description, linked issues, reproduction steps, before/after screenshots for UI, list affected packages, and update docs when behavior changes.

## Security & Configuration Tips
- Do not commit secrets or real PII; use files under `samples/` for demos.
- Avoid large binaries in git; consider Git LFS if assets grow.
