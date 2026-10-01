# ADR 003: Explicit workspace payload storage

Accepted, 1 October 2026.

Open documents preserve working data in memory during a session. Automatic shell persistence stores document identity, tool version, options and layout, excluding payloads and closed-document data. Refresh restores shell metadata, not unsaved input. Users must select Include data when saving a named workspace; secret-classified documents always exclude data. Recipes contain ordered transformation settings only, never input/output.

Workspace schema 1 validates the complete import before saving. Imports are capped at 2 MB and 100 documents; recipes at 100 KB and 50 steps. Unsupported future formats and unknown tools fail with recovery guidance and leave the original file intact. The legacy tools-array format migrates with repeated tools preserved. Browser storage is unencrypted and exports can contain user data when explicitly selected.
