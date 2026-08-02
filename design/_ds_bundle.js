/* @ds-bundle: {"format":4,"namespace":"ToolbitDesignSystem_4ae95c","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Kbd","sourcePath":"components/core/Kbd.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"SidebarItem","sourcePath":"components/nav/SidebarItem.jsx"},{"name":"Tabs","sourcePath":"components/nav/Tabs.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"CodeBlock","sourcePath":"components/surfaces/CodeBlock.jsx"},{"name":"StatusPill","sourcePath":"components/surfaces/StatusPill.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"e0494b27c5b0","components/core/Button.jsx":"b4c205da4e01","components/core/IconButton.jsx":"2c2cec79fa0b","components/core/Kbd.jsx":"70295024b6f2","components/core/Tag.jsx":"5c2a8ca9da60","components/feedback/Alert.jsx":"b505263d28ee","components/feedback/Skeleton.jsx":"9c212154d05f","components/feedback/Toast.jsx":"9a43ebf45c21","components/feedback/Tooltip.jsx":"5106260609d8","components/forms/Checkbox.jsx":"4245ae5f5315","components/forms/Input.jsx":"9ac399ddf406","components/forms/Select.jsx":"d9fc8890aedf","components/forms/Switch.jsx":"f78261c99d8c","components/forms/Textarea.jsx":"fcc4d47f13f3","components/nav/SidebarItem.jsx":"2147033bf55d","components/nav/Tabs.jsx":"1be4ea2a7140","components/surfaces/Card.jsx":"f0e9564719e0","components/surfaces/CodeBlock.jsx":"e472f9aff9df","components/surfaces/StatusPill.jsx":"cbb0ca3722bb","ui_kits/app/Catalog.jsx":"65b3011bf729","ui_kits/app/CommandPalette.jsx":"2bdcd9f1cf1a","ui_kits/app/EditorView.jsx":"1b47e5415db7","ui_kits/app/Inspector.jsx":"6b338a88f61b","ui_kits/app/Sidebar.jsx":"70ab56eca98c","ui_kits/app/Statusbar.jsx":"b5623017e9d8","ui_kits/app/Topbar.jsx":"2ea5e908daa7","ui_kits/app/data.js":"f890b2ad6b5a","ui_kits/app/icons.jsx":"fb10e3b5082b","ui_kits/marketing/LandingPage.jsx":"f6f62c7a1c8a","ui_kits/marketing/MiniWorkspace.jsx":"3b3335deecbb"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ToolbitDesignSystem_4ae95c = window.ToolbitDesignSystem_4ae95c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Small status/label badge. Soft tinted fill + saturated text per tone.
 * Used for counts, "Saved"/"Preset" tags, validity states, "Local-only".
 */
function Badge({
  children,
  tone = "neutral",
  variant = "soft",
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      h: "var(--text-muted)",
      soft: "var(--surface-3)"
    },
    primary: {
      h: "var(--primary)",
      soft: "var(--primary-soft)"
    },
    success: {
      h: "var(--success)",
      soft: "var(--success-soft)"
    },
    warning: {
      h: "var(--warning)",
      soft: "var(--warning-soft)"
    },
    danger: {
      h: "var(--danger)",
      soft: "var(--danger-soft)"
    }
  };
  const t = tones[tone] || tones.neutral;
  const variants = {
    soft: {
      background: `hsl(${t.soft})`,
      color: `hsl(${t.h})`,
      borderColor: "transparent"
    },
    outline: {
      background: "transparent",
      color: `hsl(${t.h})`,
      borderColor: `hsl(${t.h} / 0.4)`
    },
    solid: {
      background: `hsl(${t.h})`,
      color: tone === "neutral" ? "hsl(var(--surface-0))" : "#fff",
      borderColor: "transparent"
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      height: "20px",
      padding: "0 0.4375rem",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-medium)",
      lineHeight: 1,
      borderRadius: "var(--radius-sm)",
      border: "1px solid transparent",
      whiteSpace: "nowrap",
      ...variants[variant],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Toolbit primary button. Sentence-case label, optional leading/trailing
 * Lucide icon (pass as ReactNode). Variants follow the source's button.tsx.
 */
function Button({
  children,
  variant = "default",
  size = "default",
  iconLeft,
  iconRight,
  disabled = false,
  type = "button",
  style,
  ...rest
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    whiteSpace: "nowrap",
    fontFamily: "var(--font-sans)",
    fontWeight: "var(--weight-medium)",
    lineHeight: 1,
    borderRadius: "var(--radius-md)",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
    userSelect: "none"
  };
  const sizes = {
    sm: {
      height: "28px",
      padding: "0 0.625rem",
      fontSize: "var(--text-sm)"
    },
    default: {
      height: "32px",
      padding: "0 0.75rem",
      fontSize: "var(--text-base)"
    },
    lg: {
      height: "40px",
      padding: "0 1.25rem",
      fontSize: "var(--text-md)"
    }
  };
  const variants = {
    default: {
      background: "hsl(var(--primary))",
      color: "hsl(var(--text-onbrand))",
      borderColor: "hsl(var(--primary) / 0.6)"
    },
    secondary: {
      background: "hsl(var(--surface-3))",
      color: "hsl(var(--text-strong))",
      borderColor: "hsl(var(--border))"
    },
    outline: {
      background: "transparent",
      color: "hsl(var(--text-body))",
      borderColor: "hsl(var(--border-strong))"
    },
    ghost: {
      background: "transparent",
      color: "hsl(var(--text-body))",
      borderColor: "transparent"
    },
    destructive: {
      background: "hsl(var(--danger))",
      color: "#fff",
      borderColor: "hsl(var(--danger) / 0.6)"
    },
    link: {
      background: "transparent",
      color: "hsl(var(--primary))",
      borderColor: "transparent",
      padding: 0,
      height: "auto",
      textDecoration: "underline",
      textUnderlineOffset: "3px"
    }
  };
  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover ? hoverFor(variant) : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...sizes[size],
      ...variants[variant],
      ...hoverStyle,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
function hoverFor(variant) {
  switch (variant) {
    case "default":
      return {
        background: "hsl(var(--primary-hover))"
      };
    case "secondary":
      return {
        background: "hsl(var(--surface-3))",
        borderColor: "hsl(var(--border-strong))"
      };
    case "outline":
      return {
        background: "hsl(var(--elevate-1))",
        borderColor: "hsl(var(--border-strong))"
      };
    case "ghost":
      return {
        background: "hsl(var(--elevate-1))"
      };
    case "destructive":
      return {
        background: "hsl(var(--danger) / 0.88)"
      };
    case "link":
      return {
        color: "hsl(var(--primary-hover))"
      };
    default:
      return null;
  }
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Square icon-only button — toolbar actions (copy, clear, theme, more).
 * Pass a Lucide SVG (or any node) as children.
 */
function IconButton({
  children,
  variant = "ghost",
  size = "default",
  disabled = false,
  title,
  type = "button",
  style,
  ...rest
}) {
  const dims = {
    sm: 24,
    default: 28,
    lg: 36
  }[size];
  const [hover, setHover] = React.useState(false);
  const variants = {
    ghost: {
      background: hover && !disabled ? "hsl(var(--elevate-1))" : "transparent",
      color: "hsl(var(--text-body))",
      borderColor: "transparent"
    },
    outline: {
      background: hover && !disabled ? "hsl(var(--elevate-1))" : "transparent",
      color: "hsl(var(--text-body))",
      borderColor: "hsl(var(--border-strong))"
    },
    solid: {
      background: hover && !disabled ? "hsl(var(--primary-hover))" : "hsl(var(--primary))",
      color: "hsl(var(--text-onbrand))",
      borderColor: "hsl(var(--primary) / 0.6)"
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    title: title,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dims,
      height: dims,
      borderRadius: "var(--radius-md)",
      border: "1px solid transparent",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
      ...variants[variant],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Kbd.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Keyboard key chip — renders shortcut keys like ⌘K, Cmd+V, Esc.
 * Monospace, subtle inset look.
 */
function Kbd({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("kbd", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "20px",
      height: "20px",
      padding: "0 0.375rem",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-2xs)",
      fontWeight: "var(--weight-medium)",
      lineHeight: 1,
      color: "hsl(var(--text-muted))",
      background: "hsl(var(--surface-3))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "var(--radius-xs)",
      boxShadow: "0 1px 0 0 hsl(var(--border))",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Kbd });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Kbd.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag/chip — interactive pill for tools, filters, detected-type suggestions.
 * Optional leading icon and active state. Renders as button when onClick set.
 */
function Tag({
  children,
  icon,
  active = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const interactive = !!onClick;
  const bg = active ? "hsl(var(--primary-soft))" : hover && interactive ? "hsl(var(--elevate-1))" : "hsl(var(--surface-2))";
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      height: "26px",
      padding: "0 0.625rem",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-medium)",
      lineHeight: 1,
      color: active ? "hsl(var(--primary))" : "hsl(var(--text-body))",
      background: bg,
      border: `1px solid ${active ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))"}`,
      borderRadius: "var(--radius-full)",
      cursor: interactive ? "pointer" : "default",
      transition: "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Inline alert banner. Soft tinted background + leading icon slot.
 * Matches the product's large-file warning / status callouts.
 */
function Alert({
  children,
  title,
  tone = "info",
  icon,
  style,
  ...rest
}) {
  const tones = {
    info: {
      h: "var(--info)",
      soft: "var(--info-soft)"
    },
    success: {
      h: "var(--success)",
      soft: "var(--success-soft)"
    },
    warning: {
      h: "var(--warning)",
      soft: "var(--warning-soft)"
    },
    danger: {
      h: "var(--danger)",
      soft: "var(--danger-soft)"
    }
  };
  const t = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: "flex",
      gap: "0.625rem",
      padding: "0.625rem 0.75rem",
      background: `hsl(${t.soft})`,
      border: `1px solid hsl(${t.h} / 0.35)`,
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "hsl(var(--text-body))",
      lineHeight: "var(--leading-snug)",
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: `hsl(${t.h})`,
      flexShrink: 0,
      display: "inline-flex",
      marginTop: "1px"
    }
  }, icon), /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: "var(--weight-semibold)",
      color: "hsl(var(--text-strong))",
      marginBottom: children ? "0.125rem" : 0
    }
  }, title), children));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Skeleton loading placeholder — shimmer block. */
