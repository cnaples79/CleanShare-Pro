import { CapacitorConfig } from '@capacitor/cli';

// Enhanced Capacitor configuration for CleanShare Pro Phase 3
// 100% WebView architecture with native Capacitor plugin integration
// Supports iOS and Android with optimized performance settings

const config: CapacitorConfig = {
  appId: 'com.cleanshare.pro',
  appName: 'CleanShare Pro',
  webDir: 'web',
  bundledWebRuntime: false,
  
  // Server configuration for development
  server: {
    hostname: 'localhost',
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },

  // Plugin configuration
  plugins: {
    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#2563eb',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff'
    },

    // Status Bar
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#2563eb'
    },

    // Filesystem access
    Filesystem: {
      iosScheme: 'capacitor'
    },

    // Share functionality
    Share: {
      // No specific config needed
    },

    // Toast notifications
    Toast: {
      // No specific config needed  
    },

    // Haptic feedback
    Haptics: {
      // No specific config needed
    },

    // Keyboard behavior
    Keyboard: {
      resize: 'body',
      style: 'light',
      resizeOnFullScreen: true
    }
  },

  // iOS specific configuration
  ios: {
    scheme: 'CleanShare Pro',
    contentInset: 'automatic',
    allowsLinkPreview: false,
    handleApplicationNotifications: false
  },

  // Android specific configuration  
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    loggingBehavior: 'debug',
    hideLogs: false
  }
};

export default config;