import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, FileCode, Minimize2, ArrowRightLeft, Search } from "lucide-react"
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
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [error, setError] = useState("")
    const [activeTab, setActiveTab] = useState<"format" | "convert" | "xpath">("format")
    const [xpathQuery, setXpathQuery] = useState("")
    const [xpathResults, setXpathResults] = useState<string[]>([])
    const { toast } = useToast()
    const shareState = useMemo(
        () => ({ input, activeTab, xpathQuery }),
        [input, activeTab, xpathQuery],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setInput(typeof state.input === "string" ? state.input : "")
        setActiveTab(state.activeTab === "convert" || state.activeTab === "xpath" ? state.activeTab : "format")
        setXpathQuery(typeof state.xpathQuery === "string" ? state.xpathQuery : "")
    })
    const { addEntry } = useToolHistory("xml-formatter", "XML Formatter")
    const { consumePipeData } = useToolPipe()
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState)

    useEffect(() => {
        if (input) return
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
    }, [input, addEntry])

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
    }, [input, addEntry])

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
    }, [input, addEntry])

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
    }, [input, xpathQuery, addEntry])

    const handleValidate = useCallback(() => {
        if (!input.trim()) return
        const validation = validateXml(input)
        if (validation.valid) {
            setError("")
            toast({ description: "XML is valid" })
        } else {
            setError(validation.error || "Invalid XML")
        }
    }, [input, toast])

    const copyOutput = () => {
        const text = activeTab === "xpath" ? xpathResults.join("\n") : output
        navigator.clipboard.writeText(text)
        toast({ description: "Copied!" })
    }

    const loadSample = () => {
        setInput(SAMPLE_XML)
        setError("")
        setOutput("")
        setXpathResults([])
    }

    return (
        <ToolCard
            title="XML Formatter"
            description="Format, minify, convert, and query XML data"
            icon={<FileCode className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "xml-formatter",
                toolName: "XML Formatter",
                onRestore: (entry) => {
                    setInput(entry.input || "")
                    setOutput(entry.output || "")
                },
            }}
            pipeSource={{
                toolId: "xml-formatter",
                output: output || "",
            }}
        >
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 border rounded-md p-0.5">
                    {(["format", "convert", "xpath"] as const).map(tab => (
                        <button
                            key={tab}
                            className={`px-3 py-1.5 text-sm font-medium rounded capitalize transition-colors ${
                                activeTab === tab
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => { setActiveTab(tab); setError(""); setOutput(""); setXpathResults([]) }}
                        >
                            {tab === "xpath" ? "XPath" : tab}
                        </button>
                    ))}
                </div>
                <Button variant="outline" size="sm" onClick={loadSample}>
                    Sample
                </Button>
                <Button variant="outline" size="sm" onClick={handleValidate}>
                    Validate
                </Button>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Input XML</label>
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your XML here..."
                    className="min-h-[200px] font-mono text-sm"
                />
            </div>

            {activeTab === "format" && (
                <div className="flex gap-2">
                    <Button onClick={handlePrettify}>
                        <FileCode className="h-4 w-4 mr-1" />
                        Prettify
                    </Button>
                    <Button variant="outline" onClick={handleMinify}>
                        <Minimize2 className="h-4 w-4 mr-1" />
                        Minify
                    </Button>
                </div>
            )}

            {activeTab === "convert" && (
                <div className="flex gap-2">
                    <Button onClick={handleToJson}>
                        <ArrowRightLeft className="h-4 w-4 mr-1" />
                        XML to JSON
                    </Button>
                </div>
            )}

            {activeTab === "xpath" && (
                <div className="flex gap-2">
                    <Input
                        value={xpathQuery}
                        onChange={(e) => setXpathQuery(e.target.value)}
                        placeholder="e.g. //book[@category='fiction']/title"
                        className="flex-1 font-mono text-sm"
                        onKeyDown={(e) => e.key === "Enter" && handleXPath()}
                    />
                    <Button onClick={handleXPath}>
                        <Search className="h-4 w-4 mr-1" />
                        Query
                    </Button>
                </div>
            )}

            {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-md font-mono whitespace-pre-wrap">
                    {error}
                </div>
            )}

            {activeTab !== "xpath" && output && (
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium">Output</label>
                        <Button variant="outline" size="sm" onClick={copyOutput}>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                        </Button>
                    </div>
                    <Textarea
                        value={output}
                        readOnly
                        className="min-h-[200px] font-mono text-sm"
                    />
                </div>
            )}

            {activeTab === "xpath" && xpathResults.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium">
                            Results ({xpathResults.length} match{xpathResults.length !== 1 ? "es" : ""})
                        </label>
                        <Button variant="outline" size="sm" onClick={copyOutput}>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {xpathResults.map((result, i) => (
                            <div key={i} className="p-2 rounded border bg-muted/30 font-mono text-sm whitespace-pre-wrap break-all">
                                {result}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ToolCard>
    )
}
