## Mobile App (Capacitor)

This directory contains the Capacitor wrapper for iOS and Android.  It is responsible for packaging the Next.js build into a native shell, implementing share‑in functionality, and hosting any platform‑specific plugins.

The mobile app depends on the `@cleanshare/ui` package for its WebView content and on `@cleanshare/native-bridge` for native plugins.  You will need Xcode for iOS builds and Android Studio for Android builds.

### Development

1. Install dependencies at the root of the repository: `pnpm install`.
2. Build the web app into the `apps/mobile/web` folder:
   ```bash
   pnpm --filter @cleanshare/ui build
   ```
3. Copy the build output into the Capacitor `web/` directory by running:
   ```bash
   pnpm --filter @cleanshare/mobile build
   ```
4. Open the native projects:
   ```bash
   pnpm cap open ios   # opens Xcode
   pnpm cap open android  # opens Android Studio
   ```

For details on the Capacitor configuration and available plugins, see the Capacitor documentation and the README files under `packages/native-bridge`.
