# Runtime, browser and storage baseline

Runtime: Node 24.21.0 LTS; engines >=24 <25. CI and Cloudflare match `.nvmrc`. Installation uses `npm ci`. Vite’s widely available baseline and Tailwind 4 require modern browsers (at least Chrome/Edge 111, Firefox 128 and Safari 16.4). Toolbit targets maintained versions below.

## Browser support and verification

| Surface              | Supported target            | Installation                | Verification                                              |
| -------------------- | --------------------------- | --------------------------- | --------------------------------------------------------- |
| Chrome/Edge computer | Current and previous stable | Browser Install app         | Chromium production smoke automated                       |
| Firefox computer     | Current and previous stable | Browser app                 | Firefox engine automated; real platform check pending     |
| Safari macOS         | Current and previous major  | Add to Dock where available | Firefox engine automated; real platform check pending     |
| Chrome Android       | Current stable              | Install app                 | Narrow Chromium layout covered; real-device check pending |
| Safari iOS/iPadOS    | Current and previous major  | Share → Add to Home Screen  | Real-device check pending                                 |

These are support targets, not a claim that every platform has passed. PWA install/update/uninstall and screen-reader acceptance must be recorded per real platform. Native distribution is retired.

## Storage inventory

| Location/key                                     | Legacy format                                          | Current handling                                                            |
| ------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| IndexedDB toolbit-history/history                | DB v1, auto-ID, toolId/input/output/timestamp/metadata | Same DB; centrally guarded sensitive writes; explicit clear/retention       |
| IndexedDB toolbit-workspaces/workspaces          | DB v1, workspace.tools with serialized state           | Same DB, workspace schema1 document migration and validation                |
| IndexedDB toolbit-snippets/snippets              | DB v1 name/content/language                            | Explicit user saves; unencrypted; never analytics payload                   |
| toolbit-workspace                                | Zustand v0 tabs by tool ID                             | Zustand v1 tabs by document ID, payload excluded                            |
| toolbit-pipeline                                 | Zustand v2 ordered tool metadata                       | No transfer payload persisted                                               |
| toolbit-v2-*-options                             | Legacy global JSON/Base64/URL/JWT/Cron/UUID settings   | Per-document options; JSON legacy setting adapter ignores collapse mutation |
| toolbit:autosave:<toolId>                        | JSON state and timestamp                               | Legacy normal tools; sensitive writes blocked                               |
| toolbit-totp-accounts                            | TOTP accounts with seeds                               | New saves session-only; explicit legacy recovery/removal required           |
| toolbit-api-requests                             | Saved requests with headers/body                       | New saves session-only; explicit legacy recovery/removal required           |
| toolbit:analytics-anonymous-id                   | Device UUID                                            | Pseudonymous identity; removed on analytics opt-out                         |
| toolbit:favorites, toolbit:recent                | Tool-ID arrays                                         | Safe storage access, no payload                                             |
| toolbit-theme, sidebar-state, sidebar preference | Zustand/UI settings                                    | Safe storage access                                                         |
| toolbit-preferences                              | New Zustand preferences                                | Analytics/history defaults and retention days                               |
| toolbit-recipes-v1                               | New recipe schema1 array                               | Settings-only, validated serialization                                      |

Never dump actual stored payloads or credentials during an inventory. Existing data remains recoverable. Browser storage is not encrypted.
