import React from "react";

/**
 * Code/data display block with a header bar (language label + copy slot)
 * and monospace body. Optional naive token tinting for JSON-ish content.
 */
export function CodeBlock({ code = "", lang = "json", filename, highlight = true, style, ...rest }) {
  return (
    <div
      style={{
        background: "hsl(var(--surface-1))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        fontFamily: "var(--font-mono)",
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 0.75rem",
          borderBottom: "1px solid hsl(var(--border-faint))",
          background: "hsl(var(--surface-2))",
        }}
      >
        <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-faint))", fontFamily: "var(--font-mono)" }}>
          {filename || lang}
        </span>
        <span style={{ display: "flex", gap: "5px" }}>
          {["var(--danger)", "var(--warning)", "var(--success)"].map((c, i) => (
            <span key={i} style={{ width: 9, height: 9, borderRadius: "var(--radius-full)", background: `hsl(${c} / 0.55)` }} />
          ))}
        </span>
      </div>
      <pre style={{ margin: 0, padding: "0.875rem 1rem", overflow: "auto", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "hsl(var(--text-body))" }}>
        <code dangerouslySetInnerHTML={highlight ? { __html: tint(code) } : undefined}>
          {highlight ? undefined : code}
        </code>
      </pre>
    </div>
  );
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Lightweight JSON-ish tinting using token CSS vars. Not a real parser.
function tint(code) {
  let out = esc(code);
  out = out.replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span style="color:hsl(var(--code-key))">$1</span>$2');
  out = out.replace(/(:\s*)("(?:[^"\\]|\\.)*")/g, '$1<span style="color:hsl(var(--code-string))">$2</span>');
  out = out.replace(/\b(-?\d+\.?\d*)\b/g, '<span style="color:hsl(var(--code-number))">$1</span>');
  out = out.replace(/\b(true|false|null)\b/g, '<span style="color:hsl(var(--code-number))">$1</span>');
  return out;
}
