import { useMemo, useState } from "react";
import { Link } from "wouter";
import { detectContentType } from "@/lib/smart-detect";
import {
    FileJson,
    Download,
    Lock,
    Zap,
    Palette,
    ArrowRight,
    Github,
    ExternalLink,
    Wand2,
    ArrowRightLeft,
    Microscope,
    Hammer,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useElectron } from "@/hooks/use-electron";
import appLogoUrl from "@/assets/app-logo.svg";

const toolCategories = [
    {
        title: "Format & Validate",
        icon: FileJson,
        count: 8,
        description: "JSON, YAML, XML, SQL, GraphQL, and config validators",
        link: "/app/json-formatter"
    },
    {
        title: "Encode & Decode",
        icon: Lock,
        count: 6,
        description: "Base64, URL, HTML, JWT, certificates, and protobuf",
        link: "/app/base64-encoder"
    },
    {
        title: "Generate",
        icon: Wand2,
        count: 7,
        description: "UUIDs, hashes, passwords, fake data, and QR codes",
        link: "/app/uuid-generator"
    },
    {
        title: "Transform",
        icon: ArrowRightLeft,
        count: 7,
        description: "Convert data formats and transform text",
        link: "/app/csv-to-json"
    },
    {
        title: "Analyze",
        icon: Microscope,
        count: 6,
        description: "Regex, diff, git patches, and cron insights",
        link: "/app/diff-tool"
    },
    {
        title: "Build",
        icon: Hammer,
        count: 4,
        description: "API requests, WebSocket tests, and command builders",
        link: "/app/api-request-builder"
    },
    {
        title: "Text & Docs",
        icon: FileText,
        count: 4,
        description: "Whitespace, Markdown, PDFs, and date tools",
        link: "/app/markdown-previewer"
    }
];

const popularTools = [
    { name: "JSON Formatter", link: "/app/json-formatter" },
    { name: "Base64 Encoder", link: "/app/base64-encoder" },
    { name: "JWT Decoder", link: "/app/jwt-decoder" },
    { name: "Hash Generator", link: "/app/hash-generator" }
];

const features = [
    {
        icon: Lock,
        title: "100% Local Processing",
        description: "Your data never leaves your device. Zero servers, zero tracking, complete privacy."
    },
    {
        icon: Zap,
        title: "Works Offline",
        description: "Install as PWA and use all tools without internet connection. Perfect for air-gapped environments."
    },
    {
        icon: Palette,
        title: "Light & Dark Mode",
        description: "Beautiful themes that adapt to your preference. Easy on the eyes, day or night."
    },
    {
        icon: Download,
        title: "Cross-Platform Desktop",
        description: "Available for macOS, Windows, and Linux. Native app experience on all platforms."
    }
];

export function LandingPage() {
    const { isElectron } = useElectron();
    const [demoInput, setDemoInput] = useState("");
    const suggestions = useMemo(() => detectContentType(demoInput), [demoInput]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                src={appLogoUrl}
                                alt="Toolbit"
                                className="w-8 h-8"
                            />
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
                            <Link href="/app/json-formatter">
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
                                    Local-first developer tools
                                    <br />
                                    <span className="text-primary">for JSON, Base64, JWT, YAML, XML, SQL & more</span>
                                </h1>
                                <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto lg:mx-0">
                                    Toolbit is a privacy-first toolbox with 40+ utilities. Format JSON/YAML/XML/SQL,
                                    decode JWT, encode Base64, generate UUIDs and hashes, test regex, parse cron,
                                    build API requests, and more — all offline and on-device.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Link href="/app/json-formatter">
                                        <Button size="lg" className="text-base px-8">
                                            Launch App <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                    {!isElectron && (
                                        <a
                                            href="https://github.com/alwin-augustin/toolbit/releases"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button size="lg" variant="outline" className="text-base px-8">
                                                <Download className="mr-2 h-5 w-5" />
                                                Download Desktop App
                                            </Button>
                                        </a>
                                    )}
                                </div>
                                <div className="mt-6 text-sm text-muted-foreground">
                                    No signup. No tracking. Works offline. Open source.
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
                                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Paste anything
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/70">Local-only</span>
                                </div>
                                <textarea
                                    value={demoInput}
                                    onChange={(e) => setDemoInput(e.target.value)}
                                    placeholder="Paste JSON, JWT, Base64, cron, SQL, URLs..."
                                    className="w-full h-32 rounded-lg border border-border bg-background p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/60"
                                />

                                {suggestions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="text-xs text-muted-foreground self-center">Detected:</span>
                                        {suggestions.map((s) => (
                                            <Link
                                                key={s.toolId}
                                                href={s.path}
                                                onClick={() => {
                                                    if (demoInput.trim()) {
                                                        sessionStorage.setItem("toolbit:smart-paste", demoInput);
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                                            >
                                                <span>{s.toolName}</span>
                                                <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {!demoInput && (
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className="text-xs text-muted-foreground">Try:</span>
                                        <button
                                            onClick={() => setDemoInput('{"name": "toolbit", "version": "2.0"}')}
                                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                        >
                                            JSON
                                        </button>
                                        <button
                                            onClick={() => setDemoInput("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoidG9vbGJpdCJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")}
                                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                        >
                                            JWT
                                        </button>
                                        <button
                                            onClick={() => setDemoInput("*/5 * * * *")}
                                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                        >
                                            Cron
                                        </button>
                                        <button
                                            onClick={() => setDemoInput("1707307200")}
                                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                        >
                                            Timestamp
                                        </button>
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

            {/* SEO-rich overview */}
            <section className="border-t border-border bg-background cv-auto">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="max-w-5xl mx-auto space-y-4">
                        <h2 className="text-2xl font-bold">Everything you need for daily development tasks</h2>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Toolbit bundles essential developer tools into one fast, local-first workspace:
                            JSON/YAML/XML/SQL formatters, Base64 encoder/decoder, JWT decoder, UUID and hash generators,
                            regex tester, cron parser, timestamp and color converters, API request builder, Docker command
                            builder, and more. All processing happens in your browser for speed and privacy.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                            <div>Format & Validate: JSON, YAML, XML, SQL, GraphQL</div>
                            <div>Encode & Decode: Base64, URL, HTML, JWT, Certificates</div>
                            <div>Generate: UUIDs, Passwords, Hashes, Fake Data, QR</div>
                            <div>Transform: CSV, Case, Timestamps, Colors, Units, Images</div>
                            <div>Analyze: Regex, Diff, Git patches, Cron, HTTP status</div>
                            <div>Build: API requests, WebSockets, Docker commands</div>
                            <div>Text & Docs: Markdown, PDFs, Whitespace, Date tools</div>
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
                                                        <span className="text-xs text-muted-foreground">{category.count} tools</span>
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

            {/* CTA Section */}
            <section className="border-t border-border bg-muted/30 cv-auto">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Start using Toolbit now. No sign-up, no installation required for web version.
                        </p>
                        <Link href="/app/json-formatter">
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
                                Your data never leaves your device
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
