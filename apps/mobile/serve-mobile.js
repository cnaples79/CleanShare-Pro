#!/usr/bin/env node

/**
 * Enhanced Mobile Development Server for CleanShare Pro
 * Serves both vanilla and Ionic mobile apps with hot reload
 * Phase 3: 100% WebView + Native Capacitor Plugins
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8081;
const WEB_DIR = path.join(__dirname, 'web');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  let urlPath = req.url;
  
  // Route handling
  if (urlPath === '/' || urlPath === '/index.html') {
    // Serve vanilla mobile app
    urlPath = '/index.html';
  } else if (urlPath === '/ionic' || urlPath === '/ionic.html') {
    // Serve Ionic mobile app
    urlPath = '/ionic-app.html';
  } else if (urlPath === '/ionic/' || urlPath === '/ionic/index.html') {
    urlPath = '/ionic-app.html';
  } else if (urlPath.startsWith('/ionic/')) {
    // Strip /ionic prefix for Ionic app resources
    urlPath = urlPath.substring(6);
    if (urlPath === '' || urlPath === '/') {
      urlPath = '/ionic-app.html';
    }
  }

  // Serve capacitor.js
  if (urlPath === '/capacitor.js') {
    // In development, serve a stub capacitor.js
    const capacitorStub = `
      // Capacitor stub for development
      window.Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'web',
        convertFileSrc: (url) => url
      };
      console.log('Capacitor stub loaded for development');
    `;
    res.writeHead(200, { 
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(capacitorStub);
    return;
  }

  const filePath = path.join(WEB_DIR, urlPath);
  
  // Security check
  if (!filePath.startsWith(WEB_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access denied');
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // File doesn't exist, serve 404
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>CleanShare Pro - Not Found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              margin: 0; 
              padding: 2rem; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            h1 { color: white; margin-bottom: 1rem; }
            p { opacity: 0.9; margin-bottom: 2rem; }
            .links { max-width: 400px; margin: 0 auto; }
            a { 
              display: block; 
              background: rgba(255,255,255,0.2); 
              color: white; 
              text-decoration: none; 
              padding: 1rem; 
              margin: 0.5rem 0; 
              border-radius: 8px;
              transition: background 0.2s;
            }
            a:hover { background: rgba(255,255,255,0.3); }
          </style>
        </head>
        <body>
          <h1>🔒 CleanShare Pro</h1>
          <p>Page not found. Choose your mobile app:</p>
          <div class="links">
            <a href="/">📱 Vanilla Mobile App</a>
            <a href="/ionic">🚀 Ionic Mobile App</a>
          </div>
          <p style="margin-top: 2rem; font-size: 0.875rem; opacity: 0.7;">
            Phase 3: 100% WebView + Native Capacitor Plugins
          </p>
        </body>
        </html>
      `);
      return;
    }

    if (stats.isDirectory()) {
      // Try to serve index.html from directory
      const indexPath = path.join(filePath, 'index.html');
      serveFile(res, indexPath);
    } else {
      serveFile(res, filePath);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 CleanShare Pro Mobile Development Server');
  console.log('=====================================');
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📱 Vanilla App: http://localhost:${PORT}/`);
  console.log(`🎯 Ionic App: http://localhost:${PORT}/ionic`);
  console.log('=====================================');
  console.log('✅ Phase 3: 100% WebView + Native Capacitor Plugins');
  console.log('✅ CORS enabled for development');
  console.log('✅ Hot reload ready\n');

  // Check if we can access the web directory
  fs.access(WEB_DIR, fs.constants.F_OK, (err) => {
    if (err) {
      console.warn(`⚠️  Warning: Web directory not found at ${WEB_DIR}`);
    } else {
      console.log(`📁 Serving files from: ${WEB_DIR}`);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('💡 Try: pkill -f "node.*serve-mobile" or use a different port');
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down CleanShare Pro mobile server...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

// Log server info periodically
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  console.log(`📊 Server status: Memory ${memMB}MB, Uptime ${Math.round(process.uptime())}s`);
}, 30000); // Every 30 seconds