function Skeleton({
  width = "100%",
  height = "1rem",
  radius = "var(--radius-sm)",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true",
    style: {
      display: "block",
      width,
      height,
      borderRadius: radius,
      background: "linear-gradient(90deg, hsl(var(--surface-3)) 25%, hsl(var(--surface-2)) 37%, hsl(var(--surface-3)) 63%)",
      backgroundSize: "400% 100%",
      animation: "tb-skeleton 1.4s ease infinite",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("style", null, `@keyframes tb-skeleton { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }`));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Toast notification — transient confirmation ("Copied to clipboard").
 * Static presentational component; position with a fixed wrapper.
 */
function Toast({
  children,
  title,
  tone = "neutral",
  icon,
  onClose,
  style,
  ...rest
}) {
  const accent = {
    neutral: "var(--text-muted)",
    success: "var(--success)",
    danger: "var(--danger)",
    primary: "var(--primary)"
  }[tone] || "var(--text-muted)";
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.625rem",
      minWidth: "260px",
      maxWidth: "380px",
      padding: "0.75rem 0.875rem",
      background: "hsl(var(--surface-2))",
      border: "1px solid hsl(var(--border))",
      borderLeft: `3px solid hsl(${accent})`,
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-lg)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "hsl(var(--text-body))",
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: `hsl(${accent})`,
      flexShrink: 0,
      display: "inline-flex",
      marginTop: "1px"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: "var(--weight-semibold)",
      color: "hsl(var(--text-strong))",
      marginBottom: children ? "0.125rem" : 0
    }
  }, title), children), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      background: "none",
      border: "none",
      color: "hsl(var(--text-faint))",
      cursor: "pointer",
      padding: "2px",
      display: "inline-flex",
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Tooltip — hover label. CSS-only via wrapper; appears on hover/focus. */
function Tooltip({
  children,
  label,
  side = "top",
  style,
  ...rest
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: "calc(100% + 6px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    bottom: {
      top: "calc(100% + 6px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    left: {
      right: "calc(100% + 6px)",
      top: "50%",
      transform: "translateY(-50%)"
    },
    right: {
      left: "calc(100% + 6px)",
      top: "50%",
      transform: "translateY(-50%)"
    }
  }[side];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocusCapture: () => setShow(true),
    onBlurCapture: () => setShow(false)
  }, rest), children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      ...pos,
      zIndex: 50,
      padding: "0.25rem 0.5rem",
      background: "hsl(var(--overlay))",
      color: "hsl(0 0% 98%)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-medium)",
      lineHeight: 1.3,
      whiteSpace: "nowrap",
      borderRadius: "var(--radius-sm)",
      boxShadow: "var(--shadow-md)",
      opacity: show ? 1 : 0,
      visibility: show ? "visible" : "hidden",
      transform: `${pos.transform} translateY(${show ? "0" : "2px"})`,
      transition: "opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)",
      pointerEvents: "none"
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Checkbox with label. Controlled via checked/onChange. */
function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-base)",
      color: "hsl(var(--text-body))",
      userSelect: "none",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange?.(!checked),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      height: "18px",
      flexShrink: 0,
      borderRadius: "var(--radius-xs)",
      background: checked ? "hsl(var(--primary))" : "hsl(var(--surface-0))",
      border: `1px solid ${checked ? "hsl(var(--primary))" : "hsl(var(--border-strong))"}`,
      transition: "background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)"
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }))), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Single-line text input. Monospace optional (for code/data values). */
function Input({
  mono = false,
  invalid = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("input", _extends({
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      height: "32px",
      width: "100%",
      padding: "0 0.75rem",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
      fontSize: "var(--text-base)",
      color: "hsl(var(--text-strong))",
      background: "hsl(var(--surface-0))",
      border: `1px solid ${invalid ? "hsl(var(--danger))" : focus ? "hsl(var(--ring))" : "hsl(var(--border-strong))"}`,
      borderRadius: "var(--radius-md)",
      outline: "none",
      boxShadow: focus ? "0 0 0 3px hsl(var(--ring) / 0.18)" : "none",
      transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Native select styled to match the system, with a chevron. */
function Select({
  children,
  invalid = false,
  fullWidth = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "inline-flex",
      width: fullWidth ? "100%" : "auto"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      appearance: "none",
      height: "32px",
      width: "100%",
      padding: "0 2rem 0 0.75rem",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-base)",
      color: "hsl(var(--text-strong))",
      background: "hsl(var(--surface-0))",
      border: `1px solid ${invalid ? "hsl(var(--danger))" : focus ? "hsl(var(--ring))" : "hsl(var(--border-strong))"}`,
      borderRadius: "var(--radius-md)",
      outline: "none",
      cursor: "pointer",
      boxShadow: focus ? "0 0 0 3px hsl(var(--ring) / 0.18)" : "none",
      transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
      ...style
    }
  }, rest), children), /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      position: "absolute",
      right: "0.625rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: "hsl(var(--text-faint))",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Toggle switch — used for settings like "Network Off", theme. */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange?.(!checked),
    style: {
      position: "relative",
      width: "36px",
      height: "20px",
      flexShrink: 0,
      padding: 0,
      border: "none",
      borderRadius: "var(--radius-full)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      background: checked ? "hsl(var(--primary))" : "hsl(var(--surface-3))",
      boxShadow: checked ? "none" : "inset 0 0 0 1px hsl(var(--border-strong))",
      transition: "background-color var(--duration-base) var(--ease-standard)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: "2px",
      left: checked ? "18px" : "2px",
      width: "16px",
      height: "16px",
      borderRadius: "var(--radius-full)",
      background: "#fff",
      boxShadow: "var(--shadow-sm)",
      transition: "left var(--duration-base) var(--ease-out)"
    }
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Multi-line input. Defaults to monospace — the product uses textareas for
 * all code/data entry (paste anything, JSON input/output, snippets).
 */
function Textarea({
  mono = true,
  invalid = false,
  rows = 6,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      width: "100%",
      padding: "0.625rem 0.75rem",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
      fontSize: "var(--text-base)",
      lineHeight: "var(--leading-normal)",
      color: "hsl(var(--text-strong))",
      background: "hsl(var(--surface-0))",
      border: `1px solid ${invalid ? "hsl(var(--danger))" : focus ? "hsl(var(--ring))" : "hsl(var(--border-strong))"}`,
      borderRadius: "var(--radius-md)",
      outline: "none",
      resize: "vertical",
      boxShadow: focus ? "0 0 0 3px hsl(var(--ring) / 0.18)" : "none",
      transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/nav/SidebarItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Sidebar navigation row — icon tile + label, with active + hover states.
 * Mirrors the app sidebar / all-tools rows.
 */
function SidebarItem({
  children,
  icon,
  active = false,
  onClick,
  badge,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const bg = active ? "hsl(var(--primary-soft))" : hover ? "hsl(var(--elevate-1))" : "transparent";
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: "0.625rem",
      width: "100%",
      height: "30px",
      padding: "0 0.625rem",
      background: bg,
      border: "1px solid transparent",
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      textAlign: "left",
      transition: "background-color var(--duration-fast) var(--ease-standard)",
      position: "relative",
      ...style
    }
  }, rest), active && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: "-8px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "3px",
      height: "18px",
      borderRadius: "var(--radius-full)",
      background: "hsl(var(--primary))"
    }
  }), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      color: active ? "hsl(var(--primary))" : "hsl(var(--text-muted))",
      flexShrink: 0
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-base)",
      fontWeight: active ? "var(--weight-medium)" : "var(--weight-regular)",
      color: active ? "hsl(var(--text-strong))" : "hsl(var(--text-body))",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, children), badge);
}
Object.assign(__ds_scope, { SidebarItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/nav/SidebarItem.jsx", error: String((e && e.message) || e) }); }

// components/nav/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Segmented / underline tabs. Controlled via value + onChange.
 * `variant="segment"` (default) = filled pill group; "underline" = text + bar.
 */
function Tabs({
  items = [],
  value,
  onChange,
  variant = "segment",
  style,
  ...rest
}) {
  if (variant === "underline") {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: "flex",
        gap: "1.25rem",
        borderBottom: "1px solid hsl(var(--border))",
        ...style
      }
    }, rest), items.map(it => {
      const active = it.value === value;
      return /*#__PURE__*/React.createElement("button", {
        key: it.value,
        type: "button",
        onClick: () => onChange?.(it.value),
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.5rem 0.125rem",
          marginBottom: "-1px",
          background: "none",
          border: "none",
          borderBottom: `2px solid ${active ? "hsl(var(--primary))" : "transparent"}`,
          color: active ? "hsl(var(--text-strong))" : "hsl(var(--text-muted))",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-base)",
          fontWeight: "var(--weight-medium)",
          cursor: "pointer",
          transition: "color var(--duration-fast) var(--ease-standard)"
        }
      }, it.icon, it.label);
    }));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "inline-flex",
      gap: "2px",
      padding: "3px",
      background: "hsl(var(--surface-3))",
      borderRadius: "var(--radius-md)",
      ...style
    }
  }, rest), items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => onChange?.(it.value),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        height: "28px",
        padding: "0 0.625rem",
        background: active ? "hsl(var(--surface-0))" : "transparent",
        color: active ? "hsl(var(--text-strong))" : "hsl(var(--text-muted))",
        border: "none",
        borderRadius: "var(--radius-sm)",
        boxShadow: active ? "var(--shadow-xs)" : "none",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-medium)",
        cursor: "pointer",
        transition: "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)"
      }
    }, it.icon, it.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/nav/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Surface card — the base container. Optional hover-lift for clickable cards
 * (tool tiles, workflow cards, recent items).
 */
