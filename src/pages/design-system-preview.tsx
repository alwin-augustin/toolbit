import { useEffect, useState } from "react";
import { Moon, Sun, Star, Shield, Info, Braces } from "lucide-react";
import "@/ds/styles.css";
import {
    Button,
    IconButton,
    Badge,
    Tag,
    Kbd,
    Input,
    Textarea,
    Select,
    Switch,
    Checkbox,
    Alert,
    Toast,
    Tooltip,
    Skeleton,
    Card,
    CodeBlock,
    StatusPill,
    Tabs,
    SidebarItem,
} from "@/ds/components";

const SAMPLE_JSON = `{
  "name": "toolbit",
  "local": true,
  "tools": 40
}`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: "2rem" }}>
            <h2
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "hsl(var(--text-muted))",
                    marginBottom: "0.75rem",
                }}
            >
                {title}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                {children}
            </div>
        </section>
    );
}

/**
 * Dev-only preview of the v2 design system (issue #13).
 * Loads the DS stylesheet on visit; not linked from app navigation.
 */
export default function DesignSystemPreview() {
    const [dark, setDark] = useState(true);
    const [tab, setTab] = useState("text");
    const [on, setOn] = useState(true);
    const [checked, setChecked] = useState(true);

    useEffect(() => {
        const el = document.documentElement;
        const previous = el.className;
        el.className = dark ? "dark" : "";
        return () => {
            el.className = previous;
        };
    }, [dark]);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "hsl(var(--surface-0))",
                color: "hsl(var(--text-body))",
                fontFamily: "var(--font-sans)",
                padding: "2rem 3rem",
            }}
        >
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                }}
            >
                <h1 style={{ fontSize: "var(--text-xl)" }}>
                    tool<span style={{ color: "hsl(var(--primary))" }}>bit</span> design system
                </h1>
                <Button
                    variant="outline"
                    iconLeft={dark ? <Sun size={14} /> : <Moon size={14} />}
                    onClick={() => setDark(!dark)}
                >
                    {dark ? "Light theme" : "Dark theme"}
                </Button>
            </header>

            <Section title="Buttons">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
                <Button disabled>Disabled</Button>
                <IconButton title="Favorite">
                    <Star size={14} />
                </IconButton>
            </Section>

            <Section title="Badges, tags, kbd">
                <Badge>Neutral</Badge>
                <Badge tone="primary">Primary</Badge>
                <Badge tone="success">Valid</Badge>
                <Badge tone="warning">Warning</Badge>
                <Badge tone="danger" variant="solid">Invalid</Badge>
                <Tag icon={<Braces size={13} />}>JSON</Tag>
                <Tag active>Active tag</Tag>
                <Kbd>⌘K</Kbd>
                <Kbd>⌘1</Kbd>
            </Section>

            <Section title="Forms">
                <Input placeholder="Search tools…" />
                <Input invalid placeholder="Invalid input" />
                <Select>
                    <option>2 spaces</option>
                    <option>4 spaces</option>
                    <option>8 spaces</option>
                </Select>
                <Switch checked={on} onChange={setOn} />
                <Checkbox checked={checked} onChange={setChecked} label="Sort keys" />
                <Textarea placeholder="Paste JSON here…" rows={3} style={{ width: "280px" }} />
            </Section>

            <Section title="Feedback">
                <Alert tone="info" title="Local only" icon={<Info size={15} />}>
                    Everything runs on this device.
                </Alert>
                <Alert tone="danger" title="Invalid JSON">
                    Unexpected token at line 3.
                </Alert>
                <Toast title="Copied to clipboard" tone="success" />
                <Tooltip label="Decode JWT">
                    <Button variant="outline">Hover me</Button>
                </Tooltip>
                <Skeleton style={{ width: "160px", height: "16px" }} />
            </Section>

            <Section title="Surfaces">
                <Card style={{ width: "260px" }}>
                    <strong>JSON Formatter</strong>
                    <p style={{ color: "hsl(var(--text-muted))", fontSize: "var(--text-sm)" }}>
                        Format and validate JSON.
                    </p>
                </Card>
                <CodeBlock code={SAMPLE_JSON} lang="json" highlight style={{ width: "300px" }} />
                <StatusPill tone="success" icon={<Shield size={12} />}>
                    Local · no network
                </StatusPill>
                <StatusPill tone="danger">Invalid</StatusPill>
            </Section>

            <Section title="Navigation">
                <Tabs
                    variant="segment"
                    value={tab}
                    onChange={setTab}
                    items={[
                        { value: "text", label: "Text" },
                        { value: "tree", label: "Tree" },
                    ]}
                />
                <div style={{ width: "220px" }}>
                    <SidebarItem icon={<Braces size={15} />} active badge={<Kbd>⌘1</Kbd>}>
                        JSON Formatter
                    </SidebarItem>
                    <SidebarItem icon={<Shield size={15} />}>JWT Decoder</SidebarItem>
                </div>
            </Section>
        </div>
    );
}
