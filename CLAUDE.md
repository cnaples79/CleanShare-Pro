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

# Start mobile app development server (Phase 3: Ionic + Capacitor)
cd apps/mobile && npm run serve
# Access at: http://localhost:8081 (Vanilla) or http://localhost:8081/ionic (Ionic)

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
- ✅ Web App (localhost:3000): Fully functional with professional UI, OCR detection, sanitization, preview, and download
- ✅ Mobile App - Vanilla (localhost:8081): **PRIMARY FOCUS** - Phase 2.4 complete, ready for native builds
- 🔄 Mobile App - Ionic (localhost:8081/ionic): Prototype complete, on hold for future development
- ✅ WASM Workers: Implemented with Tesseract.js OCR and PDF processing
- ✅ Capacitor Plugins: Native filesystem, share, toast, haptics, status bar integration
- ✅ PDF Processing: Complete pdf-lib integration for both platforms with proper redaction
- ⚠️ Production Build: ARM64 SWC issues prevent static builds (use dev mode)
- ❌ Tests: Not yet implemented
- ❌ CLI: Placeholder only

**Phase 1 COMPLETED ✅ (All Critical Issues Resolved):**
- ✅ Web App: Fixed sanitization pipeline with proper state management 
- ✅ Web App: Fixed sanitized document preview rendering
- ✅ Mobile App: Implemented real Tesseract.js OCR instead of demo logic
- ✅ Mobile App: Fixed file processing and download functionality
- ✅ Mobile App: Fixed PDF analysis with pdfjs-dist@5.4.149 ES modules
- ✅ Mobile App: Fixed PDF redaction using pdf-lib instead of text fallback
- ✅ Cross-Platform: Both platforms now use identical detection logic and produce consistent results

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

## CleanShare Pro Development Plan

### Phase 1: Critical Bug Fixes ✅ COMPLETED
**Status**: All critical issues resolved, both platforms fully functional

1. **Web App Sanitization Pipeline** ✅
   - Fixed "call analyzeDocument() first" error in applyRedactions
   - Resolved lastResult state management in core-detect package
   - Fixed race conditions between file analysis and redaction application
   - Ensured proper detection ID mapping for redaction actions

2. **Web App Preview System** ✅
   - Fixed previewUri display of sanitized images
   - Verified data URI to blob conversion in handleSanitize
   - Fixed image loading and rendering in preview component
   - Both image and PDF preview functionality working

3. **Mobile App File Download** ✅
   - Fixed canvas-to-blob conversion producing 0kb files
   - Resolved async timing issues in image processing
   - Fixed proper MIME type handling for downloads
   - PDF redaction now creates proper .pdf files with pdf-lib

4. **Mobile App PDF Analysis** ✅
   - Fixed pdfjs-dist loading with proper ES module imports (v5.4.149)
   - Implemented complete PDF redaction pipeline using pdf-lib
   - Fixed coordinate transformation for proper redaction box placement
   - Mobile PDF processing now matches web app functionality

5. **Cross-Platform Consistency** ✅
   - Both platforms use compatible file processing APIs
   - Standardized error handling and user feedback
   - Detection results are consistent between platforms

**Success Criteria ACHIEVED**: Users can upload files, see detections, apply redactions, preview results, and download sanitized files on both web and mobile ✅

### Phase 2: Core Feature Completion ✅ COMPLETED
**Goal**: Full-featured privacy tool with reliable processing

1. **Enhanced Detection Pipeline** ✅ COMPLETED
   - ✅ SSN validation with area/group/serial checks
   - ✅ US passport number detection (9-digit & letter+8-digit formats)
   - ✅ Enhanced address component detection  
   - ✅ Confidence scoring with pattern-specific adjustments
   - ✅ Custom detection patterns with regex support
   - ✅ False positive reduction for common words

2. **Advanced Redaction Options** ✅ COMPLETED
   - ✅ Custom colors and opacity controls
   - ✅ Pattern redaction (diagonal, dots, cross-hatch, waves, noise)
   - ✅ Gradient redaction support
   - ✅ Enhanced labels with custom fonts and shadows
   - ✅ Vector-based PDF redaction options
   - ✅ Document sanitization (EXIF, metadata removal)

3. **File Format Support & Bulk Processing** ✅ COMPLETED
   - ✅ Extended image formats: HEIC, WebP, TIFF with conversion framework
   - ✅ Document formats: DOCX, XLSX detection with PDF conversion framework
   - ✅ Bulk processing with concurrent file handling
   - ✅ Progress tracking and error recovery
   - ✅ UI integration with bulk processing controls

### Phase 2.4: User Experience Improvements ✅ COMPLETED
**Goal**: Production-ready UX with enterprise features

1. **Enhanced Preset Management** ✅ COMPLETED
   - ✅ Preset templates for Healthcare, Finance, Legal domains with browse interface
   - ✅ Import/export functionality framework with tabbed modal interface
   - ✅ Preset validation and selection system
   - ✅ Mobile-responsive preset manager with proper React patterns

