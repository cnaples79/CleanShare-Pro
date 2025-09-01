# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by `pnpm` workspaces.
- `apps/cli`: Node CLI (entry at `apps/cli/bin/index.js`).
- `apps/mobile`: Capacitor shell; serves built UI from `apps/mobile/web/`.
- `packages/ui`: Next.js app (`pages/`, `styles/`).
- `packages/core-detect`, `packages/native-bridge`, `packages/wasm`: TypeScript libs with `src/` → `dist/`.
- `docs/` (architecture, roadmap) and `samples/` (images, pdfs).

## Build, Test, and Development Commands
- Install: `pnpm install` (bootstraps all workspaces).
- UI dev: `pnpm --filter @cleanshare/ui dev` (http://localhost:3000).
- Build all: `pnpm -r build` (or `pnpm --filter <pkg> build`).
- UI prod: `pnpm --filter @cleanshare/ui start` after building.
- CLI example: `pnpm --filter @cleanshare/cli build && pnpm exec node apps/cli/bin/index.js sanitize ./samples`.
- Mobile: `pnpm --filter @cleanshare/ui build`, copy output into `apps/mobile/web/`, then package/open with the Capacitor CLI.

## Coding Style & Naming Conventions
- Indentation: 2 spaces, LF, final newline (see `.editorconfig`).
- TypeScript throughout; prefer named exports.
- Files: `kebab-case.ts` for libs; `PascalCase.tsx` for React components; route files under `packages/ui/pages/` follow Next.js conventions.
- No repo-wide ESLint/Prettier yet—if adding, match current formatting and 2‑space indent.

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
