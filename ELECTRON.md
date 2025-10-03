# Electron Desktop App Setup

This guide explains how to run and build the Toolbit desktop application using Electron.

## 📁 Project Structure

```
toolbit/
├── src/                 # Application source code
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and helpers
│   └── ...
├── electron/
│   ├── main.js          # Electron main process (Node.js environment)
│   ├── preload.js       # Preload script (secure IPC bridge)
│   └── electron.d.ts    # TypeScript definitions for Electron API
├── public/              # Static assets
├── dist/                # Built web/electron app (generated)
├── build/               # Electron builder resources (icons)
│   ├── icon.ico        # Windows icon (256x256)
│   ├── icon.icns       # macOS icon
│   └── icon.png        # Linux icon (512x512)
├── release/            # Electron installers (generated)
└── index.html          # Entry HTML
```

## 🚀 Development

### Run Electron in Development Mode

```bash
npm run electron:dev
```

This will:
1. Start Vite dev server on `http://localhost:5173`
2. Launch Electron window loading the dev server
3. Enable hot reload for React components
4. Open DevTools automatically

### How It Works

- **Vite Dev Server**: Runs your React app with hot module replacement
- **Electron Window**: Loads `http://localhost:5173` in development
- **Auto Reload**: Changes to React components reload instantly
- **DevTools**: Automatically opened for debugging

## 🏗️ Building for Production

### Build for Current Platform

```bash
npm run electron:build
```

### Build for Specific Platform

```bash
# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac

# Linux
npm run electron:build:linux
```

### Build Output

Installers are created in the `release/` directory:
- **Windows**: `.exe` installer (NSIS)
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` and `.deb` package

## 🌐 Web vs Desktop Builds

### Web Build (Cloudflare Pages)

```bash
npm run build
```

- Outputs to `dist/`
- Uses absolute paths (`/`)
- Optimized for web deployment
- No Electron code included

### Desktop Build

```bash
npm run electron:build
```

- Outputs to `dist/` then packages with Electron
- Uses relative paths (`./`) for file:// protocol
- Includes Electron runtime
- Creates platform-specific installers

## 🔌 Using Electron API in React

### Detect if Running in Electron

```tsx
import { useElectron } from '@/hooks/use-electron';

function MyComponent() {
  const { isElectron, appVersion, platform } = useElectron();

  return (
    <div>
      {isElectron ? (
        <p>Running in Electron v{appVersion}</p>
      ) : (
        <p>Running in browser</p>
      )}
    </div>
  );
}
```

### Using Electron API Directly

```tsx
// Check if running in Electron
if (window.electronAPI?.isElectron()) {
  // Get app version
  const version = await window.electronAPI.getAppVersion();

  // Get platform info
  const info = await window.electronAPI.getPlatform();

  // Send message to main process
  window.electronAPI.sendMessage('message-to-main', { data: 'hello' });

  // Listen for messages from main process
  window.electronAPI.onMessage('message-from-main', (data) => {
    console.log('Received:', data);
  });
}
```

## 🎨 Customizing the App

### App Icons

Place your app icons in the `build/` directory:

1. **Windows** (`icon.ico`):
   - 256x256 pixels
   - .ico format

2. **macOS** (`icon.icns`):
   - Multiple sizes (16x16 to 512x512)
   - .icns format
   - Use [png2icns](https://github.com/idesis-gmbh/png2icns) to convert

3. **Linux** (`icon.png`):
   - 512x512 pixels
   - .png format

### App Metadata

Edit `package.json`:

```json
{
  "name": "toolbit",
  "version": "1.0.0",
  "description": "A comprehensive collection of developer utilities",
  "author": {
    "name": "Toolbit",
    "email": "alwinaugustin@gmail.com"
  },
  "build": {
    "appId": "com.toolbit.app",
    "productName": "Toolbit"
  }
}
```

### Window Options

Edit `electron/main.js`:

```javascript
mainWindow = new BrowserWindow({
  width: 1280,        // Default width
  height: 800,        // Default height
  minWidth: 800,      // Minimum width
  minHeight: 600,     // Minimum height
  // ... other options
});
```

## 🔒 Security

### Preload Script (electron/preload.js)

The preload script uses `contextBridge` to safely expose APIs:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // Only expose specific, whitelisted functions
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // ... other safe APIs
});
```

### Security Best Practices

✅ **Enabled:**
- Context Isolation
- Sandbox mode
- Node integration disabled
- Remote module disabled

❌ **Never do:**
- Expose entire `ipcRenderer` to renderer
- Enable `nodeIntegration` in renderer
- Disable `contextIsolation`

## 📦 Adding New IPC Handlers

### 1. Add Handler in main.js

```javascript
ipcMain.handle('my-custom-handler', async (event, arg) => {
  // Do something
  return result;
});
```

### 2. Expose in preload.js

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  myCustomFunction: (arg) => ipcRenderer.invoke('my-custom-handler', arg),
});
```

### 3. Update TypeScript Definitions (electron.d.ts)

```typescript
export interface ElectronAPI {
  myCustomFunction: (arg: string) => Promise<any>;
}
```

### 4. Use in React

```tsx
const result = await window.electronAPI?.myCustomFunction('test');
```

## 🚢 Deployment

### Web Deployment (Cloudflare Pages)

```bash
npm run build
# Deploy dist/ to Cloudflare Pages
```

### Desktop App Distribution

1. **Build installers**:
   ```bash
   npm run electron:build:win
   npm run electron:build:mac
   npm run electron:build:linux
   ```

2. **Upload to GitHub Releases**:
   - Create a new release
   - Upload files from `release/` directory
   - Provide download links on your website

3. **Auto-update setup** (optional):
   - Configure `electron-updater` in `main.js`
   - Host releases on GitHub
   - Enable automatic updates

## 🔧 Troubleshooting

### Electron window is blank

- Check if Vite dev server is running on port 5173
- Check console for CORS errors
- Verify `base` path in `vite.config.ts`

### Build fails

- Ensure all dependencies are installed
- Check `electron/main.js` path in `package.json`
- Verify icons exist in `build/` directory

### Hot reload not working

- Restart with `npm run electron:dev`
- Check if port 5173 is available
- Verify `wait-on` is working correctly

### Production app won't load

- Ensure you built with `ELECTRON=true` flag
- Check `base: './'` in vite config for Electron builds
- Verify `dist/index.html` exists

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [Vite Documentation](https://vitejs.dev/)
- [Security Best Practices](https://www.electronjs.org/docs/tutorial/security)
