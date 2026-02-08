import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object
let mainWindow;

// Disable hardware acceleration if needed for compatibility
// app.disableHardwareAcceleration();

function createWindow() {
  // Configure session security
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*;"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';"
        ]
      }
    });
  });

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      // Security enhancements
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Performance optimizations
      backgroundThrottling: false,
      spellcheck: false,
    },
    // Modern window styling
    backgroundColor: '#ffffff',
    show: false, // Don't show until ready
    // Better window behavior
    center: true,
    resizable: true,
    fullscreenable: true,
    // macOS specific
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 16 } : undefined,
  });

  // Optimize renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    // Optimize memory in production
    if (!isDev) {
      mainWindow.webContents.executeJavaScript(`
        // Disable right-click context menu in production
        window.addEventListener('contextmenu', (e) => {
          if (!${isDev}) e.preventDefault();
        });
      `);
    }
  });

  // Load the app
  if (isDev) {
    // Development: Load from Vite dev server directly to app route
    mainWindow.loadURL('http://localhost:5173/#/app').catch(err => {
      console.error('Failed to load dev server:', err);
      app.quit();
    });
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files with hash routing to app
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath, { hash: '/app' }).catch(err => {
      console.error('Failed to load app:', err);
      app.quit();
    });
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links (open in browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const currentUrl = mainWindow.webContents.getURL();

    // Allow navigation within the app
    if (isDev && parsedUrl.origin === 'http://localhost:5173') {
      return;
    }

    // Prevent navigation to external URLs
    if (parsedUrl.origin !== new URL(currentUrl).origin && currentUrl !== '') {
      event.preventDefault();
    }
  });

  // Performance monitoring in development
  if (isDev) {
    mainWindow.webContents.on('console-message', (event, level, message) => {
      console.log(`[Renderer]: ${message}`);
    });
  }
}

// App ready
app.whenReady().then(() => {
  // Security: Set app user model ID for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.toolbit.app');
  }

  // Optimize app for performance
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
  app.commandLine.appendSwitch('disable-site-isolation-trials');

  // Clear cache on startup in development
  if (isDev) {
    session.defaultSession.clearCache();
  }

  createWindow();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Before quit - cleanup
app.on('before-quit', () => {
  // Cleanup tasks here
  mainWindow = null;
});

// ==================== IPC Handlers ====================

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Get platform info
ipcMain.handle('get-platform', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    isElectron: true,
  };
});

// Get system info
ipcMain.handle('get-system-info', () => {
  return {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
  };
});

// Minimize window
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

// Maximize/unmaximize window
ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

// Close window
ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// Check if window is maximized
ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// ==================== Security ====================

// Prevent navigation to external URLs globally
app.on('web-contents-created', (event, contents) => {
  // Prevent navigation
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const validOrigins = ['http://localhost:5173', 'file://'];

    if (!validOrigins.some(origin => navigationUrl.startsWith(origin))) {
      event.preventDefault();
    }
  });

  // Prevent new windows
  contents.setWindowOpenHandler(({ url }) => {
    // Open external URLs in the default browser
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});

// ==================== Error Handling ====================

// Handle potential crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log error or report to error tracking service
  if (!isDev) {
    // Could send to error tracking service here
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log error or report to error tracking service
});

// ==================== Development ====================

// Development: Log app info
if (isDev) {
  console.log('App starting in development mode');
  console.log('Electron version:', process.versions.electron);
  console.log('Node version:', process.versions.node);
  console.log('Chrome version:', process.versions.chrome);
}
