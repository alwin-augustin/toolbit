import { useState } from "react"
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
    ChevronRight,
    ChevronLeft,
    Home,
    Wand2,
    ArrowRightLeft,
    Microscope,
    Hammer,
    PanelLeftClose,
    PanelLeft,
} from "lucide-react"
import { Link, useLocation } from "wouter"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const toolGroups = [
    {
        title: "Format & Validate",
        icon: FileJson,
        items: [
            { title: "JSON Formatter", url: "/app/json-formatter", icon: FileJson },
            { title: "JSON Schema Validator", url: "/app/json-validator", icon: Shield },
            { title: "CSS Formatter/Minifier", url: "/app/css-formatter", icon: Code },
            { title: "YAML Formatter", url: "/app/yaml-formatter", icon: Code },
            { title: "XML Formatter", url: "/app/xml-formatter", icon: FileCode },
            { title: "SQL Formatter", url: "/app/sql-formatter", icon: Database },
            { title: "GraphQL Formatter", url: "/app/graphql-formatter", icon: Code },
            { title: "Nginx Config Validator", url: "/app/nginx-config-validator", icon: Server },
        ],
    },
    {
        title: "Encode & Decode",
        icon: Lock,
        items: [
            { title: "Base64 Encoder", url: "/app/base64-encoder", icon: Code },
            { title: "URL Encoder", url: "/app/url-encoder", icon: LinkIcon },
            { title: "HTML Escape", url: "/app/html-escape", icon: Braces },
            { title: "JWT Decoder", url: "/app/jwt-decoder", icon: Shield },
            { title: "Certificate Decoder", url: "/app/certificate-decoder", icon: Lock },
            { title: "Protobuf Decoder", url: "/app/protobuf-decoder", icon: Binary },
        ],
    },
    {
        title: "Generate",
        icon: Wand2,
        items: [
            { title: "UUID Generator", url: "/app/uuid-generator", icon: Key },
            { title: "Password Generator", url: "/app/password-generator", icon: Shield },
            { title: "Hash Generator", url: "/app/hash-generator", icon: Hash },
            { title: "TOTP/2FA Generator", url: "/app/totp-generator", icon: Lock },
            { title: "Lorem Ipsum Generator", url: "/app/lorem-ipsum-generator", icon: TextCursorInput },
            { title: "Fake Data Generator", url: "/app/fake-data-generator", icon: Database },
            { title: "QR Code Generator", url: "/app/qr-code-generator", icon: QrCode },
        ],
    },
    {
        title: "Transform",
        icon: ArrowRightLeft,
        items: [
            { title: "CSV to JSON Converter", url: "/app/csv-to-json", icon: FileJson },
            { title: "Case Converter", url: "/app/case-converter", icon: Type },
            { title: "JavaScript Minifier", url: "/app/js-json-minifier", icon: Code },
            { title: "Timestamp Converter", url: "/app/timestamp-converter", icon: Clock },
            { title: "Color Converter", url: "/app/color-converter", icon: Palette },
            { title: "Unit Converter", url: "/app/unit-converter", icon: Hash },
            { title: "Image Converter", url: "/app/image-converter", icon: Image },
        ],
    },
    {
        title: "Analyze",
        icon: Microscope,
        items: [
            { title: "Regex Tester", url: "/app/regex-tester", icon: Search },
            { title: "Diff Tool", url: "/app/diff-tool", icon: GitCompare },
            { title: "Git Diff Viewer", url: "/app/git-diff-viewer", icon: GitBranch },
            { title: "Word Counter", url: "/app/word-counter", icon: Hash },
            { title: "Cron Expression Parser", url: "/app/cron-parser", icon: Clock },
            { title: "HTTP Status Codes", url: "/app/http-status-codes", icon: Search },
        ],
    },
    {
        title: "Build",
        icon: Hammer,
        items: [
            { title: "API Request Builder", url: "/app/api-request-builder", icon: Globe },
            { title: "WebSocket Tester", url: "/app/websocket-tester", icon: Plug },
            { title: "Docker Command Builder", url: "/app/docker-command-builder", icon: Container },
            { title: "Crontab Generator", url: "/app/crontab-generator", icon: Calendar },
        ],
    },
    {
        title: "Text & Docs",
        icon: FileText,
        items: [
            { title: "Strip Whitespace", url: "/app/strip-whitespace", icon: Eraser },
            { title: "Markdown Previewer", url: "/app/markdown-previewer", icon: CircleDotDashed },
            { title: "PDF Tools", url: "/app/pdf-tools", icon: FileText },
            { title: "Date Calculator", url: "/app/date-calculator", icon: Calendar },
        ],
    },
]