function Card({
  children,
  interactive = false,
  padding = "1.25rem",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: "hsl(var(--surface-2))",
      border: `1px solid ${hover ? "hsl(var(--border-strong))" : "hsl(var(--border-faint))"}`,
      borderRadius: "var(--radius-lg)",
      boxShadow: hover ? "var(--shadow-md)" : "var(--shadow-sm)",
      padding,
      cursor: interactive ? "pointer" : "default",
      transition: "border-color var(--duration-base) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard), background-color var(--duration-base) var(--ease-standard)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/CodeBlock.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Code/data display block with a header bar (language label + copy slot)
 * and monospace body. Optional naive token tinting for JSON-ish content.
 */
function CodeBlock({
  code = "",
  lang = "json",
  filename,
  highlight = true,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "hsl(var(--surface-1))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      fontFamily: "var(--font-mono)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.5rem 0.75rem",
      borderBottom: "1px solid hsl(var(--border-faint))",
      background: "hsl(var(--surface-2))"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-xs)",
      color: "hsl(var(--text-faint))",
      fontFamily: "var(--font-mono)"
    }
  }, filename || lang), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: "5px"
    }
  }, ["var(--danger)", "var(--warning)", "var(--success)"].map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 9,
      height: 9,
      borderRadius: "var(--radius-full)",
      background: `hsl(${c} / 0.55)`
    }
  })))), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      padding: "0.875rem 1rem",
      overflow: "auto",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--leading-relaxed)",
      color: "hsl(var(--text-body))"
    }
  }, /*#__PURE__*/React.createElement("code", {
    dangerouslySetInnerHTML: highlight ? {
      __html: tint(code)
    } : undefined
  }, highlight ? undefined : code)));
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
Object.assign(__ds_scope, { CodeBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/CodeBlock.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/StatusPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Status pill with a leading dot — the product's "No network calls made",
 * online/offline, valid/invalid indicators.
 */
function StatusPill({
  children,
  tone = "success",
  icon,
  style,
  ...rest
}) {
  const color = {
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    neutral: "var(--text-muted)",
    primary: "var(--primary)"
  }[tone] || "var(--success)";
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4375rem",
      height: "26px",
      padding: "0 0.625rem",
      background: "hsl(var(--surface-2) / 0.6)",
      border: "1px solid hsl(var(--border))",
      borderRadius: "var(--radius-full)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "hsl(var(--text-body))",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: `hsl(${color})`,
      display: "inline-flex"
    }
  }, icon) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "var(--radius-full)",
      background: `hsl(${color})`,
      boxShadow: `0 0 0 3px hsl(${color} / 0.18)`
    }
  }), children);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/StatusPill.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Catalog.jsx
try { (() => {
/* Catalog — browsable category view (full tool library, not palette-only). */
(function () {
  const {
    Card
  } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;
  function Catalog({
    catId,
    onTool
  }) {
    const cat = window.TB_CATEGORIES.find(c => c.id === catId);
    const tools = window.TB_TOOLS.filter(t => t.cat === catId);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: "24px 28px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 760,
        margin: "0 auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "var(--radius-md)",
        background: "hsl(var(--primary-soft))",
        color: "hsl(var(--primary))"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: cat.icon,
      size: 17
    })), /*#__PURE__*/React.createElement("h1", {
      style: {
        fontSize: "var(--text-lg)",
        fontWeight: "var(--weight-semibold)",
        color: "hsl(var(--text-strong))"
      }
    }, cat.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        color: "hsl(var(--text-faint))"
      }
    }, tools.length, " tools")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-muted))",
        marginBottom: 20
      }
    }, "Open a tool as a new tab. Pipe any tool's output into the next."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 10
      }
    }, tools.map(t => /*#__PURE__*/React.createElement(Card, {
      key: t.id,
      interactive: true,
      padding: "12px",
      onClick: () => onTool(t.id)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: "var(--radius-md)",
        background: "hsl(var(--primary-soft))",
        color: "hsl(var(--primary))",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: cat.icon,
      size: 16
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-medium)",
        color: "hsl(var(--text-strong))"
      }
    }, t.name), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: "var(--text-xs)",
        color: "hsl(var(--text-muted))",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, t.desc))))))));
  }
  window.TBCatalog = Catalog;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Catalog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/CommandPalette.jsx
try { (() => {
/* Command palette — ⌘K overlay. Fuzzy-ish filter over the tool catalog. */
(function () {
  const {
    Kbd
  } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;
  function CommandPalette({
    open,
    onClose,
    onSelect
  }) {
    const [q, setQ] = React.useState("");
    const inputRef = React.useRef(null);
    React.useEffect(() => {
      if (open) {
        setQ("");
        setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
      }
    }, [open]);
    if (!open) return null;
    const tools = window.TB_TOOLS;
    const results = q.trim() ? tools.filter(t => (t.name + " " + t.desc).toLowerCase().includes(q.toLowerCase())) : tools.slice(0, 7);
    return /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      className: "tb-enter-fade",
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "hsl(var(--overlay) / 0.5)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh"
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: e => e.stopPropagation(),
      className: "tb-enter-scale",
      style: {
        width: 560,
        maxWidth: "92vw",
        background: "hsl(var(--surface-2))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-xl)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 16px",
        borderBottom: "1px solid hsl(var(--border))"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-faint))",
        display: "inline-flex"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 18
    })), /*#__PURE__*/React.createElement("input", {
      ref: inputRef,
      value: q,
      onChange: e => setQ(e.target.value),
      placeholder: "Search tools, actions, snippets\u2026",
      style: {
        flex: 1,
        border: "none",
        outline: "none",
        background: "transparent",
        color: "hsl(var(--text-strong))",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-md)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: "hsl(var(--text-faint))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-xs)",
        padding: "2px 6px"
      }
    }, "ESC")), /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: 340,
        overflowY: "auto",
        padding: 8
      }
    }, results.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "20px",
        textAlign: "center",
        color: "hsl(var(--text-faint))",
        fontSize: "var(--text-sm)"
      }
    }, "No matches for \u201C", q, "\u201D"), results.map((t, i) => {
      const c = window.TB_CATEGORIES.find(x => x.id === t.cat);
      return /*#__PURE__*/React.createElement("button", {
        key: t.id,
        onClick: () => {
          onSelect(t.id);
          onClose();
        },
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "9px 10px",
          textAlign: "left",
          background: i === 0 ? "hsl(var(--primary-soft))" : "transparent",
          border: "none",
          borderRadius: "var(--radius-md)",
          cursor: "pointer"
        },
        onMouseEnter: e => {
          if (i !== 0) e.currentTarget.style.background = "hsl(var(--elevate-1))";
        },
        onMouseLeave: e => {
          if (i !== 0) e.currentTarget.style.background = "transparent";
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: "var(--radius-md)",
          background: "hsl(var(--surface-3))",
          color: "hsl(var(--primary))"
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: c.icon,
        size: 16
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: "block",
          fontSize: "var(--text-base)",
          fontWeight: "var(--weight-medium)",
          color: "hsl(var(--text-strong))"
        }
      }, t.name), /*#__PURE__*/React.createElement("span", {
        style: {
          display: "block",
          fontSize: "var(--text-xs)",
          color: "hsl(var(--text-muted))"
        }
      }, t.desc)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "hsl(var(--text-faint))",
          textTransform: "uppercase"
        }
      }, c.label.split(" ")[0]));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "9px 16px",
        borderTop: "1px solid hsl(var(--border))",
        color: "hsl(var(--text-faint))",
        fontSize: "var(--text-xs)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5
      }
    }, /*#__PURE__*/React.createElement(Kbd, null, "\u2191"), /*#__PURE__*/React.createElement(Kbd, null, "\u2193"), " navigate"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5
      }
    }, /*#__PURE__*/React.createElement(Kbd, null, "\u21B5"), " open"), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 5
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 12
    }), " local only"))));
  }
  window.TBCommandPalette = CommandPalette;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/CommandPalette.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/EditorView.jsx
