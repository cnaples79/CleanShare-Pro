# CleanShare Pro

CleanShare Pro is a cross‑platform privacy tool that helps you safely share images and documents from your mobile device.  It scans screenshots, photos, and PDFs for sensitive information such as emails, phone numbers, credit card numbers, tokens, and other personally identifiable information (PII).  It then allows you to review the detected content, apply redactions or obfuscations, and export a sanitized copy with metadata stripped.

The project is organised as a monorepo using a pnpm workspace.  It contains separate packages for the web/mobile UI, core detection logic, WebAssembly helpers, and native bridges for Capacitor.  A CLI is also provided for batch sanitisation during development.

## Quick start

This repository is intended to be built using Node 18+ with `pnpm`.  After cloning the repository you can bootstrap the workspace as follows:

```bash
# Install dependencies across all packages
pnpm install

# Start the Next.js development server (packages/ui)
pnpm --filter @cleanshare/ui dev

# Run the CLI on a folder of images (for development)
pnpm --filter @cleanshare/cli build && pnpm exec node apps/cli/bin/index.js sanitize ./samples/images
```

For detailed setup instructions, see the individual package READMEs under `apps/` and `packages/`.
