# Toolbit

A modern, comprehensive collection of developer utilities for everyday tasks. Available as both a web application (with PWA support) and cross-platform desktop app. Built with React 19, TypeScript, Vite, and Electron.

🔒 **Privacy First**: Your data never leaves your device — Toolbit runs completely locally, whether on the web or desktop.

## Features

### JSON Tools
- **JSON Formatter** - Format and validate JSON with syntax highlighting
- **JSON Schema Validator** - Validate JSON against schemas using AJV
- **CSV to JSON Converter** - Convert CSV files to JSON format

### Web Development
- **CSS Formatter/Minifier** - Format and minify CSS code
- **JavaScript Minifier** - Minify JavaScript code using Terser
- **HTML Escape** - Escape and unescape HTML entities
- **URL Encoder** - Encode and decode URL components
- **Markdown Previewer** - Live preview Markdown with syntax support

### Encoding & Security
- **Base64 Encoder** - Encode and decode Base64 strings
- **JWT Decoder** - Decode and inspect JWT tokens
- **Hash Generator** - Generate MD5, SHA-1, SHA-256, and SHA-512 hashes

### Text Utilities
- **Case Converter** - Convert text between camelCase, snake_case, PascalCase, and more
- **Word Counter** - Count words, characters, and sentences
- **Strip Whitespace** - Remove unnecessary whitespace from text
- **Diff Tool** - Compare text and see differences side-by-side

### Converters & Generators
- **Timestamp Converter** - Convert between timestamps and human-readable dates
- **Color Converter** - Convert between HEX, RGB, and HSL color formats
- **Unit Converter** - Convert between different units of measurement
- **UUID Generator** - Generate UUIDs (v4)

### Utilities
- **Date Calculator** - Calculate date differences and add/subtract time
- **Cron Expression Parser** - Parse and understand cron expressions with human-readable output
- **HTTP Status Code Reference** - Quick reference for HTTP status codes

## Tech Stack

### Core Framework
- **React 19** - UI framework with concurrent features
- **TypeScript 5.7** - Type safety and developer experience
- **Vite 6** - Lightning-fast build tool and dev server
- **Electron 38** - Cross-platform desktop app framework

### Styling & UI
- **Tailwind CSS 3** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled component primitives
- **Lucide React** - Icon library
- **Tailwind Animate** - Animation utilities

### State & Routing
- **Zustand** - Lightweight state management
- **React Query** - Data fetching, caching, and synchronization
- **Wouter** - Minimal routing solution (~1.2KB)

### Key Libraries
- **Prism.js** - Syntax highlighting
- **AJV** - JSON schema validation
- **date-fns** - Date manipulation
- **Marked** - Markdown parsing
- **DOMPurify** - XSS sanitization
- **Terser** - JavaScript minification
- **Papa Parse** - CSV parsing
- **js-yaml** - YAML parsing
- **convert-units** - Unit conversion
- **cron-parser** - Cron expression parsing

### Development & Testing
- **Vitest** - Unit testing framework
- **Testing Library** - Component testing utilities
- **ESLint** - Code linting
- **PostCSS** - CSS processing

### PWA Support
- **vite-plugin-pwa** - Progressive Web App support with Workbox
- **Service Worker** - Offline functionality and asset caching

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/alwin-augustin/toolbit.git

# Navigate to project directory
cd toolbit

# Install dependencies
npm install
```

### Development

#### Web App

```bash
# Start web development server (port 5173)
npm run dev              # or npm run web:dev

# Build web app for production
npm run web:build

# Preview production build locally
npm run web:preview
```

The web app includes PWA support with offline functionality.

#### Desktop App

```bash
# Start Electron app in development mode with hot reload
npm run desktop:dev

# Build desktop app for your current platform
npm run desktop:build

# Build for specific platforms
npm run desktop:build:mac              # macOS DMG
npm run desktop:build:mac:universal    # Universal macOS binary (Intel + Apple Silicon)
npm run desktop:build:win              # Windows NSIS installer
npm run desktop:build:linux            # Linux AppImage + DEB

# Clean build artifacts
npm run desktop:clean
```

For detailed desktop build instructions, see [DESKTOP_BUILD.md](./DESKTOP_BUILD.md).

#### Testing & Validation

```bash
# Type checking with TypeScript
npm run check

# Linting with ESLint
npm run lint

# Run tests in watch mode
npm run test

# Run tests with Vitest UI
npm run test:ui

