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
# Start Next.js UI development server (Web App)
pnpm --filter @cleanshare/ui dev
# or from root
pnpm dev
# Access at: http://localhost:3000

# Start mobile app development server
cd apps/mobile && python3 -m http.server 3002
# Access at: http://localhost:3002 (Note: Port 3001 may be in use)

# Build all packages (TypeScript compilation) - REQUIRED FIRST
pnpm --filter @cleanshare/core-detect build
pnpm --filter @cleanshare/wasm build
pnpm --filter @cleanshare/native-bridge build

# Build UI for production (currently has SWC issues on ARM64/Android)
# Use development mode for now: pnpm --filter @cleanshare/ui dev

# Run CLI tool for development/testing (when implemented)
# pnpm --filter @cleanshare/cli build && pnpm exec node apps/cli/bin/index.js sanitize ./samples/images
```

**Current Status:** 
- 🔄 Web App (localhost:3000): Professional UI implemented, but sanitization failing
- 🔄 Mobile App (localhost:3002): Professional UI implemented, but download producing 0kb files
- ✅ WASM Workers: Implemented with Tesseract.js OCR and PDF processing
- ✅ Native Bridge: Web fallbacks implemented for all Capacitor plugins
- ⚠️ Production Build: ARM64 SWC issues prevent static builds (use dev mode)
- ❌ Tests: Not yet implemented
- ❌ CLI: Placeholder only

**Active Issues (As of Latest Session):**
- 🐛 Web App: Sanitization error "call analyzeDocument() first" despite re-analysis attempt
- 🐛 Web App: Sanitized document preview not displaying
- 🐛 Mobile App: Download failing and producing 0kb image files 
- 🐛 Mobile App: Canvas processing not generating valid image data

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

- **`packages/wasm`** - ✅ WebAssembly workers for CPU-intensive tasks
  - Tesseract.js Web Worker with Comlink for improved OCR performance
  - PDF processing worker using pdf-lib for large file handling  
  - Worker manager for easy lifecycle management
  - Full TypeScript compilation and build system

- **`packages/native-bridge`** - ✅ Capacitor plugins with web fallbacks
  - ShareInWeb: File picker fallback with drag-drop support
  - VisionWeb: OCR integration using WASM worker + QR code detection with jsQR
  - PdfToolsWeb: Complete PDF manipulation using pdf-lib worker
  - Seamless Capacitor plugin registration for cross-platform compatibility

### Apps

- **`apps/mobile`** - ✅ Capacitor wrapper for iOS/Android  
  - Mobile-ready HTML/JS interface with Capacitor integration
  - Cross-platform compatibility (works in browser and mobile WebView)
  - Module loading system for all CleanShare packages
  - File processing pipeline integration with demo functionality
  - Ready for native iOS/Android builds

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

## Phase 2 Implementation Plan

### Priority 1: Production Readiness
1. **Fix ARM64/Android SWC Issues**
   - Investigate Next.js 14.1.0 SWC compilation on ARM64
   - Consider upgrading to newer Next.js version or alternative build setup
   - Implement static export functionality for mobile deployment

2. **Comprehensive Testing**
   - Unit tests for all detector functions
   - Integration tests for detection pipeline
   - End-to-end tests for file processing workflow
   - Mobile app testing on actual devices

3. **Performance Optimization**
   - Implement proper WASM worker pooling
   - Add progress indicators for long-running operations
   - Optimize memory usage for large PDF files
   - Implement file chunking for better performance

### Priority 2: Native Mobile Features
4. **Android Native Plugins**
   - Implement ShareIn plugin for ACTION_SEND intents
   - Integrate ML Kit for native OCR performance
   - Add native PDF processing capabilities

5. **iOS Native Plugins**
   - Create Share Extension for receiving shared files
   - Integrate Apple Vision framework for text recognition
   - Implement native PDF processing with PDFKit

6. **Enhanced Mobile UI**
   - Touch-optimized detection overlay
   - Responsive design improvements
   - Native navigation and gestures

### Priority 3: Advanced Features
7. **CLI Tool Implementation**
   - Complete command-line interface
   - Batch processing capabilities
   - JSON/CSV reporting options
   - CI/CD integration features

8. **Enhanced Detection**
   - Face detection using MediaPipe or TensorFlow.js
   - Advanced barcode detection beyond QR codes
   - Custom detection pattern training
   - Cloud-based detection assistance

9. **Production Deployment**
   - App store preparation and assets
   - Code signing and distribution
   - Privacy policy and compliance documentation
   - Performance monitoring and analytics

## Known Issues & Limitations

**Critical Functionality Issues:**
- **Web App Sanitization**: "call analyzeDocument() first" error persists despite re-analysis before redaction
- **Web App Preview**: Sanitized document preview not rendering despite UI implementation
- **Mobile App Downloads**: Producing 0kb files, canvas-to-blob conversion failing
- **Mobile App Canvas**: Image processing logic may have async/timing issues

**Platform/Build Issues:**
- **SWC Compilation**: ARM64/Android builds fail due to missing @next/swc-android-arm64 package
- **Static Export**: Next.js static export currently disabled due to SWC issues
- **Testing**: No automated tests implemented yet
- **CLI**: Placeholder implementation only
- **Native Features**: Only web fallbacks implemented, no native iOS/Android code

**Development Notes:**
- Both web and mobile apps have professional UI implemented and working file upload
- File analysis (detection) works on both platforms with proper UI feedback
- Core issue appears to be in the sanitization/redaction pipeline and file output generation
- Mobile app produces visual redactions on canvas but fails to create downloadable files
- Web app has race condition or state management issue with analysis results

## Workspace Configuration

This is a pnpm workspace with packages defined in `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*" 
  - "packages/*"
```

All packages use TypeScript with individual `tsconfig.json` files. The mobile app uses Capacitor 5.x for native bridge functionality.