export function AppSidebar() {
    const [location] = useLocation()
    const { isOpen, mode, close, toggleMode } = useSidebar()
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
        // Auto-expand the group containing the active tool
        const activeGroup = toolGroups.find(g => g.items.some(i => i.url === location))
        return new Set(activeGroup ? [activeGroup.title] : [])
    })

    const isCollapsed = mode === 'collapsed'

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            close()
        }
    }

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(title)) {
                next.delete(title)
            } else {
                next.add(title)
            }
            return next
        })
    }

    // Find active group for collapsed mode highlighting
    const activeGroupTitle = toolGroups.find(g => g.items.some(i => i.url === location))?.title

    // Collapsed icon rail mode
    if (isOpen && isCollapsed && window.innerWidth >= 1024) {
        return (
            <aside className="flex flex-col border-r border-border bg-card/50 backdrop-blur-xl w-16 shrink-0">
                <div className="flex h-16 items-center justify-center border-b border-border">
                    <Link href="/app" onClick={handleLinkClick}>
                        <img src="/icon-64.png" alt="Toolbit" className="w-7 h-7" />
                    </Link>
                </div>

                <nav className="flex-1 flex flex-col items-center gap-1 py-3 overflow-y-auto">
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Link
                                href="/app"
                                className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                                    location === "/app"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                                onClick={handleLinkClick}
                            >
                                <Home className="h-5 w-5" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>Home</TooltipContent>
                    </Tooltip>

                    <div className="w-6 border-t border-border my-1" />

                    {toolGroups.map((group) => {
                        const GroupIcon = group.icon
                        const isActiveGroup = group.title === activeGroupTitle
                        return (
                            <div
                                key={group.title}
                                className="relative"
                                onMouseEnter={() => setHoveredGroup(group.title)}
                                onMouseLeave={() => setHoveredGroup(null)}
                            >
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <button
                                            className={cn(
                                                "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                                                isActiveGroup
                                                    ? "bg-primary/15 text-primary"
                                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            <GroupIcon className="h-5 w-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={8}>
                                        {group.title}
                                    </TooltipContent>
                                </Tooltip>

                                {/* Flyout panel */}
                                {hoveredGroup === group.title && (
                                    <div
                                        className="absolute left-full top-0 ml-2 z-50 w-56 bg-popover border border-border rounded-lg shadow-lg py-2 animate-in fade-in-0 zoom-in-95 duration-150"
                                        onMouseEnter={() => setHoveredGroup(group.title)}
                                        onMouseLeave={() => setHoveredGroup(null)}
                                    >
                                        <div className="px-3 pb-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground/80">
                                            {group.title}
                                        </div>
                                        {group.items.map((item) => {
                                            const isActive = location === item.url
                                            const Icon = item.icon
                                            return (
                                                <Link
                                                    key={item.url}
                                                    href={item.url}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                                                        isActive
                                                            ? "bg-primary text-primary-foreground font-medium"
                                                            : "hover:bg-accent hover:text-accent-foreground"
                                                    )}
                                                    onClick={() => {
                                                        setHoveredGroup(null)
                                                        handleLinkClick()
                                                    }}
                                                >
                                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="truncate">{item.title}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                <div className="flex flex-col items-center gap-1 py-3 border-t border-border">
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={toggleMode}
                                className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <PanelLeft className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>Expand sidebar</TooltipContent>
                    </Tooltip>
                </div>
            </aside>
        )
    }

    // Expanded sidebar mode (default on mobile, toggle on desktop)
    return (
        <aside className={cn(
            "flex flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-transform duration-300 ease-in-out shadow-lg",
            "fixed inset-y-0 left-0 z-30 w-64",
            !isOpen && "-translate-x-full",
            isOpen && "translate-x-0",
            isOpen && "lg:static lg:transition-none"
        )}>
            <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex h-16 items-center justify-between border-b border-border px-4 bg-card/80">
                    <Link href="/app" className="flex items-center gap-2" onClick={handleLinkClick}>
                        <img src="/icon-64.png" alt="Toolbit" className="w-7 h-7" />
                        <h1 className="font-semibold tracking-tight">
                            <span className="text-lg text-foreground">Toolbit</span>
                        </h1>
                    </Link>
                    <button
                        onClick={toggleMode}
                        className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
                    {/* Home link */}
                    <Link
                        href="/app"
                        className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all mb-1",
                            location === "/app"
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={handleLinkClick}
                    >
                        <Home className="h-4 w-4 shrink-0" />
                        <span>Home</span>
                    </Link>

                    <div className="border-t border-border my-2" />

                    {/* Tool groups with collapsible sections */}
                    {toolGroups.map((group) => {
                        const GroupIcon = group.icon
                        const isExpanded = expandedGroups.has(group.title)
                        const hasActiveItem = group.items.some(i => i.url === location)

                        return (
                            <div key={group.title} className="py-1">
                                <button
                                    onClick={() => toggleGroup(group.title)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold tracking-wider uppercase rounded-md transition-colors",
                                        hasActiveItem
                                            ? "text-primary"
                                            : "text-muted-foreground/80 hover:text-foreground"
                                    )}
                                >
                                    <GroupIcon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="flex-1 text-left">{group.title}</span>
                                    <span className="text-[10px] font-normal text-muted-foreground/60 mr-1">
                                        {group.items.length}
                                    </span>
                                    <ChevronRight className={cn(
                                        "h-3 w-3 transition-transform duration-200",
                                        isExpanded && "rotate-90"
                                    )} />
                                </button>

                                {isExpanded && (
                                    <div className="space-y-0.5 mt-0.5">
                                        {group.items.map((item) => {
                                            const isActive = location === item.url
                                            const Icon = item.icon
                                            return (
                                                <Link
                                                    key={item.url}
                                                    href={item.url}
                                                    className={cn(
                                                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ml-2",
                                                        isActive
                                                            ? "bg-primary text-primary-foreground font-semibold"
                                                            : "hover:bg-accent hover:text-accent-foreground"
                                                    )}
                                                    onClick={handleLinkClick}
                                                >
                                                    <Icon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110" />
                                                    <span className="truncate">{item.title}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>
            </div>
        </aside>
    )
}
