# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Prerequisites:** Node 18+ with pnpm

**Initial Setup:**
```bash
pnpm install  # Install dependencies across all packages
```

**Development:**
```bash
# Start Next.js UI development server
pnpm --filter @cleanshare/ui dev
# or from root
pnpm dev

# Build all packages (TypeScript compilation)
pnpm --filter @cleanshare/core-detect build
pnpm --filter @cleanshare/wasm build
pnpm --filter @cleanshare/native-bridge build
pnpm --filter @cleanshare/cli build

# Build UI for production
pnpm --filter @cleanshare/ui build
# or from root
pnpm build

# Run CLI tool for development/testing
pnpm --filter @cleanshare/cli build && pnpm exec node apps/cli/bin/index.js sanitize ./samples/images
```

**Note:** Tests are not yet implemented (`"test": "echo \"No tests defined yet\""`)

## Architecture

CleanShare Pro is a monorepo for a cross-platform privacy tool that sanitizes images and PDFs by detecting and redacting sensitive information (emails, phone numbers, credit cards, etc.).

### Package Structure

- **`packages/ui`** - Next.js application providing the web/mobile UI
  - Uses React with TypeScript
  - Renders file picker, review canvas, detection overlay, export screen
  - Spawns Web Workers for heavy operations (OCR, PDF parsing) via Comlink
  - Runs in WebView for Capacitor mobile apps

- **`packages/core-detect`** - Platform-agnostic detection and redaction logic
  - Core types: `InputFile`, `Box`, `DetectionKind`, `Detection`, `RedactionStyle`, etc.
  - Pure detector functions for emails, phones, credit cards (Luhn), IBAN (MOD 97), JWT, AWS keys
  - Pipeline orchestrating OCR → token extraction → detection → result construction
  - Redaction drawing on images (Canvas) and PDFs (pdf-lib)

- **`packages/wasm`** - WebAssembly workers for CPU-intensive tasks
  - Tesseract.js for OCR fallback when native unavailable
  - PDF rebuild and sanitization helpers
  - Exposed as async functions via Comlink

- **`packages/native-bridge`** - Capacitor plugins for native functionality
  - Share-In: Receive files from system share sheet
  - Vision/OCR: Bridge Apple Vision/Google ML Kit to JavaScript
  - PDF Tools: (Post-MVP) Advanced native PDF sanitization

### Apps

- **`apps/mobile`** - Capacitor wrapper for iOS/Android
  - Contains native code, icons, splash screens, configuration
  - Build requires copying UI build to `apps/mobile/web` first

- **`apps/cli`** - Node.js CLI for batch processing
  - Uses `core-detect` and `wasm` packages
  - Useful for automated testing and bulk processing

### Data Flow

1. **File Selection** → JavaScript `File` object passed to pipeline
2. **Analysis** → `analyzeDocument()` uses native OCR or Tesseract.js fallback
3. **User Review** → UI draws bounding boxes, allows redaction customization  
4. **Redaction** → `applyRedactions()` draws boxes on pages, strips metadata
5. **Export** → New sanitized file triggers system share sheet

### Extension Points

- **Additional detectors:** Add to `core-detect/src/detectors` with `detect(token: string)` function
- **Vector PDF redaction:** Can be added to native plugins or WASM layer
- **Cloud assist:** Send only OCR tokens/boxes to remote service, merge with local results

## Workspace Configuration

This is a pnpm workspace with packages defined in `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*" 
  - "packages/*"
```

All packages use TypeScript with individual `tsconfig.json` files. The mobile app uses Capacitor 5.x for native bridge functionality.