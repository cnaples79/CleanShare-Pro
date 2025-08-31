package com.cleansharepro;

import com.getcapacitor.BridgeActivity;

/**
 * The entry point for the Android application.  Capacitor uses a single
 * activity that extends {@link com.getcapacitor.BridgeActivity}.  The
 * majority of the app’s logic lives in the web layer (Next.js), while this
 * class simply hosts the WebView and bootstraps any plugins you have
 * registered.  If you add custom native plugins to the project, you
 * typically do not need to modify this class.
 */
public class MainActivity extends BridgeActivity {
    // Additional plugin registration can be performed in onCreate() if
    // required.  At present, plugins are auto-registered via the
    // capacitor.config.ts configuration.
}