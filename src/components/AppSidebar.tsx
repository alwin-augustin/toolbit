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
} from "lucide-react"
import { Link, useLocation } from "wouter"

const toolGroups = [
    {
        title: "Text & Format",
        items: [
            { title: "JSON Formatter", url: "/json-formatter", icon: FileJson },
            { title: "Case Converter", url: "/case-converter", icon: Type },
            { title: "Word Counter", url: "/word-counter", icon: Hash },
            { title: "Strip Whitespace", url: "/strip-whitespace", icon: Eraser },
            { title: "CSS Formatter/Minifier", url: "/css-formatter", icon: Code },
            { title: "JavaScript Minifier", url: "/js-json-minifier", icon: Code },
        ],
    },
    {
        title: "Encoding & Decoding",
        items: [
            { title: "Base64 Encoder", url: "/base64-encoder", icon: Code },
            { title: "URL Encoder", url: "/url-encoder", icon: LinkIcon },
            { title: "HTML Escape", url: "/html-escape", icon: Braces },
            { title: "JWT Decoder", url: "/jwt-decoder", icon: Shield },
        ],
    },
    {
        title: "Preview & Validation",
        items: [
            { title: "JSON Schema Validator", url: "/json-validator", icon: Shield },
            { title: "Markdown Previewer", url: "/markdown-previewer", icon: CircleDotDashed },
        ],
    },
    {
        title: "Generators & Tools",
        items: [
            { title: "UUID Generator", url: "/uuid-generator", icon: Key },
            { title: "Hash Generator", url: "/hash-generator", icon: Hash },
            { title: "Timestamp Converter", url: "/timestamp-converter", icon: Clock },
            { title: "Date Calculator", url: "/date-calculator", icon: Calendar },
            { title: "Color Converter", url: "/color-converter", icon: Palette },
            { title: "Diff Tool", url: "/diff-tool", icon: GitCompare },
            { title: "CSV to JSON Converter", url: "/csv-to-json", icon: FileJson },
            { title: "Cron Expression Parser", url: "/cron-parser", icon: Clock },
            { title: "Unit Converter", url: "/unit-converter", icon: Hash },
            { title: "HTTP Status Code Reference", url: "/http-status-codes", icon: Search },
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
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">TB</span>
                        </div>
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