try { (() => {
/* Editor view — tab strip + input/output split for the JSON Formatter,
   with live validation, syntax-tinted output with line numbers, and a
   piping strip. Reports status up via onStatus. */
(function () {
  const {
    Button,
    IconButton,
    Badge,
    Textarea,
    Tooltip
  } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;
  const SAMPLE = `{"workspace":"API Debug","tools":["JSON","JWT","Base64"],"density":"comfortable","localFirst":true}`;
  function esc(s) {
    return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function tint(code) {
    let out = esc(code);
    out = out.replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span style="color:hsl(var(--code-key))">$1</span><span style="color:hsl(var(--code-punc))">$2</span>');
    out = out.replace(/(:\s*)("(?:[^"\\]|\\.)*")/g, '$1<span style="color:hsl(var(--code-string))">$2</span>');
    out = out.replace(/\b(-?\d+\.?\d*)\b/g, '<span style="color:hsl(var(--code-number))">$1</span>');
    out = out.replace(/\b(true|false|null)\b/g, '<span style="color:hsl(var(--code-keyword))">$1</span>');
    return out;
  }
  function PanelHeader({
    title,
    badge,
    action
  }) {
    return /*#__PURE__*/React.createElement("header", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 36,
        padding: "0 10px",
        flexShrink: 0,
        borderBottom: "1px solid hsl(var(--border-faint))",
        background: "hsl(var(--surface-1))",
        borderTopLeftRadius: "var(--radius-lg)",
        borderTopRightRadius: "var(--radius-lg)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-semibold)",
        color: "hsl(var(--text-strong))"
      }
    }, title), badge), action);
  }
  function TabStrip({
    tabs,
    activeTab,
    onTab,
    onClose,
    onAdd
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
        padding: "6px 12px 0",
        borderBottom: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-0))",
        flexShrink: 0
      }
    }, tabs.map(t => {
      const active = t.id === activeTab;
      return /*#__PURE__*/React.createElement("button", {
        key: t.id,
        onClick: () => onTab(t.id),
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          height: 32,
          padding: "0 10px",
          background: active ? "hsl(var(--surface-2))" : "transparent",
          color: active ? "hsl(var(--text-strong))" : "hsl(var(--text-muted))",
          border: "1px solid " + (active ? "hsl(var(--border))" : "transparent"),
          borderBottom: "none",
          borderTopLeftRadius: "var(--radius-md)",
          borderTopRightRadius: "var(--radius-md)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--weight-medium)",
          cursor: "pointer",
          position: "relative"
        }
      }, active && /*#__PURE__*/React.createElement("span", {
        style: {
          position: "absolute",
          top: -1,
          left: 6,
          right: 6,
          height: 2,
          borderRadius: 2,
          background: "hsl(var(--primary))"
        }
      }), t.label, /*#__PURE__*/React.createElement("span", {
        onClick: e => {
          e.stopPropagation();
          onClose(t.id);
        },
        style: {
          color: "hsl(var(--text-faint))",
          display: "inline-flex",
          lineHeight: 0
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "x",
        size: 11
      })));
    }), /*#__PURE__*/React.createElement("button", {
      onClick: onAdd,
      title: "Open another tool",
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        marginBottom: 2,
        background: "transparent",
        border: "none",
        borderRadius: "var(--radius-md)",
        color: "hsl(var(--text-muted))",
        cursor: "pointer",
        fontSize: 15,
        fontFamily: "var(--font-sans)"
      }
    }, "+"));
  }
  function EditorView({
    onStatus
  }) {
    const [input, setInput] = React.useState(JSON.stringify(JSON.parse(SAMPLE), null, 2));
    const [output, setOutput] = React.useState("");
    const [valid, setValid] = React.useState(true);
    React.useEffect(() => {
      if (!input.trim()) {
        setOutput("");
        setValid(null);
        onStatus?.({
          valid: null,
          bytes: 0
        });
        return;
      }
      try {
        const obj = JSON.parse(input);
        const sorted = window.TB_OPTIONS?.sortKeys ? sortDeep(obj) : obj;
        const out = JSON.stringify(sorted, null, window.TB_OPTIONS?.indent ?? 2);
        setOutput(out);
        setValid(true);
        onStatus?.({
          valid: true,
          bytes: new Blob([input]).size
        });
      } catch (e) {
        setOutput(e.message);
        setValid(false);
        onStatus?.({
          valid: false,
          bytes: new Blob([input]).size
        });
      }
    }, [input]);
    const lines = valid ? output.split("\n") : [];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        padding: 12,
        minHeight: 0
      }
    }, /*#__PURE__*/React.createElement("section", {
      style: {
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-lg)",
        background: "hsl(var(--surface-0))",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement(PanelHeader, {
      title: "Input",
      badge: /*#__PURE__*/React.createElement(Badge, {
        tone: "primary"
      }, "detected JSON"),
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        onClick: () => setInput(JSON.stringify(JSON.parse(SAMPLE), null, 2))
      }, "Load sample")
    }), /*#__PURE__*/React.createElement("textarea", {
      value: input,
      onChange: e => setInput(e.target.value),
      spellCheck: false,
      placeholder: 'Paste anything — JSON, JWT, Base64, cron, SQL — ⌘V and Toolbit detects the tool.',
      style: {
        flex: 1,
        width: "100%",
        resize: "none",
        border: "none",
        outline: "none",
        background: "transparent",
        color: "hsl(var(--text-strong))",
        padding: "10px 12px",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        lineHeight: "var(--leading-relaxed)"
      }
    })), /*#__PURE__*/React.createElement("section", {
      style: {
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-lg)",
        background: "hsl(var(--surface-0))",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement(PanelHeader, {
      title: "Output",
      badge: valid === null ? null : /*#__PURE__*/React.createElement(Badge, {
        tone: valid ? "success" : "danger"
      }, valid ? "✓ valid object" : "✕ parse error"),
      action: /*#__PURE__*/React.createElement(Tooltip, {
        label: "Copy output",
        side: "left"
      }, /*#__PURE__*/React.createElement(IconButton, {
        size: "sm",
        title: "Copy"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "copy",
        size: 14
      })))
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: "auto",
        padding: "10px 0"
      }
    }, valid === false ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 12px",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        color: "hsl(var(--danger))"
      }
    }, output) : /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        lineHeight: "var(--leading-relaxed)"
      }
    }, lines.map((ln, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 42,
        flexShrink: 0,
        textAlign: "right",
        paddingRight: 14,
        color: "hsl(var(--text-faint))",
        userSelect: "none",
        fontSize: "var(--text-xs)",
        lineHeight: "inherit"
      }
    }, i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        whiteSpace: "pre",
        color: "hsl(var(--text-body))"
      },
      dangerouslySetInnerHTML: {
        __html: tint(ln) || "&nbsp;"
      }
    }))))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px 12px",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: "var(--text-xs)",
        color: "hsl(var(--text-muted))",
        fontWeight: "var(--weight-medium)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pipe",
      size: 14
    }), " Pipeline"), /*#__PURE__*/React.createElement(PipeNode, {
      active: true
    }, "JSON Formatter"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-faint))"
      }
    }, "\u2192"), /*#__PURE__*/React.createElement(PipeNode, null, "Base64 Encoder"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-faint))"
      }
    }, "\u2192"), /*#__PURE__*/React.createElement(PipeNode, null, "Snippet"), /*#__PURE__*/React.createElement(Badge, {
      tone: "warning",
      variant: "outline",
      style: {
        marginLeft: "auto"
      }
    }, "reversible")));
  }
  function PipeNode({
    children,
    active
  }) {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        height: 26,
        padding: "0 10px",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-medium)",
        fontFamily: "var(--font-sans)",
        background: active ? "hsl(var(--primary-soft))" : "hsl(var(--surface-2))",
        color: active ? "hsl(var(--primary))" : "hsl(var(--text-body))",
        border: `1px solid ${active ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))"}`
      }
    }, children);
  }
  function sortDeep(v) {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === "object") {
      return Object.keys(v).sort().reduce((acc, k) => {
        acc[k] = sortDeep(v[k]);
        return acc;
      }, {});
    }
    return v;
  }
  window.TBEditorView = EditorView;
  window.TBTabStrip = TabStrip;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/EditorView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Inspector.jsx
try { (() => {
/* Inspector — per-tool options, pipe targets, privacy note. Collapsible. */
(function () {
  const {
    Select,
    Checkbox,
    IconButton
  } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;
  function Inspector({
    onClose,
    options,
    onOptions
  }) {
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        width: "var(--inspector-width)",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        background: "hsl(var(--surface-1))",
        borderLeft: "1px solid hsl(var(--border))",
        padding: "0 16px 16px"
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "var(--header-height)"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-2xs)",
        letterSpacing: "var(--tracking-wider)",
        textTransform: "uppercase",
        color: "hsl(var(--text-faint))"
      }
    }, "Inspector"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: "var(--text-base)",
        fontWeight: "var(--weight-semibold)",
        color: "hsl(var(--text-strong))"
      }
    }, "JSON options")), /*#__PURE__*/React.createElement(IconButton, {
      size: "sm",
      title: "Close inspector",
      onClick: onClose
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 14
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 14,
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("label", {
      style: {
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-medium)",
        color: "hsl(var(--text-body))"
      }
    }, "Indent"), /*#__PURE__*/React.createElement(Select, {
      fullWidth: true,
      value: String(options.indent),
      onChange: e => onOptions({
        ...options,
        indent: Number(e.target.value)
      })
    }, /*#__PURE__*/React.createElement("option", {
      value: "2"
    }, "2 spaces"), /*#__PURE__*/React.createElement("option", {
      value: "4"
    }, "4 spaces"), /*#__PURE__*/React.createElement("option", {
      value: "8"
    }, "8 spaces"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      checked: options.sortKeys,
      onChange: v => onOptions({
        ...options,
        sortKeys: v
      }),
      label: "Sort keys"
    }), /*#__PURE__*/React.createElement(Checkbox, {
      checked: options.validate,
      onChange: v => onOptions({
        ...options,
        validate: v
      }),
      label: "Validate while typing"
    }), /*#__PURE__*/React.createElement(Checkbox, {
      checked: options.collapse,
      onChange: v => onOptions({
        ...options,
        collapse: v
      }),
      label: "Collapse large arrays"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 22
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-semibold)",
        letterSpacing: "var(--tracking-wider)",
        textTransform: "uppercase",
        color: "hsl(var(--text-muted))",
        marginBottom: 10
      }
    }, "Pipe output"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(PipeTarget, {
      mono: "64",
      tone: "var(--primary)",
      title: "Base64 Encoder",
      sub: "Open in split view"
    }), /*#__PURE__*/React.createElement(PipeTarget, {
      mono: "JT",
      tone: "var(--chart-4)",
      title: "JWT Decoder",
      sub: "Replace current output"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 22,
        padding: 12,
        borderRadius: "var(--radius-lg)",
        border: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-0))"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--success))",
        display: "inline-flex"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 14
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-semibold)",
        color: "hsl(var(--text-strong))"
      }
    }, "Local only")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: "var(--text-xs)",
        color: "hsl(var(--text-muted))",
        lineHeight: "var(--leading-snug)"
      }
    }, "Everything runs on this device. No network calls, no cookies, no telemetry \u2014 even piped workflows stay local.")));
  }
  function PipeTarget({
    mono,
    tone,
    title,
    sub
  }) {
    const [hover, setHover] = React.useState(false);
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 10px",
        textAlign: "left",
        background: hover ? "hsl(var(--elevate-1))" : "hsl(var(--surface-0))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        transition: "background-color var(--duration-fast) var(--ease-standard)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: "var(--radius-sm)",
        background: "hsl(var(--surface-2))",
        border: "1px solid hsl(var(--border-faint))",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        fontWeight: "var(--weight-semibold)",
        color: `hsl(${tone})`,
        flexShrink: 0
      }
    }, mono), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-medium)",
        color: "hsl(var(--text-strong))",
        fontFamily: "var(--font-sans)"
      }
    }, title), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: "var(--text-xs)",
        color: "hsl(var(--text-muted))",
        fontFamily: "var(--font-sans)"
      }
    }, sub)));
  }
  window.TBInspector = Inspector;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Inspector.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Sidebar.jsx