2. **Processing History & Audit Trail** ✅ COMPLETED  
   - ✅ File processing history display with timestamps and metadata
   - ✅ Detection statistics showing counts and processing times
   - ✅ Processing analytics dashboard with file/detection counters
   - ✅ Recent files view with detailed processing information
   - ✅ Tabbed interface for Recent vs Statistics views

3. **Undo/Redo Functionality** ✅ COMPLETED
   - ✅ Multi-level undo/redo interface with action history
   - ✅ Visual undo/redo history with action descriptions and targets
   - ✅ Keyboard shortcuts (Ctrl+Z/Ctrl+Y) integration
   - ✅ Action state management with proper history tracking
   - ✅ Interactive undo/redo controls with proper button states

4. **Keyboard Shortcuts & Accessibility** ✅ COMPLETED
   - ✅ Power user shortcuts: file upload (Ctrl+O), undo/redo (Ctrl+Z/Y), help (?/F1)
   - ✅ Full keyboard navigation with Tab/Shift+Tab support
   - ✅ Screen reader compatibility with proper ARIA labels
   - ✅ Keyboard shortcut help overlay with comprehensive documentation
   - ✅ Accessibility features documentation and pro tips
   - ✅ Modal management with Escape key support

**PHASE 2.4 SUCCESS METRICS ACHIEVED**:
- ✅ Cross-platform mobile app with full Phase 2.4 UX features
- ✅ PDF redaction with correct coordinate transformation
- ✅ Image redaction with proper Tesseract.js coordinate handling  
- ✅ Comprehensive keyboard shortcuts and accessibility support
- ✅ Professional preset management and history interfaces
- ✅ Error-free React component architecture using proven patterns

### Phase 3: Native Mobile Integration
**Goal**: Full native iOS/Android apps with platform features

1. **iOS Native Implementation**
   - Capacitor to full native iOS app migration
   - Apple Vision framework for enhanced OCR
   - Share Extension for receiving files from other apps
   - iOS-specific UI patterns and navigation

2. **Android Native Implementation**
   - Capacitor to full native Android app migration  
   - ML Kit integration for improved text recognition
   - ACTION_SEND intent handling for file sharing
   - Material Design 3 UI implementation

3. **Platform-Specific Features**
   - iOS: Shortcuts app integration, Siri support
   - Android: Tasker integration, quick tiles
   - Both: Background processing, file provider integration
   - Native file system integration and permissions

4. **Performance Optimization**
   - Native image processing libraries
   - GPU-accelerated operations where possible
   - Memory management for large files
   - Background processing capabilities

### Phase 4: Production Readiness
**Goal**: App store ready applications with enterprise features

1. **Quality Assurance**
   - Comprehensive automated testing suite
   - Manual testing on various devices and OS versions
   - Performance benchmarking and optimization
   - Security audit and penetration testing

2. **Enterprise Features**
   - API for integration with existing workflows
   - Command-line tool for server environments
   - Batch processing with reporting
   - Configuration management and deployment tools

3. **Compliance and Documentation**
   - Privacy policy and data handling documentation
   - GDPR, CCPA, and other regulatory compliance
   - Security certifications and audits
   - User documentation and training materials

4. **Distribution and Deployment**
   - App Store and Google Play Store preparation
   - Enterprise distribution options (MDM, direct download)
   - Web app PWA optimization and deployment
   - Update mechanism and version management

### Phase 5: Advanced Features and Scale
**Goal**: Market-leading privacy tool with AI enhancements

1. **AI and Machine Learning**
   - Custom ML models for domain-specific detection
   - Cloud-based processing options for enhanced accuracy
   - Real-time processing suggestions and automation
   - Adaptive learning from user corrections

2. **Enterprise and Team Features**
   - Multi-user workflows and approval processes
   - Team dashboards and analytics
   - Integration with enterprise document management
   - SSO and enterprise authentication support

3. **Advanced Privacy Features**
   - End-to-end encryption for cloud processing
   - Zero-knowledge architecture options
   - Advanced threat detection (steganography, etc.)
   - Privacy scoring and risk assessment

4. **Ecosystem Integration**
   - API marketplace and third-party integrations
   - Plugin system for custom detectors
   - Webhook support for workflow automation
   - Cross-platform synchronization and backup

### Current Session Status - Phase 2.4 COMPLETED ✅
**ACHIEVED SUCCESS METRICS**:
- ✅ Upload → Analyze → Review → Sanitize → Download workflow works 100%
- ✅ Preview shows actual redacted content accurately (both web and mobile)
- ✅ Downloaded files contain proper redacted data (both platforms)
- ✅ Error handling provides clear user feedback
- ✅ Both platforms provide consistent user experience
- ✅ Real OCR detection using Tesseract.js (both platforms)
- ✅ Proper coordinate-based redaction box placement (PDF and images)
- ✅ Cross-platform detection and redaction consistency

