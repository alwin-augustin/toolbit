import { InstallApp } from '@/app/components/InstallApp';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { detectContentType } from '@/core/smart-detect';
import {
  IconJson as FileJson,
  IconDownload as Download,
  IconLock as Lock,
  IconBolt as Zap,
  IconPalette as Palette,
  IconArrowRight as ArrowRight,
  IconBrandGithub as Github,
  IconExternalLink as ExternalLink,
  IconWand as Wand2,
  IconArrowsLeftRight as ArrowRightLeft,
  IconMicroscope as Microscope,
  IconHammer as Hammer,
  IconFileText as FileText,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import appLogoUrl from '@/shared/ds/assets/logo-mark.svg';
import { applySeo } from '@/content/seo/use-seo';
import { TOOL_PAGES } from '@/content/seo/seo-content.js';

const toolCategories = [
  {
    title: 'Format & Validate',
    icon: FileJson,
    count: 8,
    description: 'JSON, YAML, XML, SQL, GraphQL, and config validators',
    link: '/json-formatter',
  },
  {
    title: 'Encode & Decode',
    icon: Lock,
    count: 6,
    description: 'Base64, URL, HTML, JWT, certificates, and protobuf',
    link: '/base64-encoder',
  },
  {
    title: 'Generate',
    icon: Wand2,
    count: 7,
    description: 'UUIDs, hashes, passwords, fake data, and QR codes',
    link: '/uuid-generator',
  },
  {
    title: 'Transform',
    icon: ArrowRightLeft,
    count: 7,
    description: 'Convert data formats and transform text',
    link: '/csv-to-json',
  },
  {
    title: 'Analyze',
    icon: Microscope,
    count: 6,
    description: 'Regex, diff, git patches, and cron insights',
    link: '/diff-tool',
  },
  {
    title: 'Build',
    icon: Hammer,
    count: 4,
    description: 'API requests, WebSocket tests, and command builders',
    link: '/api-request-builder',
  },
  {
    title: 'Text & Docs',
    icon: FileText,
    count: 4,
    description: 'Whitespace, Markdown, PDFs, and date tools',
    link: '/markdown-previewer',
  },
];

const popularTools = [
  { name: 'JSON Formatter', link: '/json-formatter' },
  { name: 'Base64 Encoder', link: '/base64-encoder' },
  { name: 'JWT Decoder', link: '/jwt-decoder' },
  { name: 'Hash Generator', link: '/hash-generator' },
];

const features = [
  {
    icon: Lock,
    title: '100% Local Processing',
    description:
      'Your processed data never leaves your device. No server-side processing, with privacy-preserving product analytics.',
  },
  {
    icon: Zap,
    title: 'Offline-capable',
    description:
      'Install the PWA to use cached local tools offline. Network tools still need a connection.',
  },
  {
    icon: Palette,
    title: 'Light & Dark Mode',
    description: 'Beautiful themes that adapt to your preference. Easy on the eyes, day or night.',
  },
  {
    icon: Download,
    title: 'Installable Web App',
    description: 'Install the PWA from a supported browser on your computer or mobile device.',
  },
];

export function LandingPage() {
  const [demoInput, setDemoInput] = useState('');
  const suggestions = useMemo(() => detectContentType(demoInput), [demoInput]);

  useEffect(() => {
    applySeo({
      title: 'About Toolbit — Local-first developer tools',
      description:
        'Toolbit is a local-first developer workspace for formatting, transforming, inspecting, and generating code and data without sending it to a server.',
      canonicalPath: '/about',
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={appLogoUrl} alt="Toolbit" className="w-8 h-8" />
              <span className="text-xl font-semibold">Toolbit</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/alwin-augustin/toolbit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <Link href="/">
                <Button>Launch App</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  A focused workspace for everyday developer work
                  <br />
                  <span className="text-primary">
                    format, transform, inspect, and generate locally
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto lg:mx-0">
                  Toolbit brings the small tools developers reach for every day into one calm,
                  local-first workspace. Your inputs stay on your device, your work can move through
                  compatible pipelines, and the app keeps working when the network does not.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/json-formatter">
                    <Button size="lg" className="text-base px-8">
                      Launch App <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <InstallApp />
                </div>
                <div className="mt-6 text-sm text-muted-foreground">
                  No signup. Your processed data stays local. Offline-capable. Open source.
                </div>

                {/* Quick Access */}
                <div className="mt-10 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4">Popular Tools</p>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    {popularTools.map((tool) => (
                      <Link key={tool.name} href={tool.link}>
                        <Button variant="secondary" size="sm">
                          {tool.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Demo */}
              <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <Label
                    htmlFor="landing-demo-input"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Paste anything
                  </Label>
                  <span className="text-xs text-muted-foreground/70">Local-only</span>
                </div>
                <Textarea
                  id="landing-demo-input"
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  placeholder="Paste JSON, JWT, Base64, cron, SQL, URLs..."
                  aria-label="Paste data to find a tool"
                  className="w-full h-32 font-mono text-sm resize-none"
                />

                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs text-muted-foreground self-center">Detected:</span>
                    {suggestions.map((s) => (
                      <Badge
                        key={s.toolId}
                        variant="secondary"
                        render={
                          <Link
                            href={s.path}
                            onClick={() => {
                              if (demoInput.trim()) {
                                sessionStorage.setItem('toolbit:smart-paste', demoInput);
                              }
                            }}
                          />
                        }
                      >
                        {s.toolName}
                        <ArrowRight data-icon="inline-end" />
                      </Badge>
                    ))}
                  </div>
                )}

                {!demoInput && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">Try:</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setDemoInput('{"name": "toolbit", "version": "2.0"}')}
                      className="text-xs h-7 px-2.5 py-1"
                    >
                      JSON
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setDemoInput(
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoidG9vbGJpdCJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
                        )
                      }
                      className="text-xs h-7 px-2.5 py-1"
                    >
                      JWT
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setDemoInput('*/5 * * * *')}
                      className="text-xs h-7 px-2.5 py-1"
                    >
                      Cron
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setDemoInput('1707307200')}
                      className="text-xs h-7 px-2.5 py-1"
                    >
                      Timestamp
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 cv-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Toolbit?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Capability overview */}
      <section className="border-t border-border bg-background cv-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
                Built around your workflow
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">The tools around the code</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Toolbit keeps common developer tasks close at hand, with local processing, focused
                editors, and compatible pipelines that help you move from one step to the next.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {toolCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.title}
                    href={category.link}
                    className="group rounded-lg border border-border bg-card/50 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary">
                          {category.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tool Categories */}
      <section className="border-t border-border cv-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">All Tools</h2>
            <p className="text-center text-muted-foreground mb-12">
              Comprehensive collection of utilities for everyday development tasks
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {toolCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link key={category.title} href={category.link}>
                    <div className="group p-6 rounded-lg border border-border bg-card hover:bg-accent hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold">{category.title}</h3>
                            <span className="text-xs text-muted-foreground">
                              {category.count} tools
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tool index — plain anchors so crawlers follow them to the
                per-tool landing pages, which are prerendered at build time. */}
      <section className="border-t border-border bg-background cv-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Every tool, one page each</h2>
            <p className="text-center text-muted-foreground mb-10">
              {TOOL_PAGES.length} utilities, each with its own page explaining what it does and how
              to use it.
            </p>
            <ul className="flex flex-wrap justify-center gap-2">
              {TOOL_PAGES.map((tool) => (
                <li key={tool.slug}>
                  <a
                    href={`/${tool.slug}`}
                    className="inline-block rounded-full border border-border bg-card/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {tool.name}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-center text-sm">
              <a href="/tools" className="text-primary hover:underline">
                Browse the full tool directory
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 cv-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start using Toolbit now. No sign-up, no installation required for web version.
            </p>
            <Link href="/json-formatter">
              <Button size="lg" className="text-base px-8">
                Launch App <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur-sm px-6 py-8 cv-auto">
        <div className="container mx-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <a
                href="https://github.com/alwin-augustin/toolbit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-muted-foreground/40">•</span>
              <a
                href="https://github.com/alwin-augustin/toolbit/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Feedback
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-muted-foreground/40">•</span>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-muted-foreground/70">
                Local transforms keep your inputs on your device
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Made with care by developers, for developers
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