try { (() => {
/* Workspace sidebar — brand, command trigger, favorites (⌘1–3),
   workspaces, tool library (full catalog counts), snippets/history,
   privacy footer. */
(function () {
  const {
    SidebarItem,
    Badge,
    Kbd
  } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;
  const FAVORITES = [{
    id: "json-formatter",
    label: "JSON",
    kbd: "⌘1"
  }, {
    id: "jwt-decoder",
    label: "JWT",
    kbd: "⌘2"
  }, {
    id: "base64-encoder",
    label: "Base64",
    kbd: "⌘3"
  }];
  const WORKSPACES = [{
    id: "api-debug",
    label: "API Debug",
    tone: "var(--primary)"
  }, {
    id: "data-cleanup",
    label: "Data Cleanup",
    tone: "var(--success)"
  }, {
    id: "crypto",
    label: "Crypto",
    tone: "var(--warning)"
  }];
  function GroupTitle({
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 10px 5px",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-2xs)",
        letterSpacing: "var(--tracking-wider)",
        textTransform: "uppercase",
        color: "hsl(var(--text-faint))"
      }
    }, children);
  }
  function Sidebar({
    activeId,
    activeCat,
    onTool,
    onCategory,
    onSearch
  }) {
    const cats = window.TB_CATEGORIES;
    const tools = window.TB_TOOLS;
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        width: "var(--sidebar-width)",
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "hsl(var(--sidebar))",
        borderRight: "1px solid hsl(var(--border))"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        height: "var(--header-height)",
        padding: "0 14px",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.svg",
      width: "22",
      height: "22",
      alt: "",
      style: {
        borderRadius: 6
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--text-base)",
        fontWeight: "var(--weight-bold)",
        letterSpacing: "var(--tracking-tight)",
        color: "hsl(var(--text-strong))"
      }
    }, "tool", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--primary))"
      }
    }, "bit"))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 10px 10px"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onSearch,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        height: "var(--control-height)",
        padding: "0 9px",
        background: "hsl(var(--surface-0))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-md)",
        color: "hsl(var(--text-faint))",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 14
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        textAlign: "left"
      }
    }, "Command"), /*#__PURE__*/React.createElement(Kbd, null, "\u2318K"))), /*#__PURE__*/React.createElement("nav", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: "0 10px 10px",
        display: "grid",
        gap: 16,
        alignContent: "start"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(GroupTitle, null, "Favorites"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 1
      }
    }, FAVORITES.map(f => /*#__PURE__*/React.createElement(SidebarItem, {
      key: f.id,
      active: activeId === f.id,
      onClick: () => onTool(f.id),
      icon: /*#__PURE__*/React.createElement(Monogram, {
        id: f.id
      }),
      badge: /*#__PURE__*/React.createElement(Kbd, null, f.kbd)
    }, f.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(GroupTitle, null, "Workspaces"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 1
      }
    }, WORKSPACES.map(w => /*#__PURE__*/React.createElement(SidebarItem, {
      key: w.id,
      icon: /*#__PURE__*/React.createElement("span", {
        style: {
          width: 8,
          height: 8,
          borderRadius: "var(--radius-full)",
          background: `hsl(${w.tone})`,
          display: "inline-block"
        }
      })
    }, w.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(GroupTitle, null, "Tool Library"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 1
      }
    }, cats.map(c => /*#__PURE__*/React.createElement(SidebarItem, {
      key: c.id,
      active: activeCat === c.id,
      onClick: () => onCategory(c.id),
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: c.icon,
        size: 15
      }),
      badge: /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-2xs)",
          color: "hsl(var(--text-faint))"
        }
      }, tools.filter(t => t.cat === c.id).length)
    }, c.label))))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 10px",
        borderTop: "1px solid hsl(var(--border-faint))",
        display: "grid",
        gap: 1
      }
    }, /*#__PURE__*/React.createElement(SidebarItem, {
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "fileCode",
        size: 15
      })
    }, "Snippets"), /*#__PURE__*/React.createElement(SidebarItem, {
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "clock",
        size: 15
      })
    }, "History")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 14px 10px",
        borderTop: "1px solid hsl(var(--border-faint))",
        display: "flex",
        alignItems: "center",
        gap: 7,
        color: "hsl(var(--text-faint))"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--success))",
        display: "inline-flex"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 13
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--text-2xs)"
      }
    }, "Your data never leaves this device")));
  }

  /* Two-letter monogram chip used only for pinned favorites */
  function Monogram({
    id
  }) {
    const map = {
      "json-formatter": ["JS", "var(--warning)"],
      "jwt-decoder": ["JT", "var(--chart-4)"],
      "base64-encoder": ["64", "var(--primary)"]
    };
    const [txt, color] = map[id] || ["?", "var(--text-muted)"];
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: "var(--radius-sm)",
        background: "hsl(var(--surface-0))",
        border: "1px solid hsl(var(--border))",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        fontWeight: "var(--weight-semibold)",
        color: `hsl(${color})`
      }
    }, txt);
  }
  window.TBSidebar = Sidebar;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Statusbar.jsx
try { (() => {
/* Statusbar — privacy signal, validity, size, encoding, caret. */
(function () {
  const Icon = window.TBIcon;
  function Item({
    children,
    accent
  }) {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px",
        height: "100%",
        fontSize: "var(--text-2xs)",
        fontFamily: "var(--font-sans)",
        color: accent ? `hsl(${accent})` : "hsl(var(--text-muted))"
      }
    }, children);
  }
  function Statusbar({
    status
  }) {
    return /*#__PURE__*/React.createElement("footer", {
      style: {
        display: "flex",
        alignItems: "center",
        height: "var(--statusbar-height)",
        flexShrink: 0,
        borderTop: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-1))",
        padding: "0 6px"
      }
    }, /*#__PURE__*/React.createElement(Item, {
      accent: "var(--success)"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 12
    }), " Local \xB7 no network"), /*#__PURE__*/React.createElement(Divider, null), status.valid !== null && /*#__PURE__*/React.createElement(Item, {
      accent: status.valid ? "var(--success)" : "var(--danger)"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: "var(--radius-full)",
        background: "currentColor",
        display: "inline-block"
      }
    }), status.valid ? "Valid JSON" : "Invalid JSON"), /*#__PURE__*/React.createElement(Item, null, formatBytes(status.bytes)), /*#__PURE__*/React.createElement(Item, null, "UTF-8"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Item, null, /*#__PURE__*/React.createElement(Icon, {
      name: "pipe",
      size: 12
    }), " 3-step pipeline"), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(Item, null, "Ln ", status.ln ?? 1, ", Col ", status.col ?? 1));
  }
  function Divider() {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        width: 1,
        height: 14,
        background: "hsl(var(--border))"
      }
    });
  }
  function formatBytes(b) {
    if (!b) return "0 B";
    if (b < 1024) return b + " B";
    return (b / 1024).toFixed(1) + " KB";
  }
  window.TBStatusbar = Statusbar;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Statusbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Topbar.jsx
try { (() => {
/* Topbar — breadcrumb, density toggle, inspector/theme toggles, Run. */
(function () {
  const {
    Button,
    IconButton,
    Tabs,
    Tooltip
  } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;
  function Topbar({
    crumb,
    density,
    onDensity,
    onToggleInspector,
    theme,
    onToggleTheme,
    onRun
  }) {
    return /*#__PURE__*/React.createElement("header", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "var(--header-height)",
        padding: "0 12px",
        flexShrink: 0,
        borderBottom: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-0))"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-muted))",
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", null, crumb[0]), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-faint))"
      }
    }, "/"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-strong))",
        fontWeight: "var(--weight-semibold)"
      }
    }, crumb[1])), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      variant: "segment",
      value: density,
      onChange: onDensity,
      items: [{
        value: "compact",
        label: "Compact"
      }, {
        value: "comfortable",
        label: "Comfort"
      }]
    }), /*#__PURE__*/React.createElement(Tooltip, {
      label: "Toggle inspector",
      side: "bottom"
    }, /*#__PURE__*/React.createElement(IconButton, {
      title: "Toggle inspector",
      onClick: onToggleInspector
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "panelRight",
      size: 16
    }))), /*#__PURE__*/React.createElement(Tooltip, {
      label: "Toggle theme",
      side: "bottom"
    }, /*#__PURE__*/React.createElement(IconButton, {
      title: "Toggle theme",
      onClick: onToggleTheme
    }, /*#__PURE__*/React.createElement(Icon, {
      name: theme === "dark" ? "sun" : "moon",
      size: 16
    }))), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "play",
        size: 13
      }),
      onClick: onRun
    }, "Run pipeline")));
  }
  window.TBTopbar = Topbar;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Topbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/data.js
