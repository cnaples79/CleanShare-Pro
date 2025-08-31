## @cleanshare/ui

This package contains the Next.js user interface for CleanShare Pro.  It provides a simple file picker, shows detected sensitive information on a preview, and allows the user to export a sanitised copy.  The UI imports functions from `@cleanshare/core-detect` for analysis and redaction.

### Development

1. Install dependencies at the root of the repository with `pnpm install`.
2. Run the development server:
   ```bash
   pnpm --filter @cleanshare/ui dev
   ```
3. Navigate to http://localhost:3000 to use the app.  Select an image or PDF to see detections and export a redacted copy.

### Build

To build the UI for production (for use inside the Capacitor shell), run:

```bash
pnpm --filter @cleanshare/ui build
```

This will output a `.next` build folder.  You can then run `next start` or copy the build into the `apps/mobile/web` directory for bundling with Capacitor.
