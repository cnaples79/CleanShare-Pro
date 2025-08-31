// Capacitor stub for web environment
// This file provides basic Capacitor compatibility when running in a web browser

console.log('Loading Capacitor web stub...');

// Basic Capacitor API stub
window.Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web',
  convertFileSrc: (filePath) => filePath,
  
  // Plugin system stub
  Plugins: {},
  
  // Platform detection
  platform: 'web',
  isPluginAvailable: (pluginName) => false,
  
  // Basic app info
  appInfo: {
    name: 'CleanShare Pro',
    id: 'com.cleanshare.pro',
    build: '1.0.0',
    version: '1.0.0'
  }
};

console.log('✓ Capacitor web stub loaded');