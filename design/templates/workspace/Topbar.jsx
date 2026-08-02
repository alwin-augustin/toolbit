/* Topbar — breadcrumb, density toggle, inspector/theme toggles, Run. */
(function () {
  const { Button, IconButton, Tabs, Tooltip } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;

  function Topbar({ crumb, density, onDensity, onToggleInspector, theme, onToggleTheme, onRun }) {
    return (
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "var(--header-height)", padding: "0 12px", flexShrink: 0,
        borderBottom: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-0))",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--text-sm)", color: "hsl(var(--text-muted))", minWidth: 0 }}>
          <span>{crumb[0]}</span>
          <span style={{ color: "hsl(var(--text-faint))" }}>/</span>
          <span style={{ color: "hsl(var(--text-strong))", fontWeight: "var(--weight-semibold)" }}>{crumb[1]}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tabs variant="segment" value={density} onChange={onDensity}
            items={[{ value: "compact", label: "Compact" }, { value: "comfortable", label: "Comfort" }]} />
          <Tooltip label="Toggle inspector" side="bottom">
            <IconButton title="Toggle inspector" onClick={onToggleInspector}><Icon name="panelRight" size={16} /></IconButton>
          </Tooltip>
          <Tooltip label="Toggle theme" side="bottom">
            <IconButton title="Toggle theme" onClick={onToggleTheme}><Icon name={theme === "dark" ? "sun" : "moon"} size={16} /></IconButton>
          </Tooltip>
          <Button size="sm" iconLeft={<Icon name="play" size={13} />} onClick={onRun}>Run pipeline</Button>
        </div>
      </header>
    );
  }
  window.TBTopbar = Topbar;
})();
