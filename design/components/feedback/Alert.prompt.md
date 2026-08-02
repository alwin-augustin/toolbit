Inline alert/callout — large-file warnings, validation errors, info notes.

```jsx
<Alert tone="warning" icon={<AlertTriangleIcon />}>
  Large file (2.4MB). Tree view disabled for performance.
</Alert>
<Alert tone="danger" title="Invalid JSON">Unexpected token at line 4.</Alert>
```

Tones: `info`, `success`, `warning`, `danger`. Soft tinted bg + matching border.
