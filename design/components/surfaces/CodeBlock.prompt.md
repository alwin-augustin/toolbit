Read-only code/data display with a header bar (filename or language). Monospace body with light JSON-ish tinting.

```jsx
<CodeBlock filename="response.json" code={'{\n  "ok": true\n}'} />
<CodeBlock lang="bash" highlight={false} code="npm run web:dev" />
```

For real editing surfaces use `Textarea`. This is for showcasing output/snippets. The tinting is a naive regex, not a parser — set `highlight={false}` for non-JSON.
