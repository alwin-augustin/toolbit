/* Toolbit marketing landing page v2 — graphite/indigo workspace brand.
   Semantic HTML (header/main/section/footer, h1→h3) for SEO. */
(function () {
  const { Button, Tag, StatusPill, Badge, Kbd } = window.ToolbitDesignSystem_4ae95c;
  const Icon = window.TBIcon;
  const MiniWorkspace = window.TBMiniWorkspace;

  const CATEGORIES = [
    { title: "Format & Validate", icon: "fileJson", hue: "--chart-1", tools: ["JSON Formatter", "YAML Formatter", "XML Formatter", "SQL Formatter", "GraphQL"] },
    { title: "Encode & Decode", icon: "lock", hue: "--chart-4", tools: ["Base64 Encoder", "URL Encoder", "JWT Decoder", "HTML Entities"] },
    { title: "Generate", icon: "wand", hue: "--chart-3", tools: ["UUID Generator", "Hash Generator", "Password Generator", "QR Codes"] },
    { title: "Transform", icon: "swap", hue: "--chart-5", tools: ["CSV ↔ JSON", "Case Converter", "Timestamp Converter", "Color Converter"] },
    { title: "Analyze", icon: "microscope", hue: "--chart-2", tools: ["Regex Tester", "Diff Tool", "Cron Parser", "HTTP Status Codes"] },
    { title: "Build", icon: "hammer", hue: "--danger", tools: ["API Request Builder", "WebSocket Tester", "Docker Builder"] },
    { title: "Text & Docs", icon: "fileText", hue: "--text-muted", tools: ["Markdown Previewer", "Word Counter", "Whitespace Tools", "PDF Tools"] },
  ];

  const FEATURES = [
    { icon: "pipe", title: "Pipe tools together", desc: "Send one tool's output straight into the next — decode a JWT, format the payload, diff it against yesterday's. Save chains as workflows." },
    { icon: "keyboard", title: "Keyboard-first", desc: "⌘K opens anything. ⌘1–3 jump to favorites. Every action has a shortcut, because your hands shouldn't leave the keys." },
    { icon: "sparkles", title: "Smart paste", desc: "Paste anything. Toolbit recognizes JSON, JWTs, Base64, cron expressions, timestamps, and colors — and opens the right tool." },
    { icon: "panelRight", title: "An IDE, not a website", desc: "Tabs, split editors, an inspector, a status bar. Your context persists — workspaces, history, and snippets, all stored locally." },
    { icon: "zap", title: "Offline by design", desc: "Install it as a PWA on desktop and mobile — no app store needed. Everything works in airplane mode, even in air-gapped rooms." },
    { icon: "github", title: "Open source", desc: "Audit the code yourself. No accounts, no feature gates, no 'pro' tier. Free for everyone, forever." },
  ];

  const CRAFT = [
    {
      title: "Dark-first graphite",
      desc: "Near-hueless surfaces with a single indigo accent. Depth comes from surface steps, not shadows.",
      demo: (
        <div style={{ display: "flex", gap: 6 }}>
          {["--surface-0", "--surface-1", "--surface-2", "--surface-3", "--primary"].map((v) => (
            <span key={v} style={{ flex: 1, height: 40, borderRadius: 6, background: `hsl(var(${v}))`, border: "1px solid hsl(var(--border))" }} />
          ))}
        </div>
      ),
    },
    {
      title: "JetBrains Mono everywhere data lives",
      desc: "The only mono designed for IDE reading — unambiguous 0O 1lI, tuned for dense code.",
      demo: (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
          <span style={{ color: "hsl(var(--code-key))" }}>"privacy"</span>
          <span style={{ color: "hsl(var(--code-punc))" }}>: </span>
          <span style={{ color: "hsl(var(--code-keyword))" }}>true</span>
          <span style={{ color: "hsl(var(--code-punc))" }}>, </span>
          <span style={{ color: "hsl(var(--code-key))" }}>"0O1lI"</span>
          <span style={{ color: "hsl(var(--code-punc))" }}>: </span>
          <span style={{ color: "hsl(var(--code-number))" }}>0.01</span>
        </div>
      ),
    },
    {
      title: "Density you control",
      desc: "Comfortable or compact — 32px or 28px controls. Your screen, your call.",
      demo: (
        <div style={{ display: "grid", gap: 6 }}>
          {[32, 28].map((h) => (
            <span key={h} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: h, padding: "0 10px", borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--surface-2))", fontSize: "var(--text-sm)", color: "hsl(var(--text-body))" }}>
              <Icon name="fileJson" size={14} /> JSON Formatter
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "hsl(var(--text-faint))" }}>{h}px</span>
            </span>
          ))}
        </div>
      ),
    },
  ];

  function Section({ id, children, tint }) {
    return (
      <section id={id} style={{ borderTop: "1px solid hsl(var(--border))", background: tint ? "hsl(var(--surface-1) / 0.5)" : "transparent" }}>
        <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "72px 32px" }}>{children}</div>
      </section>
    );
  }

  function H2({ children, sub }) {
    return (
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)" }}>{children}</h2>
        {sub && <p style={{ fontSize: "var(--text-md)", color: "hsl(var(--text-muted))", marginTop: 8, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>{sub}</p>}
      </div>
    );
  }

  function LandingPage({ theme, onToggleTheme }) {
    return (
      <div style={{ minHeight: "100vh", background: "hsl(var(--surface-0))" }}>
        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 20, borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--surface-0) / 0.85)", backdropFilter: "blur(10px)" }}>
          <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="#" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
              <img src="../../assets/logo-mark.svg" width="28" height="28" alt="Toolbit logo" />
              <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "hsl(var(--text-strong))" }}>tool<span style={{ color: "hsl(var(--primary))" }}>bit</span></span>
            </a>
            <nav aria-label="Main" style={{ display: "flex", alignItems: "center", gap: 22, fontSize: "var(--text-sm)" }}>
              <a href="#tools" style={{ color: "hsl(var(--text-muted))" }}>Tools</a>
              <a href="#why" style={{ color: "hsl(var(--text-muted))" }}>Why local-first</a>
              <a href="#craft" style={{ color: "hsl(var(--text-muted))" }}>Design</a>
              <a href="#" aria-label="GitHub" style={{ color: "hsl(var(--text-muted))", display: "inline-flex" }}><Icon name="github" size={18} /></a>
              <button onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle theme" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "transparent", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-md)", color: "hsl(var(--text-muted))", cursor: "pointer" }}><Icon name={theme === "dark" ? "sun" : "moon"} size={14} /></button>
              <Button>Launch app</Button>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(900px 400px at 20% -10%, hsl(var(--primary) / 0.09), transparent 70%)" }} />
            <div style={{ position: "relative", maxWidth: "var(--container-max)", margin: "0 auto", padding: "88px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
              <div>
                <p className="tb-enter-slide-up" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "hsl(var(--success))", marginBottom: 18 }}>
                  <Icon name="shield" size={13} /> 100% local · zero telemetry · open source
                </p>
                <h1 className="tb-enter-slide-up" style={{ animationDelay: "70ms", fontSize: "var(--text-4xl)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tighter)", lineHeight: 1.06, marginBottom: 18 }}>
                  Developer tools that
                  <span style={{ display: "block", color: "hsl(var(--primary))" }}>never phone home.</span>
                </h1>
                <p className="tb-enter-slide-up" style={{ animationDelay: "140ms", fontSize: "var(--text-md)", color: "hsl(var(--text-muted))", maxWidth: 520, marginBottom: 26, lineHeight: "var(--leading-normal)" }}>
                  Format JSON, decode JWTs, convert Base64, test regex, parse cron — 40+ free developer
                  tools in one keyboard-first workspace. Everything runs in your browser, installable
                  as an app. Nothing you paste ever leaves your device.
                </p>
                <div className="tb-enter-slide-up" style={{ animationDelay: "210ms", display: "flex", gap: 12, marginBottom: 18 }}>
                  <Button size="lg" iconRight={<Icon name="arrowRight" size={16} />}>Launch app — it's free</Button>
                  <Button size="lg" variant="outline" iconLeft={<Icon name="download" size={16} />}>Install as app (PWA)</Button>
                </div>
                <p className="tb-enter-slide-up" style={{ animationDelay: "280ms", fontSize: "var(--text-sm)", color: "hsl(var(--text-faint))" }}>
                  No signup. No cookies. Works offline. Press <Kbd>⌘K</Kbd> once inside — you'll get it.
                </p>
              </div>
              <div className="tb-enter-scale" style={{ animationDelay: "180ms" }}><MiniWorkspace /></div>
            </div>
          </section>

          {/* Privacy band */}
          <section aria-label="Privacy" style={{ borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--surface-1) / 0.5)" }}>
            <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "18px 32px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <StatusPill tone="success" icon={<Icon name="shield" size={13} />}>No network calls</StatusPill>
              <StatusPill tone="success" icon={<Icon name="wifiOff" size={13} />}>Works in airplane mode</StatusPill>
              <StatusPill tone="neutral">No accounts</StatusPill>
              <StatusPill tone="neutral">No analytics</StatusPill>
              <StatusPill tone="neutral">No cookies</StatusPill>
              <span style={{ fontSize: "var(--text-sm)", color: "hsl(var(--text-muted))" }}>Your data never leaves your device — that's the architecture, not a promise.</span>
            </div>
          </section>

          {/* Why / features */}
          <Section id="why">
            <H2 sub="Most online dev tools are a textarea and an ad. Toolbit is a workspace — built the way you'd build it.">Why developers switch to Toolbit</H2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {FEATURES.map((f, i) => (
                <article key={f.title} className="reveal" style={{ transitionDelay: `${i * 45}ms`, padding: 20, borderRadius: "var(--radius-lg)", border: "1px solid hsl(var(--border))", background: "hsl(var(--surface-1))" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "var(--radius-md)", background: "hsl(var(--primary-soft))", color: "hsl(var(--primary))", marginBottom: 12 }}><Icon name={f.icon} size={17} /></span>
                  <h3 style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)", marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "hsl(var(--text-muted))", lineHeight: "var(--leading-snug)" }}>{f.desc}</p>
                </article>
              ))}
            </div>
          </Section>

          {/* Tools catalog */}
          <Section id="tools" tint>
            <H2 sub="Free online (and offline) utilities for formatting, encoding, generating, transforming, and analyzing — organized the way you think.">40+ developer tools, one workspace</H2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {CATEGORIES.map((c, i) => (
                <article key={c.title} className="reveal" style={{ transitionDelay: `${i * 40}ms`, padding: 18, borderRadius: "var(--radius-lg)", border: "1px solid hsl(var(--border))", background: "hsl(var(--surface-0))" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "var(--radius-md)", background: `hsl(var(${c.hue}) / 0.13)`, color: `hsl(var(${c.hue}))` }}><Icon name={c.icon} size={16} /></span>
                    <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)" }}>{c.title}</h3>
                    <Badge style={{ marginLeft: "auto" }}>{c.tools.length}+</Badge>
                  </div>
                  <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.8 }}>
                    {c.tools.map((t, i) => (
                      <React.Fragment key={t}>
                        <a href="#" style={{ color: "hsl(var(--text-muted))", textDecoration: "none", borderBottom: "1px dotted hsl(var(--border-strong))" }}>{t}</a>
                        {i < c.tools.length - 1 && <span style={{ color: "hsl(var(--text-faint))" }}> · </span>}
                      </React.Fragment>
                    ))}
                  </p>
                </article>
              ))}
              <article className="reveal" style={{ transitionDelay: "280ms", padding: 18, borderRadius: "var(--radius-lg)", border: "1px dashed hsl(var(--border-strong))", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)" }}>Can't find one?</h3>
                <p style={{ fontSize: "var(--text-sm)", color: "hsl(var(--text-muted))" }}>Toolbit is open source — request it, or build it.</p>
                <Button variant="outline" size="sm" iconLeft={<Icon name="github" size={14} />}>Open an issue</Button>
              </article>
            </div>
          </Section>

          {/* Design craft */}
          <Section id="craft">
            <H2 sub="Graphite surfaces, one indigo accent, JetBrains Mono, 100–150ms motion. Designed like an instrument, not a landing page.">Craft you can feel in the first keystroke</H2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {CRAFT.map((c, i) => (
                <article key={c.title} className="reveal" style={{ transitionDelay: `${i * 45}ms`, padding: 20, borderRadius: "var(--radius-lg)", border: "1px solid hsl(var(--border))", background: "hsl(var(--surface-1))", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>{c.demo}</div>
                  <div>
                    <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", marginBottom: 5 }}>{c.title}</h3>
                    <p style={{ fontSize: "var(--text-sm)", color: "hsl(var(--text-muted))", lineHeight: "var(--leading-snug)" }}>{c.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </Section>

          {/* CTA */}
          <Section tint>
            <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
              <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", marginBottom: 12 }}>Open it once. It's already installed.</h2>
              <p style={{ fontSize: "var(--text-md)", color: "hsl(var(--text-muted))", marginBottom: 26 }}>
                No signup, no download required — the web app is the full product. Add it to your dock
                or home screen as a PWA and it works offline.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <Button size="lg" iconRight={<Icon name="arrowRight" size={16} />}>Launch Toolbit</Button>
                <Button size="lg" variant="outline" iconLeft={<Icon name="download" size={16} />}>Install as PWA</Button>
              </div>
            </div>
          </Section>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "40px 32px", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <img src="../../assets/logo-mark.svg" width="20" height="20" alt="" style={{ borderRadius: 5 }} />
                <span style={{ fontWeight: "var(--weight-bold)", color: "hsl(var(--text-strong))" }}>tool<span style={{ color: "hsl(var(--primary))" }}>bit</span></span>
              </div>
              <p style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-faint))", lineHeight: "var(--leading-snug)" }}>
                Local-first developer tools.<br />Made with care by developers, for developers.
              </p>
            </div>
            <FooterCol title="Popular tools" links={["JSON Formatter", "JWT Decoder", "Base64 Encoder", "Regex Tester", "UUID Generator"]} />
            <FooterCol title="Product" links={["Launch app", "Install as PWA", "Changelog", "GitHub"]} />
            <FooterCol title="Trust" links={["Privacy policy", "Terms", "How local-first works", "Security"]} />
          </div>
          <div style={{ borderTop: "1px solid hsl(var(--border-faint))" }}>
            <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "14px 32px", display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "hsl(var(--text-faint))" }}>
              <span>© 2026 Toolbit. Open source, MIT.</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="shield" size={11} /> Your data never leaves your device</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  function FooterCol({ title, links }) {
    return (
      <nav aria-label={title}>
        <h3 style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase", color: "hsl(var(--text-muted))", marginBottom: 10 }}>{title}</h3>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7 }}>
          {links.map((l) => (
            <li key={l}><a href="#" style={{ fontSize: "var(--text-sm)", color: "hsl(var(--text-muted))", textDecoration: "none" }}>{l}</a></li>
          ))}
        </ul>
      </nav>
    );
  }

  window.TBLandingPage = LandingPage;
})();
