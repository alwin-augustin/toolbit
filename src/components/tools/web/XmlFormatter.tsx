import { useSessionDocumentState } from "@/v2/document-state";
import { useDocumentField } from "@/v2/document-state";
import { useState, useCallback, useMemo, useEffect } from "react"
import { FileCode, Minimize2, ArrowRightLeft, Search, Sparkles, ShieldCheck } from "lucide-react"
import { Button, Input, Tabs } from "@/ds/components"
import { CodeEditor } from "@/v2/CodeEditor"
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from "@/v2/EditorPanels"
import { useEditorStatus } from "@/v2/workspace-store"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"
import { useToolPipe } from "@/hooks/use-tool-pipe"
import { useWorkspace } from "@/hooks/use-workspace"

function prettifyXml(xml: string, indent = "  "): string {
    const lines: string[] = []
    let depth = 0
    // Remove existing whitespace between tags
    const cleaned = xml.replace(/>\s+</g, "><").trim()

    // Split into tokens: tags and text content
    const tokens = cleaned.match(/(<[^>]+>)|([^<]+)/g) || []

    for (const token of tokens) {
        if (token.startsWith("</")) {
            // Closing tag
            depth--
            lines.push(indent.repeat(Math.max(0, depth)) + token)
        } else if (token.startsWith("<?") || token.startsWith("<!")) {
            // Processing instruction or DOCTYPE
            lines.push(indent.repeat(depth) + token)
        } else if (token.startsWith("<") && token.endsWith("/>")) {
            // Self-closing tag
            lines.push(indent.repeat(depth) + token)
        } else if (token.startsWith("<")) {
            // Opening tag
            lines.push(indent.repeat(depth) + token)
            depth++
        } else {
            // Text content
            const text = token.trim()
            if (text) {
                // Inline text with previous opening tag
                const lastLine = lines[lines.length - 1]
                if (lastLine && lastLine.trimStart().startsWith("<") && !lastLine.trimStart().startsWith("</")) {
                    lines[lines.length - 1] = lastLine + text
                    depth-- // text will be followed by closing tag at same level
                } else {
                    lines.push(indent.repeat(depth) + text)
                }
            }
        }
    }

    return lines.join("\n")
}

function minifyXml(xml: string): string {
    return xml
        .replace(/>\s+</g, "><")
        .replace(/\s*\n\s*/g, "")
        .trim()
}

function xmlToJson(xml: string): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, "application/xml")

    const parseError = doc.querySelector("parsererror")
    if (parseError) {
        throw new Error("Invalid XML: " + parseError.textContent)
    }

    function nodeToObj(node: Element): Record<string, unknown> {
        const obj: Record<string, unknown> = {}

        // Attributes
        if (node.attributes.length > 0) {
            const attrs: Record<string, string> = {}
            for (let i = 0; i < node.attributes.length; i++) {
                const attr = node.attributes[i]
                attrs["@" + attr.name] = attr.value
            }
            Object.assign(obj, attrs)
        }

        // Child nodes
        const children = Array.from(node.childNodes)
        const textOnly = children.every(c => c.nodeType === Node.TEXT_NODE || c.nodeType === Node.CDATA_SECTION_NODE)

        if (textOnly) {
            const text = node.textContent?.trim() || ""
            if (Object.keys(obj).length > 0) {
                if (text) obj["#text"] = text
            } else {
                return text as unknown as Record<string, unknown>
            }
        } else {
            const childMap: Record<string, unknown[]> = {}
            for (const child of children) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    const childObj = nodeToObj(child as Element)
                    const name = child.nodeName
                    if (!childMap[name]) childMap[name] = []
                    childMap[name].push(childObj)
                }
            }
            for (const [key, val] of Object.entries(childMap)) {
                obj[key] = val.length === 1 ? val[0] : val
            }
        }

        return obj
    }

    const root = doc.documentElement
    const result = { [root.nodeName]: nodeToObj(root) }
    return JSON.stringify(result, null, 2)
}

function queryXPath(xml: string, xpath: string): string[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, "application/xml")

    const parseError = doc.querySelector("parsererror")
    if (parseError) {
        throw new Error("Invalid XML")
    }

    const results: string[] = []
    try {
        const xpathResult = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null)
        let node = xpathResult.iterateNext()
        while (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                results.push(new XMLSerializer().serializeToString(node))
            } else {
                results.push(node.textContent || "")
            }
            node = xpathResult.iterateNext()
        }
    } catch (e) {
        throw new Error("Invalid XPath: " + (e as Error).message)
    }

    return results
}

