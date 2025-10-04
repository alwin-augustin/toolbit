/**
 * TypeScript definitions for Electron API exposed via preload script
 */

export interface SystemInfo {
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  platform: string;
  arch: string;
}

export interface PlatformInfo {
  platform: string;
  arch: string;
  version: string;
  isElectron: boolean;
}

export interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface ProcessInfo {
  versions: NodeJS.ProcessVersions;
  platform: string;
  arch: string;
  env: string;
}

export interface ElectronAPI {
  // App information
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<PlatformInfo>;
  getSystemInfo: () => Promise<SystemInfo>;

  // Check if running in Electron
  isElectron: () => boolean;

  // Window controls
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<boolean>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };

  // IPC Communication
  sendMessage: (channel: string, data: any) => boolean;
  onMessage: (channel: string, callback: (...args: any[]) => void) => () => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => boolean;

  // Performance
  getMemoryInfo: () => MemoryInfo | null;
}

export interface DevTools {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  getProcessInfo: () => ProcessInfo;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    devTools?: DevTools;
  }
}

export {};
