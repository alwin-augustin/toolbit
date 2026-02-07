import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import {
    Code,
    Link as LinkIcon,
    FileJson,
    Shield,
    Type,
    Clock,
    Hash,
    Calendar,
    Key,
    Search,
    GitCompare,
    CircleDotDashed,
    Palette,
    Braces,
    Eraser,
    Database,
    TextCursorInput,
    QrCode,
    Image,
    Globe,
    FileCode,
    Plug,
    Server,
    Binary,
    Lock,
    GitBranch,
    Container,
    FileText,
} from "lucide-react"
import { Link, useLocation } from "wouter"

const toolGroups = [
    {
        title: "JSON",
        items: [
            { title: "JSON Formatter", url: "/app/json-formatter", icon: FileJson },
            { title: "JSON Schema Validator", url: "/app/json-validator", icon: Shield },
            { title: "CSV to JSON Converter", url: "/app/csv-to-json", icon: FileJson },
        ],
    },
    {
        title: "Web",
        items: [
            { title: "CSS Formatter/Minifier", url: "/app/css-formatter", icon: Code },
            { title: "JavaScript Minifier", url: "/app/js-json-minifier", icon: Code },
            { title: "HTML Escape", url: "/app/html-escape", icon: Braces },
            { title: "URL Encoder", url: "/app/url-encoder", icon: LinkIcon },
            { title: "Markdown Previewer", url: "/app/markdown-previewer", icon: CircleDotDashed },
            { title: "YAML Formatter", url: "/app/yaml-formatter", icon: Code },
            { title: "XML Formatter", url: "/app/xml-formatter", icon: FileCode },
            { title: "SQL Formatter", url: "/app/sql-formatter", icon: Database },
            { title: "API Request Builder", url: "/app/api-request-builder", icon: Globe },
            { title: "GraphQL Formatter", url: "/app/graphql-formatter", icon: Code },
            { title: "WebSocket Tester", url: "/app/websocket-tester", icon: Plug },
            { title: "Nginx Config Validator", url: "/app/nginx-config-validator", icon: Server },
        ],
    },
    {
        title: "Encoding & Security",
        items: [
            { title: "Base64 Encoder", url: "/app/base64-encoder", icon: Code },
            { title: "JWT Decoder", url: "/app/jwt-decoder", icon: Shield },
            { title: "Hash Generator", url: "/app/hash-generator", icon: Hash },
            { title: "Password Generator", url: "/app/password-generator", icon: Shield },
            { title: "TOTP/2FA Generator", url: "/app/totp-generator", icon: Lock },
            { title: "Certificate Decoder", url: "/app/certificate-decoder", icon: Lock },
            { title: "Protobuf Decoder", url: "/app/protobuf-decoder", icon: Binary },
        ],
    },
    {
        title: "Text",
        items: [
            { title: "Case Converter", url: "/app/case-converter", icon: Type },
            { title: "Word Counter", url: "/app/word-counter", icon: Hash },
            { title: "Strip Whitespace", url: "/app/strip-whitespace", icon: Eraser },
            { title: "Diff Tool", url: "/app/diff-tool", icon: GitCompare },
            { title: "Git Diff Viewer", url: "/app/git-diff-viewer", icon: GitBranch },
            { title: "Regex Tester", url: "/app/regex-tester", icon: Search },
            { title: "Lorem Ipsum Generator", url: "/app/lorem-ipsum-generator", icon: TextCursorInput },
        ],
    },
    {
        title: "Converters & Generators",
        items: [
            { title: "Timestamp Converter", url: "/app/timestamp-converter", icon: Clock },
            { title: "Color Converter", url: "/app/color-converter", icon: Palette },
            { title: "Unit Converter", url: "/app/unit-converter", icon: Hash },
            { title: "UUID Generator", url: "/app/uuid-generator", icon: Key },
            { title: "Image Converter", url: "/app/image-converter", icon: Image },
            { title: "PDF Tools", url: "/app/pdf-tools", icon: FileText },
        ],
    },
    {
        title: "Utilities",
        items: [
            { title: "Date Calculator", url: "/app/date-calculator", icon: Calendar },
            { title: "Cron Expression Parser", url: "/app/cron-parser", icon: Clock },
            { title: "HTTP Status Code Reference", url: "/app/http-status-codes", icon: Search },
            { title: "Fake Data Generator", url: "/app/fake-data-generator", icon: Database },
            { title: "QR Code Generator", url: "/app/qr-code-generator", icon: QrCode },
            { title: "Crontab Generator", url: "/app/crontab-generator", icon: Calendar },
            { title: "Docker Command Builder", url: "/app/docker-command-builder", icon: Container },
        ],
    },
]

export function AppSidebar() {
    const [location] = useLocation()
    const { isOpen, close } = useSidebar()

    const handleLinkClick = () => {
        // Only close sidebar on mobile (screen width < 1024px)
        if (window.innerWidth < 1024) {
            close()
        }
    }

    return (
        <aside className={cn(
            "flex flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-transform duration-300 ease-in-out shadow-lg",
            "fixed inset-y-0 left-0 z-30 w-64",
            // Hide/show based on isOpen state for all screen sizes
            !isOpen && "-translate-x-full",
            isOpen && "translate-x-0",
            // On large screens, make it static only when open
            isOpen && "lg:static lg:transition-none"
        )}>
            <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex h-16 items-center gap-2 border-b border-border px-6 bg-card/80">
                    <div className="flex items-center gap-2">
                        <img
                            src="/icon-64.png"
                            alt="Toolbit"
                            className="w-8 h-8"
                        />
                        <h1 className="font-semibold tracking-tight">
                            <span className="text-lg text-foreground">Toolbit</span>
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
                    {toolGroups.map((group) => (
                        <div key={group.title} className="space-y-1 py-3">
                            <h2 className="mb-2 px-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground/80">
                                {group.title}
                            </h2>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = location === item.url;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.title}
                                            href={item.url}
                                            className={cn(
                                                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                                isActive
                                                    ? "bg-primary text-primary-foreground font-semibold"
                                                    : "hover:bg-accent hover:text-accent-foreground"
                                            )}
                                            data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                                            onClick={handleLinkClick}
                                        >
                                            <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                                            <span className="truncate">{item.title}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    )
}
