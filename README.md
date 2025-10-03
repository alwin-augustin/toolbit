# Toolbit

A modern, comprehensive collection of developer utilities for everyday tasks. Available as both a web application and desktop app. Built with React, TypeScript, and Tailwind CSS.

## Features

### Text & Format Tools
- **JSON Formatter** - Format and validate JSON with syntax highlighting
- **YAML Formatter** - Format and validate YAML files
- **Case Converter** - Convert text between camelCase, snake_case, PascalCase, and more
- **Word Counter** - Count words, characters, and sentences
- **Strip Whitespace** - Remove unnecessary whitespace from text
- **CSS Formatter/Minifier** - Format and minify CSS code
- **JavaScript/JSON Minifier** - Minify JavaScript and JSON

### Encoding & Decoding
- **Base64 Encoder** - Encode and decode Base64 strings
- **URL Encoder** - Encode and decode URL components
- **HTML Escape** - Escape and unescape HTML entities
- **JWT Decoder** - Decode and inspect JWT tokens

### Preview & Validation
- **JSON Schema Validator** - Validate JSON against schemas
- **Markdown Previewer** - Live preview Markdown with syntax support

### Generators & Converters
- **UUID Generator** - Generate UUIDs (v4)
- **Hash Generator** - Generate MD5, SHA-1, SHA-256, and SHA-512 hashes
- **Timestamp Converter** - Convert between timestamps and human-readable dates
- **Date Calculator** - Calculate date differences and add/subtract time
- **Color Converter** - Convert between HEX, RGB, and HSL color formats
- **Diff Tool** - Compare text and see differences
- **CSV to JSON Converter** - Convert CSV files to JSON format
- **JSON to Python Converter** - Convert JSON to Python dictionaries
- **Cron Expression Parser** - Parse and understand cron expressions
- **Unit Converter** - Convert between different units of measurement
- **HTTP Status Code Reference** - Quick reference for HTTP status codes

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Electron** - Desktop app framework
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **Wouter** - Lightweight routing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd toolbit

# Install dependencies
npm install
```

### Development

#### Web App

```bash
# Start web development server
npm run web:dev

# Build web app for production
npm run web:build

# Preview web production build
npm run web:preview
```

#### Desktop App

```bash
# Start desktop app in development mode
npm run desktop:dev

# Build desktop app for current platform
npm run desktop:build

# Build for specific platforms
npm run desktop:build:mac    # macOS
npm run desktop:build:win    # Windows
npm run desktop:build:linux  # Linux
```

#### Testing & Validation

```bash
# Type checking
npm run check

# Linting
npm run lint

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
toolbit/
├── src/                        # React application source
│   ├── src/
│   │   ├── components/
│   │   │   ├── tools/          # Individual tool components
│   │   │   ├── ui/             # Reusable UI components
│   │   │   ├── AppSidebar.tsx
│   │   │   └── ...
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities and helpers
│   │   ├── styles/             # Global styles
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── index.html
│   └── public/
├── electron/                   # Electron-specific files
│   ├── main.js                 # Main process
│   ├── preload.js              # Preload script
│   └── electron.d.ts           # TypeScript definitions
├── dist/                       # Build output (web & desktop)
├── release/                    # Desktop installers
├── build/                      # Desktop app icons
├── .github/
│   └── workflows/              # CI/CD workflows
│       ├── release-desktop.yml # Desktop app releases
│       └── validate-web.yml    # Web build validation
├── package.json
└── README.md
```

## Features

### Responsive Design
- Mobile-first approach
- Collapsible sidebar on all screen sizes
- Touch-friendly interface

### Theme Support
- Light and dark mode
- Persistent theme preference
- Smooth theme transitions

### Accessibility
- Keyboard navigation (Escape to close sidebar)
- Screen reader support
- ARIA labels and semantic HTML
- Skip to main content link

### Performance
- Code splitting
- Optimized bundle size
- Lazy loading components

## Deployment

### Web App (Cloudflare Pages)

The web app is automatically deployed to Cloudflare Pages when changes are pushed to the main branch. The build command is `npm run web:build` and the output directory is `dist/`.

### Desktop App (GitHub Releases)

Desktop apps are automatically built and released to GitHub Releases when:
- Changes are pushed to the `main` or `master` branch (creates a pre-release)
- A version tag (e.g., `v1.0.0`) is created (creates a stable release)

The workflow builds installers for:
- **macOS**: `.dmg` disk image
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` and `.deb` packages

For more details on the desktop app, see [ELECTRON.md](./ELECTRON.md).

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
