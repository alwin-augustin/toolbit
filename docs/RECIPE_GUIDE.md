# Repeatable local transformations

Open Recipes in the workspace toolbar. Choose a template, inspect each step's settings, paste input and run. The panel shows each intermediate output. Stop cancels work; an error identifies the failing step. Save stores the settings locally. Export and import move the recipe settings between browsers without including the pasted input. Duplicate creates a new recipe; delete offers undo.

## Base64 → JSON → Base64

Use the template with `eyJvayI6dHJ1ZX0=`. The first step decodes UTF-8, the next formats JSON and the final step encodes the complete formatted result. The two Base64 steps have independent options.

## CSV cleanup → JSON validation

Paste `name,age` followed by a newline and `Ada,37`. Trailing whitespace is removed, CSV headers become object keys and the final step validates the resulting JSON. CSV values remain strings.

## Normalize text → SHA-256

Paste `  test  `. The trim step produces `test`; the hash step returns its SHA-256 digest. These templates process input locally and do not contact endpoints. Names and payloads are excluded from optional analytics.
