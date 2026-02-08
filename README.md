# Toolbit

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Local‑First](https://img.shields.io/badge/local--first-yes-0ea5e9.svg)](https://toolbit.app)
[![Privacy](https://img.shields.io/badge/privacy-no%20tracking-22c55e.svg)](https://toolbit.app/privacy)
[![PWA](https://img.shields.io/badge/pwa-ready-6366f1.svg)](https://toolbit.app)

Local‑first developer tools for JSON, Base64, JWT, YAML, XML, SQL, and more. Toolbit runs entirely in your browser or desktop app with zero tracking, zero analytics, and no server‑side processing.

**Why Toolbit**
- 100% local processing and offline‑friendly
- Web + desktop builds from one codebase
- Fast, keyboard‑first UX for daily dev workflows
- Privacy‑focused: no network calls, no cookies, no telemetry

## Highlights
- Smart paste: detect input type and jump to the right tool
- Tool chaining: send output to the next tool and save workflows
- History, snippets, and workspaces stored locally
- PWA installable on desktop and mobile

## Tool Categories
- Format & Validate: JSON, YAML, XML, SQL, GraphQL, JSON Schema
- Encode & Decode: Base64, URL, HTML, JWT, Certificates, Protobuf
- Generate: UUID, Passwords, Hashes, Fake Data, QR Codes
- Transform: CSV↔JSON, Case Converter, Timestamp, Color, Unit
- Analyze: Regex, Diff, Git Diff, Cron, HTTP Status Codes
- Build: API Request Builder, WebSocket Tester, Docker Builder
- Text & Docs: Markdown, PDF tools, Whitespace, Word Counter

## Demo
- Web app: [toolbit.app](https://toolbit.app)
- Desktop releases: [GitHub Releases](https://github.com/alwin-augustin/toolbit/releases)

## Screenshots
![Toolbit App Home](https://toolbit.app/screenshots/app-home.png)
![Toolbit Tool View](https://toolbit.app/screenshots/tool-view.png)

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install
```bash
git clone https://github.com/alwin-augustin/toolbit.git
cd toolbit
npm install
```

### Web (local dev)
```bash
npm run web:dev
```

### Web (production build)
```bash
npm run web:build
npm run preview
```

### Desktop (local dev)
```bash
npm run desktop:dev
```

### Desktop (build)
```bash
npm run desktop:build
npm run desktop:build:mac
npm run desktop:build:win
npm run desktop:build:linux
```

## Quality Checks
```bash
npm run check
npm run lint
npm run test
```

## Privacy
Toolbit is privacy‑first by design.
- No data leaves your device
- No cookies
- No analytics or telemetry
- LocalStorage and IndexedDB are used only for local preferences and history

See `/privacy` for the full policy.

## Architecture
- React 19 + TypeScript + Vite
- Electron for desktop packaging
- Zustand for client state
- PWA via `vite-plugin-pwa`

## Contributing
Pull requests are welcome.
- Run `npm run check` and `npm run lint`
- Add or update tests where appropriate
- Keep changes scoped and documented

## Security
Please report security issues via GitHub issues or email: alwinaugustin@gmail.com

## License
MIT — see `LICENSE`.
