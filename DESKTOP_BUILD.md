# Toolbit Desktop Application - Build Guide

This document provides instructions for building and distributing the Toolbit desktop application.

## Prerequisites

- Node.js 18+ and npm
- For macOS builds: macOS 10.13+ (can cross-compile from macOS)
- For Windows builds: Windows 10+ (can cross-compile from macOS)
- For Linux builds: Ubuntu 18.04+ or equivalent (can cross-compile from macOS)

**Note**: Cross-platform builds work from macOS without additional tools!

## Quick Start

### Development Mode

Run the app in development mode with hot reload:

```bash
npm run desktop:dev
```

### Building for Distribution

Build for your current platform:

```bash
npm run desktop:build
```

Build for specific platforms:

```bash
# macOS (creates DMG)
npm run desktop:build:mac

# macOS Universal (Intel + Apple Silicon)
npm run desktop:build:mac:universal

# Windows (creates installer)
npm run desktop:build:win

# Linux (creates AppImage and DEB)
npm run desktop:build:linux
```

### Clean Build

Remove previous build artifacts:

```bash
npm run desktop:clean
```

## macOS Distribution

### About the "Damaged App" Error

The "damaged and can't be opened" error on macOS occurs when:
1. The app is not properly code-signed
2. Gatekeeper doesn't recognize the app signature

### Development Builds (No Apple Developer Account)

Our build configuration now supports **development distribution** without an Apple Developer account:

- **`hardenedRuntime: true`**: Enables security features
- **`gatekeeperAssess: false`**: Skips Gatekeeper during build
- **`CSC_IDENTITY_AUTO_DISCOVERY=false`**: Builds without code signing certificate
- **Entitlements**: Proper entitlements are configured for runtime permissions

**Users installing the app** will need to:
1. Right-click the app
2. Select "Open"
3. Click "Open" in the security dialog
4. The app will then be trusted

### Production Distribution (With Apple Developer Account)

For **production distribution** through the Mac App Store or direct download:

1. **Get an Apple Developer Account** ($99/year)

2. **Install your code signing certificate** in Keychain Access

3. **Set environment variables** for notarization:
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_ID_PASSWORD="app-specific-password"
   export APPLE_TEAM_ID="YOUR_TEAM_ID"
   ```

4. **Build without CSC_IDENTITY_AUTO_DISCOVERY=false**:
   ```bash
   ELECTRON=true vite build && electron-builder --mac
   ```

5. The app will be automatically:
   - Code signed with your certificate
   - Notarized by Apple
   - Trusted by Gatekeeper

### Understanding Entitlements

The app uses two entitlement files in the `build/` directory:

- **`entitlements.mac.plist`**: Main app entitlements
  - JIT compilation for JavaScript
  - Network access
  - File system access

- **`entitlements.mac.inherit.plist`**: Child process entitlements
  - Inherited by helper processes
  - Required for Electron's multi-process architecture

## Windows Distribution

Windows builds create an NSIS installer with:
- User-selectable installation directory
- Desktop shortcut option
- Start menu shortcut
- Uninstaller

The app is **not code-signed** by default. For production:
1. Get a code signing certificate
2. Set `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables
3. Rebuild the app

## Linux Distribution

Linux builds create:
- **AppImage**: Portable, run-anywhere format
- **DEB**: Debian/Ubuntu package

Both formats work without additional configuration.

## Build Configuration

### File Structure

```
build/
├── icon.icns              # macOS icon
├── icon.ico               # Windows icon
├── icon.png               # Linux icon
├── entitlements.mac.plist # macOS entitlements
└── entitlements.mac.inherit.plist # macOS child process entitlements

scripts/
└── notarize.js            # Notarization script (optional)

electron/
├── main.js                # Main process
├── preload.js             # Preload script
└── electron.d.ts          # TypeScript definitions
```

### Customization

Edit `package.json` under the `"build"` key to customize:
- App ID and name
- Icons
- Build targets
- Installer options
- File associations
- Protocol handlers

## Performance Optimizations

The desktop build includes:

1. **Vite Optimizations**:
   - Terser minification
   - Console removal in production
   - Inline dynamic imports for Electron
   - Optimized chunk size

2. **Electron Optimizations**:
   - Content Security Policy
   - Hardware acceleration
   - Background throttling disabled
   - Spellcheck disabled
   - Session security

3. **React Optimizations**:
   - Lazy loading for all routes
   - Error boundaries
   - Code splitting (web only)
   - Suspense boundaries

4. **Build Optimizations**:
   - Maximum compression
   - asar packaging
   - Unused file exclusion
   - Native module unpacking

## Security Features

- **Context Isolation**: Renderer process isolated from Node.js
- **Sandbox**: Renderer runs in a sandboxed environment
- **No Remote Module**: Direct access to main process disabled
- **CSP**: Content Security Policy headers
- **Navigation Protection**: External navigation prevented
- **Validated IPC**: All IPC channels whitelisted

## Troubleshooting

### macOS "Damaged" Error
- Ensure entitlements files exist in `build/`
- Try right-click → Open instead of double-click
- Check system Security & Privacy preferences

### Build Fails
- Clear build cache: `npm run desktop:clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

### App Won't Start
- Check console for errors
- Ensure `dist/` folder was created by Vite build
- Verify file paths in `electron/main.js`

### Large App Size
- Check if node_modules is included (should not be)
- Verify asar packaging is enabled
- Review included files in `package.json` build config

## Development Tips

1. **Use development mode** for faster iteration:
   ```bash
   npm run desktop:dev
   ```

2. **Check DevTools** for renderer process errors (Cmd/Ctrl+Shift+I)

3. **View main process logs** in the terminal where you ran the app

4. **Test builds locally** before distributing:
   ```bash
   npm run desktop:build:mac
   open release/mac-arm64/Toolbit.app
   ```

## Distribution Checklist

Before distributing your app:

- [ ] Test on a clean machine (not development machine)
- [ ] Verify all features work in production build
- [ ] Check app launches correctly
- [ ] Test installation and uninstallation
- [ ] Review app size (should be reasonable)
- [ ] Test on minimum supported OS version
- [ ] Verify auto-updates (if implemented)
- [ ] Check for console errors
- [ ] Test with fresh user data

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)

## Support

For issues specific to the desktop build:
1. Check the console/terminal for errors
2. Review this guide
3. Check electron-builder documentation
4. Open an issue with build logs
