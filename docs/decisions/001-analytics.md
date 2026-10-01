# ADR 001: Minimized optional analytics

Accepted, 1 October 2026. Browser/PWA only.

Product analytics defaults enabled, with a prominent Privacy and storage preference. All collection goes through the typed event adapter. Autocapture, recording, exception bodies, request content, referrers and raw URLs are disabled. Tool input/output, names and credentials never enter events. The browser device identifier is pseudonymous, not anonymous or a user account. Opt-out stops capturing and removes the saved identity; opting back in creates a new identity. Storage denial uses a random session identity. Missing configuration and network failures never prevent tools from working. Cloudflare's separately injected analytics beacon is disabled so collection follows this preference.

PostHog project: 635948, US region. Owner: repository/project owner. No AI instrumentation exists. A future AI feature needs a new explicit privacy decision.
