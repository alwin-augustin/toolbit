# ADR 004: Document, workspace and recipe

Accepted, 1 October 2026.

A document is one working instance of a tool, with an independent ID, input and settings. Multiple instances of the same tool are allowed. A workspace is a saved set of documents plus active-document and layout preferences. A recipe is an ordered executable set of versioned transformations and options. Repeated tools in a recipe are meaningful and must not be deduplicated.

Pipeline denotes the temporary hand-off sequence between tools. Smart Paste is deterministic detection. Product UI avoids implementation-stage labels. Browser installation is called PWA installation; there is no native desktop distribution.
