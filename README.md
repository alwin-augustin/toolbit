# DevToolBox

A modern, comprehensive collection of developer utilities for everyday tasks. Built with React, TypeScript, and Tailwind CSS.

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
cd DevToolBox

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Type checking
npm run check

# Linting
npm run lint
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
DevToolBox/
├── client/
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
│   └── ...
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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
