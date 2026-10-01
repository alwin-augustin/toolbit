# Performance and release checks

Recorded 1 October 2026. Detailed reproducible pure-transform timings: `PERFORMANCE_BASELINE.json`; run `npm run benchmark` on Node24.19.0. Medians of three repetitions on the development computer; these are CPU baselines, not browser interaction measurements.

| Input | JSON | UTF-8 Base64 | SHA-256 |
|---|---:|---:|---:|
| 100 KB | 0.66 ms | 1.66 ms | 0.10 ms |
| 1 MB | 2.40 ms | 15.81 ms | 0.57 ms |
| 10 MB | 24.36 ms | 175.07 ms | 6.46 ms |

The shared execution adapter sends inputs >=100 KB to module workers, caps input at10 MB, stops after10 seconds, cancels on document/option changes and suppresses stale results. Base64 assembles bounded byte chunks rather than a whole extra numeric array. Output previews above100 KB display an explicit limited-preview message, while copy/pipe/history use complete output. Large JSON editors disable syntax parsing/wrapping to reduce presentation cost. Regex runs in an interruptible isolated worker: pattern2 KB, text1 MB, 10,000 matches, one-second timeout. A worker failure yields an error state; it never silently falls back to an unbounded regex on the main thread.

Target interaction budget: ordinary actions remain below100 ms of main-thread blocking, with long work visibly pending/cancellable. Headless Chromium paste/worker/editor measurements are in BROWSER_PERFORMANCE_BASELINE.json: 100 KB had no >=50 ms long task, 1 MB had none, and 10 MB had one126 ms task. Before bounded previews, 10 MB caused a1448 ms task. The100 ms target passes through1 MB; the10 MB boundary remains a documented126 ms limitation on this machine, not a claim of universal responsiveness. Large input previews are read-only and bounded; Paste replaces full input and Clear restores editing. Processing has an explicit cancel control. Clipboard, storage-denied and narrow-layout browser journeys are automated. Real PWA install/uninstall, Safari/Firefox and screen-reader verification remain platform tasks.

PWA generation runs after SEO generation, precaching final static pages and clean tool aliases. Offline direct Base64 navigation and transformation passed. Service-worker updates wait for user-triggered activation and reload after controllerchange; the prompt asks users to save work. Cache/update matrix needs verification against two deployed revisions.

Release-gate local simulation: a temporary intentionally failing Vitest test returned exit1 and was removed. A fresh npm ci completed on Node24.19.0. Nonbreaking dependency patches removed all production advisories (npm audit --omit=dev: zero). Four moderate development-only advisories remain in the Vitest3 dependency family; upgrading the test runner is separately scoped.
