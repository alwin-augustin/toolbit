/* Command palette — ⌘K overlay. Fuzzy-ish filter over the tool catalog. */
(function () {
  const { Kbd } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;

  function CommandPalette({ open, onClose, onSelect }) {
    const [q, setQ] = React.useState("");
    const inputRef = React.useRef(null);
    React.useEffect(() => { if (open) { setQ(""); setTimeout(() => inputRef.current && inputRef.current.focus(), 30); } }, [open]);
    if (!open) return null;
    const tools = window.TB_TOOLS;
    const results = q.trim()
      ? tools.filter((t) => (t.name + " " + t.desc).toLowerCase().includes(q.toLowerCase()))
      : tools.slice(0, 7);

    return (
      <div onClick={onClose} className="tb-enter-fade" style={{ position: "fixed", inset: 0, zIndex: 100, background: "hsl(var(--overlay) / 0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}>
        <div onClick={(e) => e.stopPropagation()} className="tb-enter-scale" style={{ width: 560, maxWidth: "92vw", background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-xl)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid hsl(var(--border))" }}>
            <span style={{ color: "hsl(var(--text-faint))", display: "inline-flex" }}><Icon name="search" size={18} /></span>
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools, actions, snippets…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "hsl(var(--text-strong))", fontFamily: "var(--font-sans)", fontSize: "var(--text-md)" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "hsl(var(--text-faint))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-xs)", padding: "2px 6px" }}>ESC</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto", padding: 8 }}>
            {results.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "hsl(var(--text-faint))", fontSize: "var(--text-sm)" }}>No matches for “{q}”</div>}
            {results.map((t, i) => {
              const c = window.TB_CATEGORIES.find((x) => x.id === t.cat);
              return (
                <button key={t.id} onClick={() => { onSelect(t.id); onClose(); }} style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "9px 10px", textAlign: "left",
                  background: i === 0 ? "hsl(var(--primary-soft))" : "transparent", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
                }}
                  onMouseEnter={(e) => { if (i !== 0) e.currentTarget.style.background = "hsl(var(--elevate-1))"; }}
                  onMouseLeave={(e) => { if (i !== 0) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "var(--radius-md)", background: "hsl(var(--surface-3))", color: "hsl(var(--primary))" }}><Icon name={c.icon} size={16} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "var(--text-base)", fontWeight: "var(--weight-medium)", color: "hsl(var(--text-strong))" }}>{t.name}</span>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))" }}>{t.desc}</span>
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "hsl(var(--text-faint))", textTransform: "uppercase" }}>{c.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 16px", borderTop: "1px solid hsl(var(--border))", color: "hsl(var(--text-faint))", fontSize: "var(--text-xs)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Kbd>↵</Kbd> open</span>
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="shield" size={12} /> local only</span>
          </div>
        </div>
      </div>
    );
  }
  window.TBCommandPalette = CommandPalette;
})();
