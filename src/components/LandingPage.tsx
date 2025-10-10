import { Link } from "wouter";
import {
    FileJson,
    Code,
    Shield,
    Type,
    Clock,
    Hash,
    Download,
    Lock,
    Zap,
    Palette,
    ArrowRight,
    Github,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useElectron } from "@/hooks/use-electron";

const toolCategories = [
    {
        title: "JSON Tools",
        icon: FileJson,
        count: 3,
        description: "Format, validate, and convert JSON data",
        link: "/app/json-formatter"
    },
    {
        title: "Web Development",
        icon: Code,
        count: 5,
        description: "CSS, JavaScript, HTML, and Markdown tools",
        link: "/app/css-formatter"
    },
    {
        title: "Encoding & Security",
        icon: Shield,
        count: 3,
        description: "Base64, JWT, and hash generation",
        link: "/app/base64-encoder"
    },
    {
        title: "Text Utilities",
        icon: Type,
        count: 4,
        description: "Case conversion, diff, and text processing",
        link: "/app/case-converter"
    },
    {
        title: "Converters",
        icon: Clock,
        count: 4,
        description: "Timestamp, color, and unit conversions",
        link: "/app/timestamp-converter"
    },
    {
        title: "Utilities",
        icon: Hash,
        count: 3,
        description: "Date calculator, cron parser, HTTP codes",
        link: "/app/date-calculator"
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

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-sm">TB</span>
                            </div>
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
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            20+ Developer Utilities
                            <br />
                            <span className="text-primary">in One Place</span>
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Local-first, privacy-focused tools for developers.
                            No data ever leaves your device. Works offline.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

                        {/* Quick Access */}
                        <div className="mt-12 pt-8 border-t border-border">
                            <p className="text-sm text-muted-foreground mb-4">Popular Tools</p>
                            <div className="flex flex-wrap gap-2 justify-center">
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
                </div>
            </section>

            {/* Features Section */}
            <section className="border-t border-border bg-muted/30">
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

            {/* Tool Categories */}
            <section className="border-t border-border">
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
            <section className="border-t border-border bg-muted/30">
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
            <footer className="border-t border-border bg-background/50 backdrop-blur-sm px-6 py-8">
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
                            <span className="text-muted-foreground/70">
                                Your data never leaves your device — Toolbit runs locally
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Made with ❤️ by developers, for developers
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