function validateXml(xml: string): { valid: boolean; error?: string } {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, "application/xml")
    const parseError = doc.querySelector("parsererror")
    if (parseError) {
        return { valid: false, error: parseError.textContent || "Invalid XML" }
    }
    return { valid: true }
}

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>10.99</price>
  </book>
  <book category="non-fiction">
    <title lang="en">Thinking, Fast and Slow</title>
    <author>Daniel Kahneman</author>
    <year>2011</year>
    <price>15.99</price>
  </book>
  <book category="fiction">
    <title lang="fr">Le Petit Prince</title>
    <author>Antoine de Saint-Exupéry</author>
    <year>1943</year>
    <price>8.99</price>
  </book>
</bookstore>`

export default function XmlFormatter() {
    const [input, setInput] = useDocumentField<string>("input", "")
    const [output, setOutput] = useSessionDocumentState("output", "")
    const [error, setError] = useState("")
    const [activeTab, setActiveTab] = useSessionDocumentState<"format" | "convert" | "xpath">("activeTab", "format")
    const [xpathQuery, setXpathQuery] = useDocumentField<string>("xpathQuery", "")
    const [xpathResults, setXpathResults] = useSessionDocumentState<string[]>("xpathResults", [])
    const [validNotice, setValidNotice] = useSessionDocumentState("validNotice", false)
    const shareState = useMemo(
        () => ({ input, activeTab, xpathQuery }),
        [input, activeTab, xpathQuery],
    )
    useUrlState(shareState, (state) => {
        setInput(typeof state.input === "string" ? state.input : "")
        setActiveTab(state.activeTab === "convert" || state.activeTab === "xpath" ? state.activeTab : "format")
        setXpathQuery(typeof state.xpathQuery === "string" ? state.xpathQuery : "")
    })
    const { addEntry } = useToolHistory("xml-formatter", "XML Formatter")
    const { consumePipeData } = useToolPipe()
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState)
    const setStatus = useEditorStatus((s) => s.setStatus)

    useEffect(() => {
        if (input) return
        // Check for smart-paste data from AppHome
        const smartPaste = sessionStorage.getItem("toolbit:smart-paste");
        if (smartPaste) {
            sessionStorage.removeItem("toolbit:smart-paste");
            setInput(smartPaste.trim());
            return;
        }
        const workspaceState = consumeWorkspaceState("xml-formatter")
        if (workspaceState) {
            try {
                const parsed = JSON.parse(workspaceState) as { input?: string; output?: string }
                setInput(parsed.input || "")
                setOutput(parsed.output || "")
            } catch {
                setInput(workspaceState)
            }
            return
        }
        const payload = consumePipeData()
        if (payload?.data) {
            setInput(payload.data)
        }
    }, [consumePipeData, input, setInput, setOutput, consumeWorkspaceState])

    // Live validity for the status bar.
    const liveValid = useMemo(() => {
        if (!input.trim()) return null
        return validateXml(input).valid
    }, [input])

    useEffect(() => {
        setStatus({
            valid: liveValid,
            validityLabel: liveValid === null ? "" : liveValid ? "Valid XML" : "Invalid XML",
        })
    }, [liveValid, setStatus])

    const handlePrettify = useCallback(() => {
        if (!input.trim()) return
        const validation = validateXml(input)
        if (!validation.valid) {
            setError(validation.error || "Invalid XML")
            setOutput("")
            return
        }
        setError("")
        const formatted = prettifyXml(input)
        setOutput(formatted)
        addEntry({ input, output: formatted, metadata: { action: "prettify" } })
    }, [input, addEntry, setOutput])

    const handleMinify = useCallback(() => {
        if (!input.trim()) return
        const validation = validateXml(input)
        if (!validation.valid) {
            setError(validation.error || "Invalid XML")
            setOutput("")
            return
        }
        setError("")
        const minified = minifyXml(input)
        setOutput(minified)
        addEntry({ input, output: minified, metadata: { action: "minify" } })
    }, [input, addEntry, setOutput])

    const handleToJson = useCallback(() => {
        if (!input.trim()) return
        try {
            setError("")
            const json = xmlToJson(input)
            setOutput(json)
            addEntry({ input, output: json, metadata: { action: "xml-to-json" } })
        } catch (e) {
            setError((e as Error).message)
            setOutput("")
        }
    }, [input, addEntry, setOutput])

    const handleXPath = useCallback(() => {
        if (!input.trim() || !xpathQuery.trim()) return
        try {
            setError("")
            const results = queryXPath(input, xpathQuery)
            setXpathResults(results)
            if (results.length === 0) {
                setError("No matches found")
            }
            addEntry({ input: JSON.stringify({ input, xpathQuery }), output: results.join("\n"), metadata: { action: "xpath" } })
        } catch (e) {
            setError((e as Error).message)
            setXpathResults([])
        }
    }, [input, xpathQuery, addEntry, setXpathResults])

    const handleValidate = useCallback(() => {
        if (!input.trim()) return
        const validation = validateXml(input)
        if (validation.valid) {
            setError("")
            setValidNotice(true)
        } else {
            setValidNotice(false)
            setError(validation.error || "Invalid XML")
        }
    }, [input, setValidNotice])

    const handleInputChange = useCallback((value: string) => {
        setInput(value)
        setValidNotice(false)
    }, [setInput, setValidNotice])

    const loadSample = () => {
        setInput(SAMPLE_XML)
        setError("")
        setOutput("")
        setXpathResults([])
        setValidNotice(false)
    }

    const copyText = activeTab === "xpath" ? xpathResults.join("\n") : output
    const hasResults = activeTab === "xpath" ? xpathResults.length > 0 : Boolean(output)

    return (
        <EditorSplit>
            <Panel>
                <PanelHeader
                    title="Input XML"
                    action={
                        <div style={{ display: "flex", gap: 6 }}>
                            <Button variant="secondary" size="sm" iconLeft={<ShieldCheck size={14} />} onClick={handleValidate}>
                                Validate
                            </Button>
                            <Button variant="ghost" size="sm" iconLeft={<Sparkles size={14} />} onClick={loadSample}>
                                Load sample
                            </Button>
                        </div>
                    }
                />
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                        padding: "8px 10px",
                        flexShrink: 0,
                        borderBottom: "1px solid hsl(var(--border-faint))",
                    }}
                >
                    <Tabs
                        variant="segment"
                        items={[
                            { value: "format", label: "Format" },
                            { value: "convert", label: "Convert" },
                            { value: "xpath", label: "XPath" },
                        ]}
                        value={activeTab}
                        onChange={(value) => {
                            setActiveTab(value as "format" | "convert" | "xpath")
                            setError("")
                            setOutput("")
                            setXpathResults([])
                        }}
                    />
                    {activeTab === "format" && (
                        <>
                            <Button size="sm" iconLeft={<FileCode size={14} />} onClick={handlePrettify}>
                                Prettify
                            </Button>
                            <Button variant="secondary" size="sm" iconLeft={<Minimize2 size={14} />} onClick={handleMinify}>
                                Minify
                            </Button>
                        </>
                    )}
                    {activeTab === "convert" && (
                        <Button size="sm" iconLeft={<ArrowRightLeft size={14} />} onClick={handleToJson}>
                            XML to JSON
                        </Button>
                    )}
                    {activeTab === "xpath" && (
                        <>
                            <Input
                                mono
                                value={xpathQuery}
                                onChange={(e) => setXpathQuery(e.target.value)}
                                placeholder="e.g. //book[@category='fiction']/title"
                                onKeyDown={(e) => e.key === "Enter" && handleXPath()}
                                style={{ flex: 1, minWidth: 180 }}
                            />
                            <Button size="sm" iconLeft={<Search size={14} />} onClick={handleXPath}>
                                Query
                            </Button>
                        </>
                    )}
                    {validNotice && (
                        <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--success))" }}>
                            XML is valid
                        </span>
                    )}
                </div>
                <CodeEditor
                    value={input}
                    onChange={handleInputChange}
                    language="text"
                    reportStatus
                    placeholder="Paste your XML here..."
                />
            </Panel>
            <Panel>
                <PanelHeader
                    title={
                        activeTab === "xpath"
                            ? `Results${xpathResults.length > 0 ? ` (${xpathResults.length} match${xpathResults.length !== 1 ? "es" : ""})` : ""}`
                            : "Output"
                    }
                    badge={error ? <ValidityBadge valid={false} invalidLabel="error" /> : undefined}
                    action={<CopyAction text={copyText} />}
                />
                {error ? (
                    <div
                        style={{
                            padding: "10px 12px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-sm)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            color: "hsl(var(--danger))",
                        }}
                    >
                        {error}
                    </div>
                ) : activeTab === "xpath" ? (
                    hasResults ? (
                        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 10, display: "grid", gap: 6, alignContent: "start" }}>
                            {xpathResults.map((result, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "8px 10px",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid hsl(var(--border-faint))",
                                        background: "hsl(var(--surface-1))",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "var(--text-sm)",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-all",
                                        color: "hsl(var(--text-body))",
                                    }}
                                >
                                    {result}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: "10px 12px", fontSize: "var(--text-sm)", color: "hsl(var(--text-faint))" }}>
                            XPath matches will appear here.
                        </div>
                    )
                ) : (
                    <CodeEditor
                        value={output}
                        language={activeTab === "convert" ? "json" : "text"}
                        readOnly
                        placeholder="Output will appear here..."
                    />
                )}
            </Panel>
        </EditorSplit>
    )
}
