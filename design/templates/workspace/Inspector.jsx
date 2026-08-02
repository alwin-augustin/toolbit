/* Inspector — per-tool options, pipe targets, privacy note. Collapsible. */
(function () {
  const { Select, Checkbox, IconButton } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;

  function Inspector({ onClose, options, onOptions }) {
    return (
      <aside style={{
        width: "var(--inspector-width)", flexShrink: 0, height: "100%", overflowY: "auto",
        background: "hsl(var(--surface-1))", borderLeft: "1px solid hsl(var(--border))",
        padding: "0 16px 16px",
      }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "var(--header-height)" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase", color: "hsl(var(--text-faint))" }}>Inspector</div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "hsl(var(--text-strong))" }}>JSON options</div>
          </div>
          <IconButton size="sm" title="Close inspector" onClick={onClose}><Icon name="x" size={14} /></IconButton>
        </header>

        <div style={{ display: "grid", gap: 14, marginTop: 6 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "hsl(var(--text-body))" }}>Indent</label>
            <Select fullWidth value={String(options.indent)} onChange={(e) => onOptions({ ...options, indent: Number(e.target.value) })}>
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="8">8 spaces</option>
            </Select>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <Checkbox checked={options.sortKeys} onChange={(v) => onOptions({ ...options, sortKeys: v })} label="Sort keys" />
            <Checkbox checked={options.validate} onChange={(v) => onOptions({ ...options, validate: v })} label="Validate while typing" />
            <Checkbox checked={options.collapse} onChange={(v) => onOptions({ ...options, collapse: v })} label="Collapse large arrays" />
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <h3 style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase", color: "hsl(var(--text-muted))", marginBottom: 10 }}>Pipe output</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <PipeTarget mono="64" tone="var(--primary)" title="Base64 Encoder" sub="Open in split view" />
            <PipeTarget mono="JT" tone="var(--chart-4)" title="JWT Decoder" sub="Replace current output" />
          </div>
        </div>

        <div style={{ marginTop: 22, padding: 12, borderRadius: "var(--radius-lg)", border: "1px solid hsl(var(--border))", background: "hsl(var(--surface-0))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span style={{ color: "hsl(var(--success))", display: "inline-flex" }}><Icon name="shield" size={14} /></span>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "hsl(var(--text-strong))" }}>Local only</span>
          </div>
          <p style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))", lineHeight: "var(--leading-snug)" }}>
            Everything runs on this device. No network calls, no cookies, no telemetry — even piped workflows stay local.
          </p>
        </div>
      </aside>
    );
  }

  function PipeTarget({ mono, tone, title, sub }) {
    const [hover, setHover] = React.useState(false);
    return (
      <button type="button" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", textAlign: "left",
        background: hover ? "hsl(var(--elevate-1))" : "hsl(var(--surface-0))",
        border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-md)", cursor: "pointer",
        transition: "background-color var(--duration-fast) var(--ease-standard)",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "var(--radius-sm)", background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border-faint))", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: "var(--weight-semibold)", color: `hsl(${tone})`, flexShrink: 0 }}>{mono}</span>
        <span>
          <span style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "hsl(var(--text-strong))", fontFamily: "var(--font-sans)" }}>{title}</span>
          <span style={{ display: "block", fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))", fontFamily: "var(--font-sans)" }}>{sub}</span>
        </span>
      </button>
    );
  }

  window.TBInspector = Inspector;
})();
