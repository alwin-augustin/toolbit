import { useDocumentField } from "@/v2/document-state"
import { normalizeText } from "@/lib/tool-contract"
import { Button, Tooltip } from "@/ds/components"
import { CodeEditor } from "@/v2/CodeEditor"
import { Panel, PanelHeader, CopyAction, EditorSplit } from "@/v2/EditorPanels"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

export default function StripWhitespace() {
    const [input, setInput] = useDocumentField<string>("input", "")
    const [output, setOutput] = useDocumentField<string>("output", "")
    useUrlState(input, setInput)
    const { addEntry } = useToolHistory("strip-whitespace", "Strip Whitespace")

    const stripLeading = () => {
        const result = normalizeText(input, "strip-leading")
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "strip-leading" } })
    }

    const stripTrailing = () => {
        const result = normalizeText(input, "strip-trailing")
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "strip-trailing" } })
    }

    const stripLeadingAndTrailing = () => {
        const result = normalizeText(input, "strip-both")
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "strip-both" } })
    }

    const stripAll = () => {
        const result = normalizeText(input, "strip-all")
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "strip-all" } })
    }

    const stripEmpty = () => {
        const result = normalizeText(input, "remove-empty")
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "remove-empty" } })
    }

    const normalizeSpacing = () => {
        const result = normalizeText(input, "normalize")
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "normalize" } })
    }

    const loadSample = () => {
        setInput(`   Leading spaces
Trailing spaces
  Both leading and trailing

    Extra     internal    spaces

   Another line with   multiple   spaces   `)
    }

    const actions: Array<{ label: string; hint: string; onClick: () => void }> = [
        { label: "Strip leading", hint: "Remove spaces/tabs from line beginnings", onClick: stripLeading },
        { label: "Strip trailing", hint: "Remove spaces/tabs from line ends", onClick: stripTrailing },
        { label: "Strip both", hint: "Remove leading and trailing whitespace", onClick: stripLeadingAndTrailing },
        { label: "Strip all extra", hint: "Replace multiple spaces with single space", onClick: stripAll },
        { label: "Remove empty lines", hint: "Remove blank lines", onClick: stripEmpty },
        { label: "Normalize all", hint: "Clean everything and remove empty lines", onClick: normalizeSpacing },
    ]

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "12px 12px 0" }}>
                {actions.map((action) => (
                    <Tooltip key={action.label} label={action.hint} side="bottom">
                        <Button variant="outline" size="sm" onClick={action.onClick}>
                            {action.label}
                        </Button>
                    </Tooltip>
                ))}
            </div>
            <EditorSplit toolId="strip-whitespace" output={output}>
                <Panel>
                    <PanelHeader
                        title="Input text"
                        action={
                            <Button variant="ghost" size="sm" onClick={loadSample}>
                                Load sample
                            </Button>
                        }
                    />
                    <CodeEditor
                        value={input}
                        onChange={setInput}
                        reportStatus
                        placeholder="Paste text with whitespace to clean…"
                    />
                </Panel>
                <Panel>
                    <PanelHeader title="Output" action={<CopyAction text={output} />} />
                    <CodeEditor value={output} readOnly placeholder="Cleaned text will appear here…" />
                </Panel>
            </EditorSplit>
        </div>
    )
}
