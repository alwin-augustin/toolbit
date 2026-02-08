import { useEffect, useMemo, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import { TOOLS } from "@/config/tools.config"
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
    Home,
    Wand2,
    ArrowRightLeft,
    Microscope,
    Hammer,
    PanelLeftClose,
    PanelLeft,
    Star,
} from "lucide-react"
import { Link, useLocation } from "wouter"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import appLogoUrl from "@/assets/app-logo.svg"

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
    const [search, setSearch] = useState("")
    const [favorites, setFavorites] = useState<string[]>([])
    const [recentTools, setRecentTools] = useState<string[]>([])
    const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number } | null>(null)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
        // Auto-expand the group containing the active tool
        const activeGroup = toolGroups.find(g => g.items.some(i => i.url === location))
        return new Set(activeGroup ? [activeGroup.title] : [])
    })
    const railRef = useRef<HTMLElement | null>(null)
    const flyoutAnchorRef = useRef<HTMLElement | null>(null)
    const flyoutRef = useRef<HTMLDivElement | null>(null)

    const isCollapsed = mode === 'collapsed'

    const toolByPath = useMemo(() => new Map(TOOLS.map(tool => [tool.path, tool])), [])
    const toolMetaByPath = useMemo(() => {
        const map = new Map<string, { title: string; icon: typeof FileJson }>()
        toolGroups.forEach(group => {
            group.items.forEach(item => {
                map.set(item.url, { title: item.title, icon: item.icon })
            })
        })
        return map
    }, [toolGroups])

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            close()
        }
    }

    const openFlyout = (groupTitle: string, anchor: HTMLElement, itemCount: number) => {
        const rect = anchor.getBoundingClientRect()
        const estimatedHeight = Math.min(40 + itemCount * 36, 360)
        const maxTop = window.innerHeight - estimatedHeight - 12
        const top = Math.max(8, Math.min(rect.top, maxTop))
        setHoveredGroup(groupTitle)
        setFlyoutPos({ top, left: rect.right + 8 })
        flyoutAnchorRef.current = anchor
    }

    const closeFlyout = () => {
        setHoveredGroup(null)
        setFlyoutPos(null)
        flyoutAnchorRef.current = null
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

    useEffect(() => {
        const favs = JSON.parse(localStorage.getItem("toolbit:favorites") || "[]")
        const recent = JSON.parse(localStorage.getItem("toolbit:recent") || "[]")
        if (Array.isArray(favs)) setFavorites(favs)
        if (Array.isArray(recent)) setRecentTools(recent)
    }, [isOpen, location])

    useEffect(() => {
        const activeGroup = toolGroups.find(g => g.items.some(i => i.url === location))
        if (!activeGroup) return
        setExpandedGroups(prev => {
            if (prev.has(activeGroup.title)) return prev
            const next = new Set(prev)
            next.add(activeGroup.title)
            return next
        })
    }, [location])

    const favoriteItems = useMemo(() => {
        return favorites
            .map((id) => {
                const tool = TOOLS.find(t => t.id === id)
                if (!tool) return null
                const meta = toolMetaByPath.get(tool.path)
                return {
                    id,
                    title: tool.name,
                    url: tool.path,
                    icon: meta?.icon ?? FileJson,
                }
            })
            .filter(Boolean) as { id: string; title: string; url: string; icon: typeof FileJson }[]
    }, [favorites, toolMetaByPath])

    const recentItems = useMemo(() => {
        return recentTools
            .map((id) => {
                const tool = TOOLS.find(t => t.id === id)
                if (!tool) return null
                const meta = toolMetaByPath.get(tool.path)
                return {
                    id,
                    title: tool.name,
                    url: tool.path,
                    icon: meta?.icon ?? FileJson,
                }
            })
            .filter(Boolean)
            .slice(0, 5) as { id: string; title: string; url: string; icon: typeof FileJson }[]
    }, [recentTools, toolMetaByPath])

    const filteredGroups = useMemo(() => {
        const term = search.trim().toLowerCase()
        if (!term) return toolGroups
        return toolGroups
            .map(group => ({
                ...group,
                items: group.items.filter(item => {
                    const tool = toolByPath.get(item.url)
                    const haystack = [
                        item.title,
                        tool?.description,
                        tool?.keywords?.join(" "),
                        group.title,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                    return haystack.includes(term)
                }),
            }))
            .filter(group => group.items.length > 0)
    }, [search, toolByPath, toolGroups])

    const isDesktop = typeof window !== "undefined" ? window.innerWidth >= 1024 : true

    useEffect(() => {
        if (!hoveredGroup) return
        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node
            if (railRef.current && railRef.current.contains(target)) return
            if (flyoutRef.current && flyoutRef.current.contains(target)) return
            closeFlyout()
        }
        document.addEventListener("mousedown", handlePointerDown)
        return () => document.removeEventListener("mousedown", handlePointerDown)
    }, [hoveredGroup])

    useEffect(() => {
        if (!hoveredGroup) return
        const handleReposition = () => {
            if (!flyoutAnchorRef.current) return
            const group = toolGroups.find((g) => g.title === hoveredGroup)
            const rect = flyoutAnchorRef.current.getBoundingClientRect()
            const estimatedHeight = group ? Math.min(40 + group.items.length * 36, 360) : 240
            const maxTop = window.innerHeight - estimatedHeight - 12
            const top = Math.max(8, Math.min(rect.top, maxTop))
            setFlyoutPos({ top, left: rect.right + 8 })
        }
        window.addEventListener("resize", handleReposition)
        return () => window.removeEventListener("resize", handleReposition)
    }, [hoveredGroup])

    const hoveredGroupData = hoveredGroup ? toolGroups.find((g) => g.title === hoveredGroup) : null

    // Collapsed icon rail mode
    if (isOpen && isCollapsed && isDesktop) {
        return (
            <aside ref={railRef} className="flex flex-col border-r border-border bg-card/50 backdrop-blur-xl w-16 shrink-0">
                <div className="flex h-16 items-center justify-center border-b border-border">
                    <Link href="/app" onClick={handleLinkClick}>
                        <img src={appLogoUrl} alt="Toolbit" className="w-8 h-8 object-contain" />
                    </Link>
                </div>

                <nav className="flex-1 flex flex-col items-center gap-1 py-3 overflow-visible">
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
                                onMouseEnter={(event) => openFlyout(group.title, event.currentTarget as unknown as HTMLElement, group.items.length)}
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
                                            onClick={(event) => {
                                                if (hoveredGroup === group.title) {
                                                    closeFlyout()
                                                } else {
                                                    openFlyout(group.title, event.currentTarget, group.items.length)
                                                }
                                            }}
                                        >
                                            <GroupIcon className="h-5 w-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={8}>
                                        {group.title}
                                    </TooltipContent>
                                </Tooltip>
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
                {hoveredGroupData && flyoutPos && createPortal(
                    <div
                        ref={flyoutRef}
                        className="fixed z-[999] w-56 bg-popover border border-border rounded-lg shadow-lg py-2 animate-in fade-in-0 zoom-in-95 duration-150"
                        style={{ top: flyoutPos.top, left: flyoutPos.left }}
                        onMouseEnter={() => setHoveredGroup(hoveredGroupData.title)}
                    >
                        <div className="px-3 pb-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground/80">
                            {hoveredGroupData.title}
                        </div>
                        {hoveredGroupData.items.map((item) => {
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
                                        closeFlyout()
                                        handleLinkClick()
                                    }}
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                </Link>
                            )
                        })}
                    </div>,
                    document.body
                )}
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
                        <img src={appLogoUrl} alt="Toolbit" className="w-8 h-8 object-contain" />
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

                    {/* Sidebar search */}
                    <div className="px-2 pb-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter tools..."
                                className="w-full h-9 rounded-md border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                    </div>

                    {!search.trim() && favoriteItems.length > 0 && (
                        <div className="pb-2">
                            <div className="flex items-center gap-2 px-3 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                                <Star className="h-3 w-3 text-yellow-500" />
                                Favorites
                            </div>
                            <div className="mt-1 space-y-0.5">
                                {favoriteItems.slice(0, 6).map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.url}
                                            className={cn(
                                                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                                location === item.url
                                                    ? "bg-primary text-primary-foreground font-semibold"
                                                    : "hover:bg-accent hover:text-accent-foreground"
                                            )}
                                            onClick={handleLinkClick}
                                        >
                                            <Icon className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{item.title}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {!search.trim() && recentItems.length > 0 && (
                        <div className="pb-2">
                            <div className="flex items-center gap-2 px-3 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                                <Clock className="h-3 w-3" />
                                Recent
                            </div>
                            <div className="mt-1 space-y-0.5">
                                {recentItems.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.url}
                                            className={cn(
                                                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                                location === item.url
                                                    ? "bg-primary text-primary-foreground font-semibold"
                                                    : "hover:bg-accent hover:text-accent-foreground"
                                            )}
                                            onClick={handleLinkClick}
                                        >
                                            <Icon className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{item.title}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tool groups with collapsible sections */}
                    {filteredGroups.map((group) => {
                        const GroupIcon = group.icon
                        const isExpanded = search.trim().length > 0 || expandedGroups.has(group.title)
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

                    {filteredGroups.length === 0 && (
                        <div className="px-3 py-6 text-xs text-muted-foreground">
                            No tools match your search.
                        </div>
                    )}
                </nav>
            </div>
        </aside>
    )
}