try { (() => {
/* Shared tool catalog for the Toolbit app UI kit. */
(function () {
  window.TB_CATEGORIES = [{
    id: "format",
    label: "Format & Validate",
    icon: "fileJson"
  }, {
    id: "encode",
    label: "Encode & Decode",
    icon: "lock"
  }, {
    id: "generate",
    label: "Generate",
    icon: "wand"
  }, {
    id: "transform",
    label: "Transform",
    icon: "swap"
  }, {
    id: "analyze",
    label: "Analyze",
    icon: "microscope"
  }, {
    id: "build",
    label: "Build",
    icon: "hammer"
  }, {
    id: "text",
    label: "Text & Docs",
    icon: "fileText"
  }];
  window.TB_TOOLS = [{
    id: "json-formatter",
    name: "JSON Formatter",
    cat: "format",
    desc: "Format, minify & validate JSON"
  }, {
    id: "yaml-formatter",
    name: "YAML Formatter",
    cat: "format",
    desc: "Format and validate YAML"
  }, {
    id: "xml-formatter",
    name: "XML Formatter",
    cat: "format",
    desc: "Pretty-print and validate XML"
  }, {
    id: "sql-formatter",
    name: "SQL Formatter",
    cat: "format",
    desc: "Format SQL queries"
  }, {
    id: "graphql-formatter",
    name: "GraphQL Formatter",
    cat: "format",
    desc: "Format GraphQL documents"
  }, {
    id: "base64-encoder",
    name: "Base64 Encoder",
    cat: "encode",
    desc: "Encode / decode Base64"
  }, {
    id: "url-encoder",
    name: "URL Encoder",
    cat: "encode",
    desc: "Encode / decode URLs"
  }, {
    id: "jwt-decoder",
    name: "JWT Decoder",
    cat: "encode",
    desc: "Decode & inspect JWTs"
  }, {
    id: "html-entities",
    name: "HTML Entities",
    cat: "encode",
    desc: "Escape / unescape HTML"
  }, {
    id: "uuid-generator",
    name: "UUID Generator",
    cat: "generate",
    desc: "Generate UUIDs v4 / v7"
  }, {
    id: "hash-generator",
    name: "Hash Generator",
    cat: "generate",
    desc: "MD5, SHA-1, SHA-256…"
  }, {
    id: "password-generator",
    name: "Password Generator",
    cat: "generate",
    desc: "Strong random passwords"
  }, {
    id: "qr-code",
    name: "QR Code",
    cat: "generate",
    desc: "Generate QR codes"
  }, {
    id: "csv-to-json",
    name: "CSV ↔ JSON",
    cat: "transform",
    desc: "Convert between CSV and JSON"
  }, {
    id: "case-converter",
    name: "Case Converter",
    cat: "transform",
    desc: "camelCase, snake_case…"
  }, {
    id: "timestamp",
    name: "Timestamp",
    cat: "transform",
    desc: "Unix ↔ human time"
  }, {
    id: "color-converter",
    name: "Color Converter",
    cat: "transform",
    desc: "HEX, RGB, HSL, OKLCH"
  }, {
    id: "diff-tool",
    name: "Diff Tool",
    cat: "analyze",
    desc: "Compare two texts"
  }, {
    id: "regex-tester",
    name: "Regex Tester",
    cat: "analyze",
    desc: "Test & explain regex"
  }, {
    id: "cron-parser",
    name: "Cron Parser",
    cat: "analyze",
    desc: "Explain cron expressions"
  }, {
    id: "api-builder",
    name: "API Request Builder",
    cat: "build",
    desc: "Compose HTTP requests"
  }, {
    id: "websocket-tester",
    name: "WebSocket Tester",
    cat: "build",
    desc: "Test WS connections"
  }, {
    id: "markdown",
    name: "Markdown Previewer",
    cat: "text",
    desc: "Live Markdown preview"
  }, {
    id: "word-counter",
    name: "Word Counter",
    cat: "text",
    desc: "Count words & chars"
  }];
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/app/icons.jsx
try { (() => {
/* Lucide-style icon set (subset used across the Toolbit UI kits).
   Matches the product's icon library: outline, rounded caps, ~2px stroke.
   Usage: <Icon name="fileJson" size={18} /> */
(function () {
  const P = {
    fileJson: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 18h.01"/><path d="M12 18h.01"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    wand: '<path d="m15 4-1-1M14.5 5.5 3 17a1.4 1.4 0 0 0 2 2L16.5 7.5ZM20 9l-1-1M9 4V2M9 6V4M4 9H2M6 9H4M17 17l3 3"/>',
    swap: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
    microscope: '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>',
    hammer: '<path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>',
    fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    sparkles: '<path d="M9.94 14.34A2 2 0 0 1 8.66 13L7 8 5.34 13a2 2 0 0 1-1.28 1.34L1 16l3.06 1.66A2 2 0 0 1 5.34 19L7 24l1.66-5a2 2 0 0 1 1.28-1.34L13 16Z" transform="scale(.7) translate(2 -1)"/><path d="M18 5l.9 2.6L21.5 8.5l-2.6.9L18 12l-.9-2.6L14.5 8.5l2.6-.9Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    star: '<path d="M11.5 2.8 14 8l5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4L9 8Z"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/><path d="m9 12 2 2 4-4"/>',
    wifiOff: '<path d="M12 20h.01"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M2 8.8a15.6 15.6 0 0 1 4.6-2.9"/><path d="M5 12.86a10 10 0 0 1 5.2-2.6"/><path d="M13.8 10.3a10 10 0 0 1 5.2 2.5"/><path d="M17.4 6a15.6 15.6 0 0 1 4.6 2.9"/><path d="m2 2 20 20"/>',
    keyboard: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    tree: '<path d="M12 13V7"/><path d="M18 21v-3a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v3"/><circle cx="12" cy="5" r="2"/><circle cx="6" cy="21" r="2"/><circle cx="18" cy="21" r="2"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    menu: '<path d="M4 12h16M4 6h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    fileCode: '<path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/><path d="M14 2v6h6"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>',
    braces: '<path d="M7 4a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2"/><path d="M17 4a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    play: '<path d="m6 4 13 8-13 8V4Z"/>',
    panelRight: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
    pipe: '<path d="M4 12h6"/><path d="m8 8 4 4-4 4"/><circle cx="18" cy="12" r="3"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z"/>'
  };
  function Icon({
    name,
    size = 18,
    strokeWidth = 2,
    style,
    ...rest
  }) {
    return React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flexShrink: 0,
        ...style
      },
      dangerouslySetInnerHTML: {
        __html: P[name] || ""
      },
      ...rest
    });
  }
  window.TBIcon = Icon;
  window.TB_ICON_PATHS = P;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/LandingPage.jsx
try { (() => {
/* Toolbit marketing landing page v2 — graphite/indigo workspace brand.
   Semantic HTML (header/main/section/footer, h1→h3) for SEO. */
(function () {
  const {
    Button,
    Tag,
    StatusPill,
    Badge,
    Kbd
  } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;
  const MiniWorkspace = window.TBMiniWorkspace;
  const CATEGORIES = [{
    title: "Format & Validate",
    icon: "fileJson",
    hue: "--chart-1",
    tools: ["JSON Formatter", "YAML Formatter", "XML Formatter", "SQL Formatter", "GraphQL"]
  }, {
    title: "Encode & Decode",
    icon: "lock",
    hue: "--chart-4",
    tools: ["Base64 Encoder", "URL Encoder", "JWT Decoder", "HTML Entities"]
  }, {
    title: "Generate",
    icon: "wand",
    hue: "--chart-3",
    tools: ["UUID Generator", "Hash Generator", "Password Generator", "QR Codes"]
  }, {
    title: "Transform",
    icon: "swap",
    hue: "--chart-5",
    tools: ["CSV ↔ JSON", "Case Converter", "Timestamp Converter", "Color Converter"]
  }, {
    title: "Analyze",
    icon: "microscope",
    hue: "--chart-2",
    tools: ["Regex Tester", "Diff Tool", "Cron Parser", "HTTP Status Codes"]
  }, {
    title: "Build",
    icon: "hammer",
    hue: "--danger",
    tools: ["API Request Builder", "WebSocket Tester", "Docker Builder"]
  }, {
    title: "Text & Docs",
    icon: "fileText",
    hue: "--text-muted",
    tools: ["Markdown Previewer", "Word Counter", "Whitespace Tools", "PDF Tools"]
  }];
  const FEATURES = [{
    icon: "pipe",
    title: "Pipe tools together",
    desc: "Send one tool's output straight into the next — decode a JWT, format the payload, diff it against yesterday's. Save chains as workflows."
  }, {
    icon: "keyboard",
    title: "Keyboard-first",
    desc: "⌘K opens anything. ⌘1–3 jump to favorites. Every action has a shortcut, because your hands shouldn't leave the keys."
  }, {
    icon: "sparkles",
    title: "Smart paste",
    desc: "Paste anything. Toolbit recognizes JSON, JWTs, Base64, cron expressions, timestamps, and colors — and opens the right tool."
  }, {
    icon: "panelRight",
    title: "An IDE, not a website",
    desc: "Tabs, split editors, an inspector, a status bar. Your context persists — workspaces, history, and snippets, all stored locally."
  }, {
    icon: "zap",
    title: "Offline by design",
    desc: "Install it as a PWA on desktop and mobile — no app store needed. Everything works in airplane mode, even in air-gapped rooms."
  }, {
    icon: "github",
    title: "Open source",
    desc: "Audit the code yourself. No accounts, no feature gates, no 'pro' tier. Free for everyone, forever."
  }];
  const CRAFT = [{
    title: "Dark-first graphite",
    desc: "Near-hueless surfaces with a single indigo accent. Depth comes from surface steps, not shadows.",
    demo: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, ["--surface-0", "--surface-1", "--surface-2", "--surface-3", "--primary"].map(v => /*#__PURE__*/React.createElement("span", {
      key: v,
      style: {
        flex: 1,
        height: 40,
        borderRadius: 6,
        background: `hsl(var(${v}))`,
        border: "1px solid hsl(var(--border))"
      }
    })))
  }, {
    title: "JetBrains Mono everywhere data lives",
    desc: "The only mono designed for IDE reading — unambiguous 0O 1lI, tuned for dense code.",
    demo: /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        lineHeight: 1.7
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--code-key))"
      }
    }, "\"privacy\""), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--code-punc))"
      }
    }, ": "), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--code-keyword))"
      }
    }, "true"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--code-punc))"
      }
    }, ", "), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--code-key))"
      }
    }, "\"0O1lI\""), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--code-punc))"
      }
    }, ": "), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--code-number))"
      }
    }, "0.01"))
  }, {
    title: "Density you control",
    desc: "Comfortable or compact — 32px or 28px controls. Your screen, your call.",
    demo: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 6
      }
    }, [32, 28].map(h => /*#__PURE__*/React.createElement("span", {
      key: h,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: h,
        padding: "0 10px",
        borderRadius: 6,
        border: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-2))",
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-body))"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fileJson",
      size: 14
    }), " JSON Formatter", /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: "hsl(var(--text-faint))"
      }
    }, h, "px"))))
  }];
  function Section({
    id,
    children,
    tint
  }) {
    return /*#__PURE__*/React.createElement("section", {
      id: id,
      style: {
        borderTop: "1px solid hsl(var(--border))",
        background: tint ? "hsl(var(--surface-1) / 0.5)" : "transparent"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "72px 32px"
      }
    }, children));
  }
  function H2({
    children,
    sub
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        marginBottom: 44
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: "var(--text-2xl)",
        fontWeight: "var(--weight-bold)",
        letterSpacing: "var(--tracking-tight)"
      }
    }, children), sub && /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: "var(--text-md)",
        color: "hsl(var(--text-muted))",
        marginTop: 8,
        maxWidth: 560,
        marginLeft: "auto",
        marginRight: "auto"
      }
    }, sub));
  }
  function LandingPage({
    theme,
    onToggleTheme
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: "100vh",
        background: "hsl(var(--surface-0))"
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-0) / 0.85)",
        backdropFilter: "blur(10px)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "0 32px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "#",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        textDecoration: "none"
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.svg",
      width: "28",
      height: "28",
      alt: "Toolbit logo"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--text-lg)",
        fontWeight: "var(--weight-bold)",
        letterSpacing: "var(--tracking-tight)",
        color: "hsl(var(--text-strong))"
      }
    }, "tool", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--primary))"
      }
    }, "bit"))), /*#__PURE__*/React.createElement("nav", {
      "aria-label": "Main",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 22,
        fontSize: "var(--text-sm)"
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "#tools",
      style: {
        color: "hsl(var(--text-muted))"
      }
    }, "Tools"), /*#__PURE__*/React.createElement("a", {
      href: "#why",
      style: {
        color: "hsl(var(--text-muted))"
      }
    }, "Why local-first"), /*#__PURE__*/React.createElement("a", {
      href: "#craft",
      style: {
        color: "hsl(var(--text-muted))"
      }
    }, "Design"), /*#__PURE__*/React.createElement("a", {
      href: "#",
      "aria-label": "GitHub",
      style: {
        color: "hsl(var(--text-muted))",
        display: "inline-flex"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "github",
      size: 18
    })), /*#__PURE__*/React.createElement("button", {
      onClick: onToggleTheme,
      "aria-label": "Toggle theme",
      title: "Toggle theme",
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        background: "transparent",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-md)",
        color: "hsl(var(--text-muted))",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: theme === "dark" ? "sun" : "moon",
      size: 14
    })), /*#__PURE__*/React.createElement(Button, null, "Launch app")))), /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
      style: {
        position: "relative",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        background: "radial-gradient(900px 400px at 20% -10%, hsl(var(--primary) / 0.09), transparent 70%)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "88px 32px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 56,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "tb-enter-slide-up",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        color: "hsl(var(--success))",
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 13
    }), " 100% local \xB7 zero telemetry \xB7 open source"), /*#__PURE__*/React.createElement("h1", {
      className: "tb-enter-slide-up",
      style: {
        animationDelay: "70ms",
        fontSize: "var(--text-4xl)",
        fontWeight: "var(--weight-bold)",
        letterSpacing: "var(--tracking-tighter)",
        lineHeight: 1.06,
        marginBottom: 18
      }
    }, "Developer tools that", /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        color: "hsl(var(--primary))"
      }
    }, "never phone home.")), /*#__PURE__*/React.createElement("p", {
      className: "tb-enter-slide-up",
      style: {
        animationDelay: "140ms",
        fontSize: "var(--text-md)",
        color: "hsl(var(--text-muted))",
        maxWidth: 520,
        marginBottom: 26,
        lineHeight: "var(--leading-normal)"
      }
    }, "Format JSON, decode JWTs, convert Base64, test regex, parse cron \u2014 40+ free developer tools in one keyboard-first workspace. Everything runs in your browser, installable as an app. Nothing you paste ever leaves your device."), /*#__PURE__*/React.createElement("div", {
      className: "tb-enter-slide-up",
      style: {
        animationDelay: "210ms",
        display: "flex",
        gap: 12,
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "arrowRight",
        size: 16
      })
    }, "Launch app \u2014 it's free"), /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      variant: "outline",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "download",
        size: 16
      })
    }, "Install as app (PWA)")), /*#__PURE__*/React.createElement("p", {
      className: "tb-enter-slide-up",
      style: {
        animationDelay: "280ms",
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-faint))"
      }
    }, "No signup. No cookies. Works offline. Press ", /*#__PURE__*/React.createElement(Kbd, null, "\u2318K"), " once inside \u2014 you'll get it.")), /*#__PURE__*/React.createElement("div", {
      className: "tb-enter-scale",
      style: {
        animationDelay: "180ms"
      }
    }, /*#__PURE__*/React.createElement(MiniWorkspace, null)))), /*#__PURE__*/React.createElement("section", {
      "aria-label": "Privacy",
      style: {
        borderTop: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-1) / 0.5)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "18px 32px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(StatusPill, {
      tone: "success",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "shield",
        size: 13
      })
    }, "No network calls"), /*#__PURE__*/React.createElement(StatusPill, {
      tone: "success",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "wifiOff",
        size: 13
      })
    }, "Works in airplane mode"), /*#__PURE__*/React.createElement(StatusPill, {
      tone: "neutral"
    }, "No accounts"), /*#__PURE__*/React.createElement(StatusPill, {
      tone: "neutral"
    }, "No analytics"), /*#__PURE__*/React.createElement(StatusPill, {
      tone: "neutral"
    }, "No cookies"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-muted))"
      }
    }, "Your data never leaves your device \u2014 that's the architecture, not a promise."))), /*#__PURE__*/React.createElement(Section, {
      id: "why"
    }, /*#__PURE__*/React.createElement(H2, {
      sub: "Most online dev tools are a textarea and an ad. Toolbit is a workspace \u2014 built the way you'd build it."
    }, "Why developers switch to Toolbit"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16
      }
    }, FEATURES.map((f, i) => /*#__PURE__*/React.createElement("article", {
      key: f.title,
      className: "reveal",
      style: {
        transitionDelay: `${i * 45}ms`,
        padding: 20,
        borderRadius: "var(--radius-lg)",
        border: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-1))"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: "var(--radius-md)",
        background: "hsl(var(--primary-soft))",
        color: "hsl(var(--primary))",
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: f.icon,
      size: 17
    })), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: "var(--text-md)",
        fontWeight: "var(--weight-semibold)",
        marginBottom: 6
      }
    }, f.title), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-muted))",
        lineHeight: "var(--leading-snug)"
      }
    }, f.desc))))), /*#__PURE__*/React.createElement(Section, {
      id: "tools",
      tint: true
    }, /*#__PURE__*/React.createElement(H2, {
      sub: "Free online (and offline) utilities for formatting, encoding, generating, transforming, and analyzing \u2014 organized the way you think."
    }, "40+ developer tools, one workspace"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14
      }
    }, CATEGORIES.map((c, i) => /*#__PURE__*/React.createElement("article", {
      key: c.title,
      className: "reveal",
      style: {
        transitionDelay: `${i * 40}ms`,
        padding: 18,
        borderRadius: "var(--radius-lg)",
        border: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-0))"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: "var(--radius-md)",
        background: `hsl(var(${c.hue}) / 0.13)`,
        color: `hsl(var(${c.hue}))`
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: c.icon,
      size: 16
    })), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: "var(--text-base)",
        fontWeight: "var(--weight-semibold)"
      }
    }, c.title), /*#__PURE__*/React.createElement(Badge, {
      style: {
        marginLeft: "auto"
      }
    }, c.tools.length, "+")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: "var(--text-sm)",
        lineHeight: 1.8
      }
    }, c.tools.map((t, i) => /*#__PURE__*/React.createElement(React.Fragment, {
      key: t
    }, /*#__PURE__*/React.createElement("a", {
      href: "#",
      style: {
        color: "hsl(var(--text-muted))",
        textDecoration: "none",
        borderBottom: "1px dotted hsl(var(--border-strong))"
      }
    }, t), i < c.tools.length - 1 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-faint))"
      }
    }, " \xB7 ")))))), /*#__PURE__*/React.createElement("article", {
      className: "reveal",
      style: {
        transitionDelay: "280ms",
        padding: 18,
        borderRadius: "var(--radius-lg)",
        border: "1px dashed hsl(var(--border-strong))",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: "var(--text-base)",
        fontWeight: "var(--weight-semibold)"
      }
    }, "Can't find one?"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-muted))"
      }
    }, "Toolbit is open source \u2014 request it, or build it."), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "sm",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "github",
        size: 14
      })
    }, "Open an issue")))), /*#__PURE__*/React.createElement(Section, {
      id: "craft"
    }, /*#__PURE__*/React.createElement(H2, {
      sub: "Graphite surfaces, one indigo accent, JetBrains Mono, 100\u2013150ms motion. Designed like an instrument, not a landing page."
    }, "Craft you can feel in the first keystroke"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16
      }
    }, CRAFT.map((c, i) => /*#__PURE__*/React.createElement("article", {
      key: c.title,
      className: "reveal",
      style: {
        transitionDelay: `${i * 45}ms`,
        padding: 20,
        borderRadius: "var(--radius-lg)",
        border: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-1))",
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", null, c.demo), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: "var(--text-base)",
        fontWeight: "var(--weight-semibold)",
        marginBottom: 5
      }
    }, c.title), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-muted))",
        lineHeight: "var(--leading-snug)"
      }
    }, c.desc)))))), /*#__PURE__*/React.createElement(Section, {
      tint: true
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 620,
        margin: "0 auto",
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: "var(--text-2xl)",
        fontWeight: "var(--weight-bold)",
        letterSpacing: "var(--tracking-tight)",
        marginBottom: 12
      }
    }, "Open it once. It's already installed."), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: "var(--text-md)",
        color: "hsl(var(--text-muted))",
        marginBottom: 26
      }
    }, "No signup, no download required \u2014 the web app is the full product. Add it to your dock or home screen as a PWA and it works offline."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        justifyContent: "center"
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "arrowRight",
        size: 16
      })
    }, "Launch Toolbit"), /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      variant: "outline",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "download",
        size: 16
      })
    }, "Install as PWA"))))), /*#__PURE__*/React.createElement("footer", {
      style: {
        borderTop: "1px solid hsl(var(--border))"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "40px 32px",
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
        gap: 24
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.svg",
      width: "20",
      height: "20",
      alt: "",
      style: {
        borderRadius: 5
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: "var(--weight-bold)",
        color: "hsl(var(--text-strong))"
      }
    }, "tool", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--primary))"
      }
    }, "bit"))), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: "var(--text-xs)",
        color: "hsl(var(--text-faint))",
        lineHeight: "var(--leading-snug)"
      }
    }, "Local-first developer tools.", /*#__PURE__*/React.createElement("br", null), "Made with care by developers, for developers.")), /*#__PURE__*/React.createElement(FooterCol, {
      title: "Popular tools",
      links: ["JSON Formatter", "JWT Decoder", "Base64 Encoder", "Regex Tester", "UUID Generator"]
    }), /*#__PURE__*/React.createElement(FooterCol, {
      title: "Product",
      links: ["Launch app", "Install as PWA", "Changelog", "GitHub"]
    }), /*#__PURE__*/React.createElement(FooterCol, {
      title: "Trust",
      links: ["Privacy policy", "Terms", "How local-first works", "Security"]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: "1px solid hsl(var(--border-faint))"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "14px 32px",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "var(--text-xs)",
        color: "hsl(var(--text-faint))"
      }
    }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Toolbit. Open source, MIT."), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 11
    }), " Your data never leaves your device")))));
  }
  function FooterCol({
    title,
    links
  }) {
    return /*#__PURE__*/React.createElement("nav", {
      "aria-label": title
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-semibold)",
        letterSpacing: "var(--tracking-wider)",
        textTransform: "uppercase",
        color: "hsl(var(--text-muted))",
        marginBottom: 10
      }
    }, title), /*#__PURE__*/React.createElement("ul", {
      style: {
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gap: 7
      }
    }, links.map(l => /*#__PURE__*/React.createElement("li", {
      key: l
    }, /*#__PURE__*/React.createElement("a", {
      href: "#",
      style: {
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-muted))",
        textDecoration: "none"
      }
    }, l)))));
  }
  window.TBLandingPage = LandingPage;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/LandingPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/MiniWorkspace.jsx
