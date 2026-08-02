/* Workspace sidebar — brand, command trigger, favorites (⌘1–3),
   workspaces, tool library (full catalog counts), snippets/history,
   privacy footer. */
(function () {
  const { SidebarItem, Badge, Kbd } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;

  const FAVORITES = [
    { id: "json-formatter", label: "JSON", kbd: "⌘1" },
    { id: "jwt-decoder", label: "JWT", kbd: "⌘2" },
    { id: "base64-encoder", label: "Base64", kbd: "⌘3" },
  ];
  const WORKSPACES = [
    { id: "api-debug", label: "API Debug", tone: "var(--primary)" },
    { id: "data-cleanup", label: "Data Cleanup", tone: "var(--success)" },
    { id: "crypto", label: "Crypto", tone: "var(--warning)" },
  ];

  function GroupTitle({ children }) {
    return (
      <div style={{ padding: "0 10px 5px", fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase", color: "hsl(var(--text-faint))" }}>{children}</div>
    );
  }

  function Sidebar({ activeId, activeCat, onTool, onCategory, onSearch }) {
    const cats = window.TB_CATEGORIES;
    const tools = window.TB_TOOLS;
    return (
      <aside style={{
        width: "var(--sidebar-width)", flexShrink: 0, height: "100%",
        display: "flex", flexDirection: "column",
        background: "hsl(var(--sidebar))",
        borderRight: "1px solid hsl(var(--border))",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, height: "var(--header-height)", padding: "0 14px", flexShrink: 0 }}>
          <img src="../../assets/logo-mark.svg" width="22" height="22" alt="" style={{ borderRadius: 6 }} />
          <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "hsl(var(--text-strong))" }}>tool<span style={{ color: "hsl(var(--primary))" }}>bit</span></span>
        </div>

        {/* Command trigger */}
        <div style={{ padding: "0 10px 10px" }}>
          <button onClick={onSearch} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", height: "var(--control-height)", padding: "0 9px",
            background: "hsl(var(--surface-0))", border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius-md)", color: "hsl(var(--text-faint))", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
          }}>
            <Icon name="search" size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>Command</span>
            <Kbd>⌘K</Kbd>
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px", display: "grid", gap: 16, alignContent: "start" }}>
          <div>
            <GroupTitle>Favorites</GroupTitle>
            <div style={{ display: "grid", gap: 1 }}>
              {FAVORITES.map((f) => (
                <SidebarItem key={f.id} active={activeId === f.id} onClick={() => onTool(f.id)}
                  icon={<Monogram id={f.id} />} badge={<Kbd>{f.kbd}</Kbd>}>{f.label}</SidebarItem>
              ))}
            </div>
          </div>

          <div>
            <GroupTitle>Workspaces</GroupTitle>
            <div style={{ display: "grid", gap: 1 }}>
              {WORKSPACES.map((w) => (
                <SidebarItem key={w.id}
                  icon={<span style={{ width: 8, height: 8, borderRadius: "var(--radius-full)", background: `hsl(${w.tone})`, display: "inline-block" }} />}>
                  {w.label}
                </SidebarItem>
              ))}
            </div>
          </div>

          <div>
            <GroupTitle>Tool Library</GroupTitle>
            <div style={{ display: "grid", gap: 1 }}>
              {cats.map((c) => (
                <SidebarItem key={c.id} active={activeCat === c.id} onClick={() => onCategory(c.id)}
                  icon={<Icon name={c.icon} size={15} />}
                  badge={<span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "hsl(var(--text-faint))" }}>{tools.filter((t) => t.cat === c.id).length}</span>}>
                  {c.label}
                </SidebarItem>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom */}
        <div style={{ padding: "8px 10px", borderTop: "1px solid hsl(var(--border-faint))", display: "grid", gap: 1 }}>
          <SidebarItem icon={<Icon name="fileCode" size={15} />}>Snippets</SidebarItem>
          <SidebarItem icon={<Icon name="clock" size={15} />}>History</SidebarItem>
        </div>
        <div style={{ padding: "8px 14px 10px", borderTop: "1px solid hsl(var(--border-faint))", display: "flex", alignItems: "center", gap: 7, color: "hsl(var(--text-faint))" }}>
          <span style={{ color: "hsl(var(--success))", display: "inline-flex" }}><Icon name="shield" size={13} /></span>
          <span style={{ fontSize: "var(--text-2xs)" }}>Your data never leaves this device</span>
        </div>
      </aside>
    );
  }

  /* Two-letter monogram chip used only for pinned favorites */
  function Monogram({ id }) {
    const map = { "json-formatter": ["JS", "var(--warning)"], "jwt-decoder": ["JT", "var(--chart-4)"], "base64-encoder": ["64", "var(--primary)"] };
    const [txt, color] = map[id] || ["?", "var(--text-muted)"];
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 20, height: 20, borderRadius: "var(--radius-sm)",
        background: "hsl(var(--surface-0))", border: "1px solid hsl(var(--border))",
        fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: "var(--weight-semibold)", color: `hsl(${color})`,
      }}>{txt}</span>
    );
  }

  window.TBSidebar = Sidebar;
})();
