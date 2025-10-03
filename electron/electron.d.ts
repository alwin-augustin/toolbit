/**
 * TypeScript definitions for Electron API exposed via preload script
 */

export interface ElectronAPI {
  // App information
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<{
    platform: string;
    arch: string;
    version: string;
  }>;

  // Check if running in Electron
  isElectron: () => boolean;

  // IPC Communication
  sendMessage: (channel: string, data: any) => void;
  onMessage: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    devTools?: {
      log: (...args: any[]) => void;
    };
  }
}

export {};
