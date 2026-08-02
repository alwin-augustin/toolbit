/* Statusbar — privacy signal, validity, size, encoding, caret. */
(function () {
  const Icon = window.TBIcon;

  function Item({ children, accent }) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "0 8px", height: "100%",
        fontSize: "var(--text-2xs)", fontFamily: "var(--font-sans)",
        color: accent ? `hsl(${accent})` : "hsl(var(--text-muted))",
      }}>{children}</span>
    );
  }

  function Statusbar({ status }) {
    return (
      <footer style={{
        display: "flex", alignItems: "center", height: "var(--statusbar-height)", flexShrink: 0,
        borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--surface-1))",
        padding: "0 6px",
      }}>
        <Item accent="var(--success)"><Icon name="shield" size={12} /> Local · no network</Item>
        <Divider />
        {status.valid !== null && (
          <Item accent={status.valid ? "var(--success)" : "var(--danger)"}>
            <span style={{ width: 6, height: 6, borderRadius: "var(--radius-full)", background: "currentColor", display: "inline-block" }} />
            {status.valid ? "Valid JSON" : "Invalid JSON"}
          </Item>
        )}
        <Item>{formatBytes(status.bytes)}</Item>
        <Item>UTF-8</Item>
        <span style={{ flex: 1 }} />
        <Item><Icon name="pipe" size={12} /> 3-step pipeline</Item>
        <Divider />
        <Item>Ln {status.ln ?? 1}, Col {status.col ?? 1}</Item>
      </footer>
    );
  }

  function Divider() {
    return <span style={{ width: 1, height: 14, background: "hsl(var(--border))" }} />;
  }

  function formatBytes(b) {
    if (!b) return "0 B";
    if (b < 1024) return b + " B";
    return (b / 1024).toFixed(1) + " KB";
  }

  window.TBStatusbar = Statusbar;
})();
