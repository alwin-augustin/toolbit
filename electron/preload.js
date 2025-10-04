import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload Script
 *
 * This script runs in a secure context and exposes specific APIs
 * to the renderer process using contextBridge.
 *
 * SECURITY: NEVER expose entire modules like 'ipcRenderer' or 'remote' directly!
 * All exposed APIs must be whitelisted and validated.
 */

const isDev = process.env.NODE_ENV === 'development';

// Valid IPC channels - whitelist for security
const VALID_CHANNELS = {
  send: ['message-to-main'],
  receive: ['message-from-main'],
};

// Helper to validate channels
const isValidChannel = (channel, type) => {
  return VALID_CHANNELS[type]?.includes(channel) || false;
};

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // ==================== App Information ====================

  // Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Get platform info
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Get detailed system info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Check if running in Electron
  isElectron: () => true,

  // ==================== Window Controls ====================

  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  },

  // ==================== IPC Communication ====================

  // Send message to main process (validated)
  sendMessage: (channel, data) => {
    if (isValidChannel(channel, 'send')) {
      ipcRenderer.send(channel, data);
      return true;
    }
    console.warn(`[Security] Blocked send to invalid channel: ${channel}`);
    return false;
  },

  // Receive message from main process (validated)
  onMessage: (channel, callback) => {
    if (isValidChannel(channel, 'receive')) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);

      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    console.warn(`[Security] Blocked receive from invalid channel: ${channel}`);
    return () => {}; // Return no-op function
  },

  // Remove listener (validated)
  removeListener: (channel, callback) => {
    if (isValidChannel(channel, 'receive')) {
      ipcRenderer.removeListener(channel, callback);
      return true;
    }
    return false;
  },

  // ==================== Performance ====================

  // Get memory usage info
  getMemoryInfo: () => {
    if (process) {
      return {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
      };
    }
    return null;
  },
});

// ==================== Development Tools ====================

if (isDev) {
  contextBridge.exposeInMainWorld('devTools', {
    log: (...args) => console.log('[Electron Preload]:', ...args),
    warn: (...args) => console.warn('[Electron Preload]:', ...args),
    error: (...args) => console.error('[Electron Preload]:', ...args),

    // Get process info
    getProcessInfo: () => ({
      versions: process.versions,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV,
    }),
  });

  // Log preload initialization
  console.log('[Electron Preload] Initialized in development mode');
  console.log('[Electron Preload] Node:', process.versions.node);
  console.log('[Electron Preload] Electron:', process.versions.electron);
  console.log('[Electron Preload] Chrome:', process.versions.chrome);
}

// ==================== Security Hardening ====================

// Prevent modification of exposed APIs
Object.freeze(window.electronAPI);
if (isDev) {
  Object.freeze(window.devTools);
}

// Log successful initialization
console.log('[Electron Preload] Context bridge initialized successfully');