try { (() => {
/* MiniWorkspace — a scaled-down, static rendering of the Toolbit
   workspace used as the hero showcase on the marketing page. */
(function () {
  const Icon = window.TBIcon;
  const mono = {
    fontFamily: "var(--font-mono)"
  };
  const J = ({
    c,
    children
  }) => /*#__PURE__*/React.createElement("span", {
    style: {
      color: `hsl(var(--code-${c}))`
    }
  }, children);
  function Row({
    label,
    icon,
    active
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 22,
        padding: "0 7px",
        borderRadius: 4,
        fontSize: 10,
        background: active ? "hsl(var(--primary-soft))" : "transparent",
        color: active ? "hsl(var(--primary))" : "hsl(var(--text-muted))",
        fontWeight: active ? 500 : 400
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 11
    }), label);
  }
  function MiniWorkspace() {
    return /*#__PURE__*/React.createElement("div", {
      "aria-hidden": "true",
      style: {
        borderRadius: "var(--radius-xl)",
        border: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-0))",
        boxShadow: "var(--shadow-xl)",
        overflow: "hidden",
        fontFamily: "var(--font-sans)",
        userSelect: "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 34,
        padding: "0 10px",
        borderBottom: "1px solid hsl(var(--border))"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        color: "hsl(var(--text-muted))"
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.svg",
      width: "14",
      height: "14",
      alt: "",
      style: {
        borderRadius: 4
      }
    }), /*#__PURE__*/React.createElement("span", null, "API Debug"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-faint))"
      }
    }, "/"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-strong))",
        fontWeight: 600
      }
    }, "JSON Formatter")), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        height: 20,
        padding: "0 8px",
        borderRadius: 5,
        background: "hsl(var(--primary))",
        color: "#fff",
        fontSize: 9.5,
        fontWeight: 500
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "play",
      size: 9
    }), " Run pipeline")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 118,
        flexShrink: 0,
        borderRight: "1px solid hsl(var(--border))",
        background: "hsl(var(--sidebar))",
        padding: "8px 6px",
        display: "grid",
        gap: 2,
        alignContent: "start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...mono,
        fontSize: 7.5,
        letterSpacing: "0.08em",
        color: "hsl(var(--text-faint))",
        padding: "0 7px 3px",
        textTransform: "uppercase"
      }
    }, "Favorites"), /*#__PURE__*/React.createElement(Row, {
      label: "JSON",
      icon: "fileJson",
      active: true
    }), /*#__PURE__*/React.createElement(Row, {
      label: "JWT",
      icon: "lock"
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Base64",
      icon: "swap"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        ...mono,
        fontSize: 7.5,
        letterSpacing: "0.08em",
        color: "hsl(var(--text-faint))",
        padding: "6px 7px 3px",
        textTransform: "uppercase"
      }
    }, "Library"), /*#__PURE__*/React.createElement(Row, {
      label: "Generate",
      icon: "wand"
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Analyze",
      icon: "microscope"
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Build",
      icon: "hammer"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 2,
        padding: "5px 8px 0",
        borderBottom: "1px solid hsl(var(--border))"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        fontSize: 10,
        fontWeight: 500,
        padding: "4px 9px",
        background: "hsl(var(--surface-2))",
        border: "1px solid hsl(var(--border))",
        borderBottom: "none",
        borderRadius: "5px 5px 0 0",
        color: "hsl(var(--text-strong))"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        top: -1,
        left: 5,
        right: 5,
        height: 2,
        borderRadius: 2,
        background: "hsl(var(--primary))"
      }
    }), "JSON"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "4px 9px",
        color: "hsl(var(--text-muted))"
      }
    }, "Base64"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: "4px 6px",
        color: "hsl(var(--text-faint))"
      }
    }, "+")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        padding: 6
      }
    }, ["Input", "Output"].map((title, i) => /*#__PURE__*/React.createElement("div", {
      key: title,
      style: {
        border: "1px solid hsl(var(--border))",
        borderRadius: 6,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 7px",
        background: "hsl(var(--surface-1))",
        borderBottom: "1px solid hsl(var(--border-faint))"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 600,
        color: "hsl(var(--text-strong))"
      }
    }, title), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8,
        color: i ? "hsl(var(--success))" : "hsl(var(--primary))"
      }
    }, i ? "✓ valid" : "detected JSON")), /*#__PURE__*/React.createElement("div", {
      style: {
        ...mono,
        fontSize: 9,
        lineHeight: 1.7,
        padding: "6px 8px",
        whiteSpace: "pre"
      }
    }, /*#__PURE__*/React.createElement(J, {
      c: "punc"
    }, "{"), "\n  ", /*#__PURE__*/React.createElement(J, {
      c: "key"
    }, "\"tool\""), /*#__PURE__*/React.createElement(J, {
      c: "punc"
    }, ": "), /*#__PURE__*/React.createElement(J, {
      c: "string"
    }, "\"json\""), /*#__PURE__*/React.createElement(J, {
      c: "punc"
    }, ","), "\n  ", /*#__PURE__*/React.createElement(J, {
      c: "key"
    }, "\"local\""), /*#__PURE__*/React.createElement(J, {
      c: "punc"
    }, ": "), /*#__PURE__*/React.createElement(J, {
      c: "keyword"
    }, "true"), /*#__PURE__*/React.createElement(J, {
      c: "punc"
    }, ","), "\n  ", /*#__PURE__*/React.createElement(J, {
      c: "key"
    }, "\"ms\""), /*#__PURE__*/React.createElement(J, {
      c: "punc"
    }, ": "), /*#__PURE__*/React.createElement(J, {
      c: "number"
    }, "0.4"), "\n", /*#__PURE__*/React.createElement(J, {
      c: "punc"
    }, "}"), i === 0 && /*#__PURE__*/React.createElement("span", {
      className: "tb-cursor-blink",
      style: {
        display: "inline-block",
        width: 5,
        height: 10,
        marginLeft: 2,
        borderRadius: 1,
        background: "hsl(var(--primary))",
        verticalAlign: "-1px"
      }
    }))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "0 8px 7px",
        fontSize: 8.5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        color: "hsl(var(--text-muted))"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pipe",
      size: 9
    }), " Pipeline"), /*#__PURE__*/React.createElement("span", {
      style: {
        padding: "2px 6px",
        borderRadius: 4,
        background: "hsl(var(--primary-soft))",
        color: "hsl(var(--primary))",
        border: "1px solid hsl(var(--primary) / .35)"
      }
    }, "JSON"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-faint))"
      }
    }, "\u2192"), /*#__PURE__*/React.createElement("span", {
      style: {
        padding: "2px 6px",
        borderRadius: 4,
        background: "hsl(var(--surface-2))",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--text-body))"
      }
    }, "Base64"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-faint))"
      }
    }, "\u2192"), /*#__PURE__*/React.createElement("span", {
      style: {
        padding: "2px 6px",
        borderRadius: 4,
        background: "hsl(var(--surface-2))",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--text-body))"
      }
    }, "Snippet")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 20,
        padding: "0 8px",
        borderTop: "1px solid hsl(var(--border))",
        background: "hsl(var(--surface-1))",
        fontSize: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        color: "hsl(var(--success))"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 9
    }), " Local \xB7 no network"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-muted))"
      }
    }, "Valid JSON"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "hsl(var(--text-muted))"
      }
    }, "UTF-8"), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        color: "hsl(var(--text-muted))"
      }
    }, "Ln 4, Col 12")))));
  }
  window.TBMiniWorkspace = MiniWorkspace;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/MiniWorkspace.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Kbd = __ds_scope.Kbd;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.SidebarItem = __ds_scope.SidebarItem;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CodeBlock = __ds_scope.CodeBlock;

__ds_ns.StatusPill = __ds_scope.StatusPill;

})();