# Generate test coverage report
npm run test:coverage
```

## Project Structure

```
toolbit/
├── src/                        # Application source code
│   ├── components/
│   │   ├── tools/              # Individual tool components by category
│   │   ├── ui/                 # Reusable Radix UI components
│   │   ├── AppSidebar.tsx      # Main navigation sidebar
│   │   ├── Footer.tsx          # App footer with links
│   │   ├── ThemeToggle.tsx     # Light/dark mode toggle
│   │   └── ErrorBoundary.tsx   # Error boundary component
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-sidebar.ts      # Sidebar state management
│   │   ├── use-theme.ts        # Theme state management
│   │   └── use-electron.ts     # Electron detection hook
│   ├── lib/                    # Utilities and helpers
│   │   ├── queryClient.ts      # React Query configuration
│   │   └── utils.ts            # Utility functions
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   ├── router.tsx              # Route definitions
│   └── index.css               # Global styles
├── electron/                   # Electron-specific files
│   ├── main.js                 # Main process (Node.js environment)
│   ├── preload.js              # Preload script (IPC bridge)
│   └── electron.d.ts           # TypeScript definitions for Electron API
├── public/                     # Static assets & PWA icons
├── tests/                      # Test files organized by tool category
├── dist/                       # Build output (web & desktop)
├── release/                    # Desktop installers and packages
├── build/                      # Desktop app icons and entitlements
├── .github/
│   └── workflows/              # CI/CD workflows
│       ├── release-desktop.yml # Desktop app releases
│       └── validate-web.yml    # Web build validation
├── index.html                  # Entry HTML
├── vite.config.ts              # Vite configuration (dual-target)
├── vitest.config.ts            # Vitest configuration
├── package.json
├── README.md
└── DESKTOP_BUILD.md            # Desktop build documentation
```

## Key Features

### 🌐 PWA Support (Web)
- **Offline Functionality** - Works without internet connection
- **Installable** - Add to home screen on mobile and desktop
- **Service Worker** - Auto-caching with Workbox
- **Fast Loading** - Precached assets for instant startup

### 🎨 User Experience
- **Responsive Design** - Mobile-first approach with adaptive layouts
- **Theme Support** - Light and dark mode with persistent preference
- **Smooth Animations** - Tailwind Animate for polished interactions
- **Touch-Friendly** - Optimized for both mouse and touch input

### ♿ Accessibility
- **Keyboard Navigation** - Full keyboard support (ESC to close sidebar)
- **Screen Reader Support** - ARIA labels and semantic HTML
- **Skip to Content** - Quick navigation for assistive technologies
- **High Contrast** - Readable in both light and dark modes

### ⚡ Performance
- **Lazy Loading** - Route-based code splitting with React Suspense
- **Optimized Bundles** - Terser minification with tree-shaking
- **Fast Dev Server** - Vite's lightning-fast HMR
- **Lightweight Routing** - Wouter (~1.2KB) instead of React Router

### 🔒 Privacy & Security
- **100% Local Processing** - No data sent to servers
- **XSS Protection** - DOMPurify sanitization for HTML content
- **Context Isolation** - Electron renderer sandboxed from Node.js
- **No Analytics** - Zero tracking or telemetry

### 🖥️ Cross-Platform Desktop
- **macOS** - Universal binaries (Intel + Apple Silicon)
- **Windows** - x64 and ARM64 support
- **Linux** - AppImage (portable) and DEB packages

## Deployment

### Web App (Cloudflare Pages)

The web app is automatically deployed to Cloudflare Pages on push to the main branch.

**Configuration:**
- Build command: `npm run web:build`
- Output directory: `dist/`
- Framework: Vite
- Node version: 18+

The web build includes full PWA support with service worker generation via `vite-plugin-pwa`.

### Desktop App (GitHub Releases)

Desktop apps are automatically built via GitHub Actions and released to GitHub Releases.

**Trigger Events:**
- **Tag push** (e.g., `v1.0.0`) → Stable release
- **Push to main/master** → Pre-release (draft)

**Build Outputs:**
- **macOS**: `Toolbit-{version}-{arch}.dmg` (x64, arm64, universal)
- **Windows**: `Toolbit-{version}-{arch}.exe` (x64, arm64)
- **Linux**: `Toolbit-{version}-{arch}.AppImage` and `.deb` (x64, arm64)

For manual desktop builds and code signing, see [DESKTOP_BUILD.md](./DESKTOP_BUILD.md).

## Architecture Highlights

### Dual-Target Build System

Toolbit uses a sophisticated Vite configuration that builds for both web and desktop from a single codebase:

- **Web builds**: Standard Vite build with absolute paths (`/`) for browser routing
- **Desktop builds**: Uses `ELECTRON=true` environment variable, builds with relative paths (`./`) for `file://` protocol

The configuration automatically adjusts:
- Base path for asset loading
- Target compilation (esnext for Electron, es2015 for web)
- Code splitting behavior (disabled for Electron to prevent React hooks issues)

### Electron Security Model

- **Context Isolation**: Enabled - renderer process isolated from Node.js
- **Sandbox**: Enabled for all renderer processes
- **nodeIntegration**: Disabled
- **IPC Communication**: Secure bridge via preload script using `contextBridge`

Never expose `ipcRenderer` directly. All Electron APIs are exposed through `window.electronAPI`.

### State Management Architecture

- **Zustand** for client state (sidebar, theme)
- **React Query** for server state and caching
- **LocalStorage** for persistence
- Minimal re-renders via atomic state slices

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

**Before submitting:**
1. Run `npm run check` to ensure no TypeScript errors
2. Run `npm run lint` to check code style
3. Run `npm test` to ensure tests pass
4. Test both web and desktop builds if making platform-specific changes

## Links

- 🐛 [Report Issues](https://github.com/alwin-augustin/toolbit/issues)
- 💬 [Request Features](https://github.com/alwin-augustin/toolbit/issues/new)
- 📖 [Documentation](./DESKTOP_BUILD.md)

## License

MIT License - see [LICENSE](./LICENSE) for details

---

**Made with ❤️ by developers, for developers**
