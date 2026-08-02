import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import { Button, Badge } from "@/ds/components"
import { CodeEditor } from "@/v2/CodeEditor"
import { Panel, PanelHeader, EditorSplit } from "@/v2/EditorPanels"
import { SectionTitle, Stat } from "@/v2/restyle-kit"
import { useUrlState } from "@/hooks/use-url-state"

const SAMPLE_TEXT =
    "The quick brown fox jumps over the lazy dog. This is a sample paragraph for testing the word counter tool.\n\nIt contains multiple sentences and paragraphs. You can see the statistics update in real time as you type!"

export default function WordCounter() {
    const [text, setText] = useState("")
    useUrlState(text, setText)
    const [stats, setStats] = useState({
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        lines: 0,
        paragraphs: 0,
        sentences: 0
    })

    useEffect(() => {
        const characters = text.length
        const charactersNoSpaces = text.replace(/\s/g, '').length
        const words = text.trim() ? text.trim().split(/\s+/).length : 0
        const lines = text ? text.split('\n').length : 0
        const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0
        const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0

        setStats({
            characters,
            charactersNoSpaces,
            words,
            lines,
            paragraphs,
            sentences
        })
    }, [text])

    return (
        <EditorSplit>
            <Panel>
                <PanelHeader
                    title="Text"
                    action={
                        <Button
                            variant="ghost"
                            size="sm"
                            iconLeft={<Sparkles size={13} />}
                            onClick={() => setText(SAMPLE_TEXT)}
                        >
                            Sample
                        </Button>
                    }
                />
                <CodeEditor
                    value={text}
                    onChange={setText}
                    reportStatus
                    showLineNumbers={false}
                    placeholder="Type or paste your text here..."
                />
            </Panel>
            <Panel>
                <PanelHeader
                    title="Statistics"
                    badge={text.trim() ? <Badge tone="primary">{stats.words.toLocaleString()} words</Badge> : undefined}
                />
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px", display: "grid", gap: 4, alignContent: "start" }}>
                    <SectionTitle>Counts</SectionTitle>
                    <Stat label="Words" value={stats.words.toLocaleString()} />
                    <Stat label="Characters" value={stats.characters.toLocaleString()} />
                    <Stat label="Characters (no spaces)" value={stats.charactersNoSpaces.toLocaleString()} />
                    <div style={{ borderTop: "1px solid hsl(var(--border-faint))", margin: "6px 0" }} />
                    <SectionTitle>Structure</SectionTitle>
                    <Stat label="Lines" value={stats.lines.toLocaleString()} />
                    <Stat label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
                    <Stat label="Sentences" value={stats.sentences.toLocaleString()} />
                </div>
            </Panel>
        </EditorSplit>
    )
}
