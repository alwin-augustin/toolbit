# ADR 002: Local history and sensitive tools

Accepted, 1 October 2026.

Normal tool history defaults enabled, with a global preference and 30-day retention choice. Users explicitly apply retention to existing entries or clear history; migration does not silently erase prior data. New writes consult the tool policy centrally. Password, TOTP, JWT, certificate, HTTP, WebSocket, Wi-Fi QR and Docker environment tools are excluded because their fields can contain credentials. They also cannot create payload-bearing share links or include payloads in saved workspaces.

History is unencrypted IndexedDB. At most 200 records total and 20 per tool are retained. Records preserve complete input/output; storage errors leave the transformation successful. Existing credential collections remain available for deliberate recovery and removal until the user clears them. Clipboard and endpoint actions occur only on request.
