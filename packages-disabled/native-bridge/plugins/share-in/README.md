## Share‑In Plugin

This Capacitor plugin receives files from the system share sheet and passes them to the JavaScript layer.  The plugin should be registered in the Capacitor config (`capacitor.config.json`) and exported via the `@cleanshare/native-bridge` package.

### iOS

On iOS you implement this plugin as a Share Extension.  The extension should accept `public.image` and `com.adobe.pdf` UTIs, write the shared file to a shared container (using an App Group), and then open the main app with a URL containing a reference to the file.  The main app then reads the file and passes it to the UI.

### Android

On Android you register `Intent` filters for `ACTION_SEND` and `ACTION_SEND_MULTIPLE` with MIME types `image/*` and `application/pdf` in the plugin’s manifest.  When the intent is received, copy the contents of the provided URI into your app’s cache directory and emit an event to JavaScript.

### JavaScript API

The plugin should expose a method such as `getSharedFiles(): Promise<InputFile[]>` that returns a list of files shared into the app.  You can then call `analyzeDocument()` on each file in the UI.
