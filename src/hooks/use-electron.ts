import { useEffect, useState } from 'react';

/**
 * Custom hook to detect if the app is running in Electron
 * and provide access to Electron API
 */
export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [platform, setPlatform] = useState<{
    platform: string;
    arch: string;
    version: string;
  } | null>(null);

  useEffect(() => {
    // Check if running in Electron
    if (window.electronAPI?.isElectron()) {
      setIsElectron(true);

      // Get app version
      window.electronAPI.getAppVersion().then(setAppVersion);

      // Get platform info
      window.electronAPI.getPlatform().then(setPlatform);
    }
  }, []);

  return {
    isElectron,
    appVersion,
    platform,
    electronAPI: window.electronAPI,
  };
}

/**
 * Helper function to check if running in Electron
 * (Can be used outside of React components)
 */
export function isElectronApp(): boolean {
  return window.electronAPI?.isElectron() ?? false;
}
