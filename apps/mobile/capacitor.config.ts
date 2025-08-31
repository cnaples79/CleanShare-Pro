import { CapacitorConfig } from '@capacitor/cli';

// The Capacitor configuration for the mobile wrapper.  This file defines
// the native bundle identifiers, the directory containing the web
// application that will be served by the WebView, and any plugin
// configuration.  See https://capacitorjs.com/docs/config for more
// information on the available options.

const config: CapacitorConfig = {
  appId: 'com.cleanshare.pro',
  appName: 'CleanShare Pro',
  webDir: 'web',
  bundledWebRuntime: false,
  plugins: {
    ShareIn: {},
    Vision: {},
    PdfTools: {}
  }
};

export default config;