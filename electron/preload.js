import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload Script
 *
 * This script runs in a secure context and exposes specific APIs
 * to the renderer process using contextBridge.
 *
 * NEVER expose entire modules like 'ipcRenderer' or 'remote' directly!
 */

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Check if running in Electron
  isElectron: () => true,

  // Example: Send message to main process
  sendMessage: (channel, data) => {
    // Whitelist channels for security
    const validChannels = ['message-to-main'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Example: Receive message from main process
  onMessage: (channel, callback) => {
    const validChannels = ['message-from-main'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // Remove listener
  removeListener: (channel, callback) => {
    const validChannels = ['message-from-main'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
});

// Development helpers
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('devTools', {
    log: (...args) => console.log('[Electron Preload]:', ...args),
  });
}
