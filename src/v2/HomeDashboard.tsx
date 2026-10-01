import { stashSmartPaste } from "./smart-paste";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Clipboard, Clock, Command, FileJson, FolderOpen, Play, Sparkles } from "lucide-react";
import { Badge, Button, Kbd } from "@/ds/components";
import { getRecentHistory, type ToolHistoryEntry } from "@/lib/history-db";
import { detectContentType } from "@/lib/smart-detect";
import { TOOLS, TOOL_CATEGORIES, type ToolCategory } from "@/config/tools.config";
import { CATEGORIES } from "./categories";
import { isPostHogEnabled, posthog } from "@/lib/posthog";

const mono: CSSProperties = { fontFamily: "var(--font-mono)" };

function timeAgo(timestamp: number): string {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function preview(value: string, max = 48): string {
    const text = value.replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max)}…` : text;
}

interface HomeDashboardProps {
    onSearch: () => void;
    onHistory: () => void;
    onCategory: (category: ToolCategory) => void;
}

export function HomeDashboard({ onSearch, onHistory, onCategory }: HomeDashboardProps) {
    const [, setLocation] = useLocation();
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<ToolHistoryEntry[]>([]);
    const suggestions = useMemo(() => detectContentType(input), [input]);

    useEffect(() => {
        let active = true;
        getRecentHistory(6).then((items) => {
            if (active) setHistory(items);
        }).catch(() => undefined);
        return () => { active = false; };
    }, []);

    const openTool = (id: string) => {
        if (input.trim()) {
            stashSmartPaste(input);
            if (isPostHogEnabled) {
                posthog.capture("smart_detection_used", {
                    destination_tool_id: id,
                    suggestion_count: suggestions.length,
                });
            }
        }
        setLocation(`/${id}`);
    };

    const categoryCount = (category: ToolCategory) => TOOLS.filter((tool) => tool.category === category).length;

    return (
        <main className="tb-home" aria-label="Toolbit workspace home">
            <section className="tb-home-hero">
                <div>
                    <div className="tb-eyebrow"><Sparkles size={13} /> Local-first developer workspace</div>
                    <h1>Format, validate, pipe, and keep context without leaving the editor.</h1>
                    <p>Fast utilities for daily development work. Your inputs stay on this device.</p>
                </div>
                <div className="tb-home-actions">
                    <Button size="sm" iconLeft={<Play size={13} />} onClick={() => openTool("json-formatter")}>New JSON</Button>
                    <Button size="sm" variant="secondary" iconLeft={<Command size={13} />} onClick={onSearch}>Open command palette</Button>
                </div>
            </section>

            <section className="tb-home-workbench" aria-labelledby="smart-paste-title">
                <div className="tb-section-heading">
                    <div>
                        <span className="tb-eyebrow"><Clipboard size={13} /> Smart paste</span>
                        <h2 id="smart-paste-title">What are you working on?</h2>
                    </div>
                    <Kbd>⌘V</Kbd>
                </div>
                <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    className="tb-home-input"
                    placeholder="Paste JSON, JWT, Base64, cron, URLs, or UUIDs and Toolbit will route it."
                    aria-label="Paste content for smart detection"
                />
                <div className="tb-home-input-footer">
                    <div className="tb-chip-row">
                        <span className="tb-muted-label">Try an example</span>
                        {[
                            ["JSON", '{"tool":"json","local":true}'],
                            ["JWT", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0b29sYml0In0"],
                            ["Cron", "*/5 * * * *"],
                            ["URL", "https://toolbit.app/tools?local=true"],
                        ].map(([label, value]) => (
                            <button key={label} className="tb-chip" type="button" onClick={() => setInput(value)}>{label}</button>
                        ))}
                    </div>
                    {suggestions.length > 0 && (
                        <div className="tb-detected" aria-live="polite">
                            <span className="tb-muted-label">Detected</span>
                            {suggestions.slice(0, 3).map((suggestion) => (
                                <button key={suggestion.toolId} type="button" className="tb-detected-action" onClick={() => openTool(suggestion.toolId)}>
                                    {suggestion.toolName}<ArrowRight size={12} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="tb-home-grid">
                <div className="tb-home-section">
                    <div className="tb-section-heading compact">
                        <h2><Clock size={15} /> Recent</h2>
                        <button className="tb-text-action" type="button" onClick={onHistory}>View all</button>
                    </div>
                    <div className="tb-recent-list">
                        {history.length > 0 ? history.map((entry) => {
                            const tool = TOOLS.find((candidate) => candidate.id === entry.toolId);
                            if (!tool) return null;
                            return (
                                <button key={`${entry.toolId}-${entry.timestamp}`} type="button" className="tb-recent-row" onClick={() => setLocation(`/${entry.toolId}`)}>
                                    <span className="tb-tool-mark"><FileJson size={14} /></span>
                                    <span className="tb-recent-copy"><strong>{tool.name}</strong><small style={mono}>{preview(entry.input)}</small></span>
                                    <time>{timeAgo(entry.timestamp)}</time>
                                </button>
                            );
                        }) : (
                            <div className="tb-empty-state">Run a tool and it will appear here.</div>
                        )}
                    </div>
                </div>

                <div className="tb-home-section">
                    <div className="tb-section-heading compact">
                        <h2><FolderOpen size={15} /> Tool library</h2>
                        <span className="tb-muted-label">{TOOLS.length} tools</span>
                    </div>
                    <div className="tb-category-list">
                        {CATEGORIES.map((category) => (
                            <button key={category.id} type="button" className="tb-category-row" onClick={() => onCategory(category.id)}>
                                <span className="tb-category-icon">{category.icon(15)}</span>
                                <span>{category.label}</span>
                                <Badge tone="neutral">{categoryCount(category.id)}</Badge>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tb-home-tools" aria-labelledby="popular-tools-title">
                <div className="tb-section-heading compact">
                    <h2 id="popular-tools-title">Start with a tool</h2>
                    <span className="tb-muted-label">{TOOL_CATEGORIES.format.description}</span>
                </div>
                <div className="tb-tool-grid">
                    {TOOLS.slice(0, 8).map((tool) => (
                        <button key={tool.id} type="button" className="tb-tool-card" onClick={() => setLocation(`/${tool.id}`)}>
                            <span className="tb-tool-mark">{tool.name.slice(0, 2).toUpperCase()}</span>
                            <span><strong>{tool.name}</strong><small>{tool.description}</small></span>
                        </button>
                    ))}
                </div>
            </section>
        </main>
    );
}