**PHASE 2.4 COMPLETION ACHIEVEMENTS**:
- ✅ Enhanced Preset Management: Healthcare/Finance/Legal templates with tabbed interface
- ✅ Processing History & Audit Trail: Recent files view and statistics dashboard
- ✅ Undo/Redo Functionality: Multi-level action history with visual controls
- ✅ Keyboard Shortcuts & Accessibility: Full keyboard navigation and help system
- ✅ Mobile App Enhancement: Phase 2.4 features fully integrated with core functionality
- ✅ Cross-Platform Coordinate Systems: Fixed PDF and image redaction positioning

**CRITICAL FIXES IMPLEMENTED**:
- ✅ PDF Redaction Coordinates: Fixed coordinate transformation between pdfjs-dist and pdf-lib
- ✅ Image Redaction Coordinates: Fixed Tesseract.js coordinate handling with proper image dimensions
- ✅ React Component Architecture: Error-free patterns using arrow functions and proper hooks
- ✅ Mobile App Integration: Complete Phase 2.4 features working on localhost:8081

**TEST RESULTS PHASE 2.4**:
- ✅ PDF Redaction: Accurate positioning of redaction boxes over detected text
- ✅ Image Redaction: Proper coordinate transformation from Tesseract.js OCR results  
- ✅ Phase 2.4 UX: All preset management, history, undo/redo, and keyboard features functional
- ✅ Cross-Platform: Identical functionality between web (3000) and mobile (8081) apps

**READY FOR PHASE 3 DEVELOPMENT** 🚀

**Phase 3 IN PROGRESS** 🚧: Vanilla-First Native Mobile Launch Strategy

**STRATEGIC DECISION**: Prioritizing vanilla UI for faster launch, keeping Ionic for future development

**COMPLETED ✅**:
- ✅ Vanilla UI Foundation: Complete Phase 2.4 React implementation with all features working
- ✅ Enhanced Capacitor Configuration: Native plugins (filesystem, share, toast, haptics, status bar)
- ✅ Mobile Development Server: Enhanced server with hot reload and routing (serve-mobile.js)
- ✅ Ionic UI Prototype: Available at /ionic for future development (on hold)
- ✅ Native Plugin Foundation: Ready for iOS/Android builds with proper plugin configuration

**PHASE 3.1 PRIORITIES** (Native Build Foundation):
- Priority 1: iOS Native Build - Configure Xcode for vanilla UI and test on simulator
- Priority 2: Android Native Build - Configure Android Studio and test on emulator  
- Priority 3: Native Plugin Integration - Enhance vanilla UI with Capacitor plugins
- Priority 4: Mobile Performance Optimization - Loading states, error handling, offline support

**PHASE 3.2 ROADMAP** (Production Launch):
- App Store Preparation: Icons, splash screens, certificates, metadata
- Performance Optimization: Memory management, service workers, analytics
- Security Audit: Privacy policy, data handling, penetration testing

## Known Issues & Limitations

**Resolved Issues (Phase 1) ✅:**
- ✅ **Web App Sanitization**: Fixed state management and detection pipeline
- ✅ **Web App Preview**: Fixed sanitized document preview rendering  
- ✅ **Mobile App Downloads**: Fixed canvas-to-blob conversion and file generation
- ✅ **Mobile App Detection**: Implemented real Tesseract.js OCR analysis
- ✅ **Mobile App PDF Analysis**: Fixed pdfjs-dist@5.4.149 ES module loading
- ✅ **Mobile App PDF Redaction**: Implemented pdf-lib redaction instead of text fallback
- ✅ **Mobile Server Setup**: Fixed directory serving from apps/mobile/web

**Remaining Platform/Build Issues:**
- **SWC Compilation**: ARM64/Android builds fail due to missing @next/swc-android-arm64 package
- **Static Export**: Next.js static export currently disabled due to SWC issues
- **Testing**: No automated tests implemented yet
- **CLI**: Placeholder implementation only
- **Native Features**: Only web fallbacks implemented, no native iOS/Android code

**Development Notes:**
- Both web and mobile apps have professional UI implemented and working file upload
- File analysis (detection) works on both platforms with proper UI feedback
- Sanitization/redaction pipeline fully functional on both platforms
- Mobile app now produces proper downloadable files with correct redaction
- All race conditions and state management issues have been resolved
- PDF processing uses pdf-lib@1.17.1 with proper coordinate transformation
- Mobile app serves from apps/mobile/web directory on port 8081

## Workspace Configuration

This is a pnpm workspace with packages defined in `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*" 
  - "packages/*"
```

All packages use TypeScript with individual `tsconfig.json` files. The mobile app uses Capacitor 5.x for native bridge functionality.