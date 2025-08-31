## CLI Tool

This directory contains a simple command‑line interface for batch sanitisation of files.  It wraps the core detection logic provided by `@cleanshare/core-detect` and the rendering helpers in `@cleanshare/wasm`.

The CLI is useful for testing and for processing multiple screenshots or PDFs at once.  It is not intended to replace the mobile experience but rather to aid development and integration workflows.

### Usage

After bootstrapping the repository with `pnpm install` you can run the CLI on a folder of images or PDFs:

```bash
# Build the CLI package
pnpm --filter @cleanshare/cli build

# Execute the CLI to sanitise files in ./samples
pnpm exec node apps/cli/bin/index.js sanitize ./samples
```

The CLI currently supports the following commands:

* `sanitize <path>` – Recursively searches the directory at `<path>` for supported file types (JPEG, PNG, PDF) and produces sanitised copies in an `out/` folder next to each file.

The CLI respects the same presets and detection logic as the mobile app.  See the `@cleanshare/core-detect` package for details.
