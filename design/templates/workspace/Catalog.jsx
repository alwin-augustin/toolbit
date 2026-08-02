/* Catalog — browsable category view (full tool library, not palette-only). */
(function () {
  const { Card } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;

  function Catalog({ catId, onTool }) {
    const cat = window.TB_CATEGORIES.find((c) => c.id === catId);
    const tools = window.TB_TOOLS.filter((t) => t.cat === catId);
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "var(--radius-md)", background: "hsl(var(--primary-soft))", color: "hsl(var(--primary))" }}><Icon name={cat.icon} size={17} /></span>
            <h1 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", color: "hsl(var(--text-strong))" }}>{cat.label}</h1>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "hsl(var(--text-faint))" }}>{tools.length} tools</span>
          </div>
          <p style={{ fontSize: "var(--text-sm)", color: "hsl(var(--text-muted))", marginBottom: 20 }}>Open a tool as a new tab. Pipe any tool's output into the next.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {tools.map((t) => (
              <Card key={t.id} interactive padding="12px" onClick={() => onTool(t.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "var(--radius-md)", background: "hsl(var(--primary-soft))", color: "hsl(var(--primary))", flexShrink: 0 }}><Icon name={cat.icon} size={16} /></span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "hsl(var(--text-strong))" }}>{t.name}</span>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.desc}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
  window.TBCatalog = Catalog;
})();
