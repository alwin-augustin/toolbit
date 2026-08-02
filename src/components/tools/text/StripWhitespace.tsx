import { useState } from "react"
import { Button, Tooltip } from "@/ds/components"
import { CodeEditor } from "@/v2/CodeEditor"
import { Panel, PanelHeader, CopyAction, EditorSplit } from "@/v2/EditorPanels"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

export default function StripWhitespace() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    useUrlState(input, setInput)
    const { addEntry } = useToolHistory("strip-whitespace", "Strip Whitespace")

    const stripLeading = () => {
        const result = input.split('\n').map(line => line.replace(/^\s+/, '')).join('\n')
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "strip-leading" } })
    }

    const stripTrailing = () => {
        const result = input.split('\n').map(line => line.replace(/\s+$/, '')).join('\n')
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "strip-trailing" } })
    }

    const stripLeadingAndTrailing = () => {
        const result = input.split('\n').map(line => line.trim()).join('\n')
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "strip-both" } })
    }

    const stripAll = () => {
        const result = input.replace(/\s+/g, ' ').trim()
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "strip-all" } })
    }

    const stripEmpty = () => {
        const result = input.split('\n').filter(line => line.trim()).join('\n')
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "remove-empty" } })
    }

    const normalizeSpacing = () => {
        const result = input
            .split('\n')
            .map(line => line.replace(/\s+/g, ' ').trim())
            .filter(line => line)
            .join('\n')
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
            <EditorSplit>
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
