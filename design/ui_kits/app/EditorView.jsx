/* Editor view — tab strip + input/output split for the JSON Formatter,
   with live validation, syntax-tinted output with line numbers, and a
   piping strip. Reports status up via onStatus. */
(function () {
  const { Button, IconButton, Badge, Textarea, Tooltip } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;

  const SAMPLE = `{"workspace":"API Debug","tools":["JSON","JWT","Base64"],"density":"comfortable","localFirst":true}`;

  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function tint(code) {
    let out = esc(code);
    out = out.replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span style="color:hsl(var(--code-key))">$1</span><span style="color:hsl(var(--code-punc))">$2</span>');
    out = out.replace(/(:\s*)("(?:[^"\\]|\\.)*")/g, '$1<span style="color:hsl(var(--code-string))">$2</span>');
    out = out.replace(/\b(-?\d+\.?\d*)\b/g, '<span style="color:hsl(var(--code-number))">$1</span>');
    out = out.replace(/\b(true|false|null)\b/g, '<span style="color:hsl(var(--code-keyword))">$1</span>');
    return out;
  }

  function PanelHeader({ title, badge, action }) {
    return (
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 36, padding: "0 10px", flexShrink: 0,
        borderBottom: "1px solid hsl(var(--border-faint))", background: "hsl(var(--surface-1))",
        borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "hsl(var(--text-strong))" }}>{title}</span>
          {badge}
        </div>
        {action}
      </header>
    );
  }

  function TabStrip({ tabs, activeTab, onTab, onClose, onAdd }) {
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, padding: "6px 12px 0", borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--surface-0))", flexShrink: 0 }}>
        {tabs.map((t) => {
          const active = t.id === activeTab;
          return (
            <button key={t.id} onClick={() => onTab(t.id)} style={{
              display: "inline-flex", alignItems: "center", gap: 7, height: 32, padding: "0 10px",
              background: active ? "hsl(var(--surface-2))" : "transparent",
              color: active ? "hsl(var(--text-strong))" : "hsl(var(--text-muted))",
              border: "1px solid " + (active ? "hsl(var(--border))" : "transparent"),
              borderBottom: "none",
              borderTopLeftRadius: "var(--radius-md)", borderTopRightRadius: "var(--radius-md)",
              fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)",
              cursor: "pointer", position: "relative",
            }}>
              {active && <span style={{ position: "absolute", top: -1, left: 6, right: 6, height: 2, borderRadius: 2, background: "hsl(var(--primary))" }} />}
              {t.label}
              <span onClick={(e) => { e.stopPropagation(); onClose(t.id); }} style={{ color: "hsl(var(--text-faint))", display: "inline-flex", lineHeight: 0 }}><Icon name="x" size={11} /></span>
            </button>
          );
        })}
        <button onClick={onAdd} title="Open another tool" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, marginBottom: 2,
          background: "transparent", border: "none", borderRadius: "var(--radius-md)",
          color: "hsl(var(--text-muted))", cursor: "pointer", fontSize: 15, fontFamily: "var(--font-sans)",
        }}>+</button>
      </div>
    );
  }

  function EditorView({ onStatus }) {
    const [input, setInput] = React.useState(JSON.stringify(JSON.parse(SAMPLE), null, 2));
    const [output, setOutput] = React.useState("");
    const [valid, setValid] = React.useState(true);

    React.useEffect(() => {
      if (!input.trim()) { setOutput(""); setValid(null); onStatus?.({ valid: null, bytes: 0 }); return; }
      try {
        const obj = JSON.parse(input);
        const sorted = window.TB_OPTIONS?.sortKeys ? sortDeep(obj) : obj;
        const out = JSON.stringify(sorted, null, window.TB_OPTIONS?.indent ?? 2);
        setOutput(out); setValid(true);
        onStatus?.({ valid: true, bytes: new Blob([input]).size });
      } catch (e) {
        setOutput(e.message); setValid(false);
        onStatus?.({ valid: false, bytes: new Blob([input]).size });
      }
    }, [input]);

    const lines = valid ? output.split("\n") : [];

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Split editor */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 12, minHeight: 0 }}>
          {/* Input */}
          <section style={{ display: "flex", flexDirection: "column", minHeight: 0, border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-lg)", background: "hsl(var(--surface-0))", overflow: "hidden" }}>
            <PanelHeader title="Input" badge={<Badge tone="primary">detected JSON</Badge>}
              action={<Button variant="ghost" size="sm" onClick={() => setInput(JSON.stringify(JSON.parse(SAMPLE), null, 2))}>Load sample</Button>} />
            <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
              placeholder={'Paste anything — JSON, JWT, Base64, cron, SQL — ⌘V and Toolbit detects the tool.'}
              style={{
                flex: 1, width: "100%", resize: "none", border: "none", outline: "none",
                background: "transparent", color: "hsl(var(--text-strong))",
                padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)",
                lineHeight: "var(--leading-relaxed)",
              }} />
          </section>

          {/* Output */}
          <section style={{ display: "flex", flexDirection: "column", minHeight: 0, border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-lg)", background: "hsl(var(--surface-0))", overflow: "hidden" }}>
            <PanelHeader title="Output"
              badge={valid === null ? null : <Badge tone={valid ? "success" : "danger"}>{valid ? "✓ valid object" : "✕ parse error"}</Badge>}
              action={<Tooltip label="Copy output" side="left"><IconButton size="sm" title="Copy"><Icon name="copy" size={14} /></IconButton></Tooltip>} />
            <div style={{ flex: 1, overflow: "auto", padding: "10px 0" }}>
              {valid === false ? (
                <div style={{ padding: "0 12px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "hsl(var(--danger))" }}>{output}</div>
              ) : (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>
                  {lines.map((ln, i) => (
                    <div key={i} style={{ display: "flex" }}>
                      <span style={{ width: 42, flexShrink: 0, textAlign: "right", paddingRight: 14, color: "hsl(var(--text-faint))", userSelect: "none", fontSize: "var(--text-xs)", lineHeight: "inherit" }}>{i + 1}</span>
                      <span style={{ whiteSpace: "pre", color: "hsl(var(--text-body))" }} dangerouslySetInnerHTML={{ __html: tint(ln) || "&nbsp;" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Piping strip — visible because a pipe exists in this workspace */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px 12px", flexShrink: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))", fontWeight: "var(--weight-medium)" }}>
            <Icon name="pipe" size={14} /> Pipeline
          </span>
          <PipeNode active>JSON Formatter</PipeNode>
          <span style={{ color: "hsl(var(--text-faint))" }}>→</span>
          <PipeNode>Base64 Encoder</PipeNode>
          <span style={{ color: "hsl(var(--text-faint))" }}>→</span>
          <PipeNode>Snippet</PipeNode>
          <Badge tone="warning" variant="outline" style={{ marginLeft: "auto" }}>reversible</Badge>
        </div>
      </div>
    );
  }

  function PipeNode({ children, active }) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", height: 26, padding: "0 10px",
        borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)",
        fontFamily: "var(--font-sans)",
        background: active ? "hsl(var(--primary-soft))" : "hsl(var(--surface-2))",
        color: active ? "hsl(var(--primary))" : "hsl(var(--text-body))",
        border: `1px solid ${active ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))"}`,
      }}>{children}</span>
    );
  }

  function sortDeep(v) {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === "object") {
      return Object.keys(v).sort().reduce((acc, k) => { acc[k] = sortDeep(v[k]); return acc; }, {});
    }
    return v;
  }

  window.TBEditorView = EditorView;
  window.TBTabStrip = TabStrip;
})();
