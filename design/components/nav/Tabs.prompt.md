Tab control for switching views. `segment` = filled pill toggle (e.g. Text / Tree output view); `underline` = section tabs.

```jsx
<Tabs
  variant="segment"
  value={view}
  onChange={setView}
  items={[{value:"text",label:"Text"},{value:"tree",label:"Tree"}]}
/>
```

Controlled via `value` + `onChange`. Items may include an `icon`.
