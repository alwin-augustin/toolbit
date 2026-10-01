import { useSessionDocumentState } from "@/v2/document-state";
import { useCallback, useMemo } from "react"
import { RefreshCw } from "lucide-react"
import { Button, Badge, Input, Checkbox, Tabs } from "@/ds/components"
import { CodeEditor } from "@/v2/CodeEditor"
import { Panel, PanelHeader, CopyAction, EditorSplit } from "@/v2/EditorPanels"
import { Field, Row } from "@/v2/restyle-kit"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

const LOREM_WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
    "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
    "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
    "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
    "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
    "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
    "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
    "deserunt", "mollit", "anim", "id", "est", "laborum", "perspiciatis", "unde",
    "omnis", "iste", "natus", "error", "voluptatem", "accusantium", "doloremque",
    "laudantium", "totam", "rem", "aperiam", "eaque", "ipsa", "quae", "ab", "illo",
    "inventore", "veritatis", "quasi", "architecto", "beatae", "vitae", "dicta",
    "explicabo", "nemo", "ipsam", "quia", "voluptas", "aspernatur", "aut", "odit",
    "fugit", "consequuntur", "magni", "dolores", "eos", "ratione", "sequi",
    "nesciunt", "neque", "porro", "quisquam", "dolorem", "adipisci", "numquam",
    "eius", "modi", "tempora", "magnam", "quaerat", "minima", "nostrum",
    "exercitationem", "ullam", "corporis", "suscipit", "laboriosam",
]

type GenerateMode = "paragraphs" | "sentences" | "words"

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function generateWords(count: number): string[] {
    const words: string[] = []
    for (let i = 0; i < count; i++) {
        words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)])
    }
    return words
}

function generateSentence(minWords = 6, maxWords = 15): string {
    const count = minWords + Math.floor(Math.random() * (maxWords - minWords + 1))
    const words = generateWords(count)
    return capitalize(words.join(" ")) + "."
}

function generateParagraph(minSentences = 3, maxSentences = 7): string {
    const count = minSentences + Math.floor(Math.random() * (maxSentences - minSentences + 1))
    const sentences: string[] = []
    for (let i = 0; i < count; i++) {
        sentences.push(generateSentence())
    }
    return sentences.join(" ")
}

export default function LoremIpsumGenerator() {
    const [count, setCount] = useSessionDocumentState("count", 3)
    const [mode, setMode] = useSessionDocumentState<GenerateMode>("mode", "paragraphs")
    const [startWithLorem, setStartWithLorem] = useSessionDocumentState("startWithLorem", true)
    const [htmlOutput, setHtmlOutput] = useSessionDocumentState("htmlOutput", false)
    const [output, setOutput] = useSessionDocumentState("output", "")
    const shareState = useMemo(
        () => ({ count, mode, startWithLorem, htmlOutput }),
        [count, mode, startWithLorem, htmlOutput],
    )
    useUrlState(shareState, (state) => {
        setCount(typeof state.count === "number" ? state.count : 3)
        setMode(state.mode === "sentences" || state.mode === "words" ? state.mode : "paragraphs")
        setStartWithLorem(state.startWithLorem !== false)
        setHtmlOutput(state.htmlOutput === true)
    })
    const { addEntry } = useToolHistory("lorem-ipsum-generator", "Lorem Ipsum")

    const generate = useCallback(() => {
        let result: string

        switch (mode) {
            case "paragraphs": {
                const paragraphs: string[] = []
                for (let i = 0; i < count; i++) {
                    let p = generateParagraph()
                    if (i === 0 && startWithLorem) {
                        p = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + p
                    }
                    paragraphs.push(p)
                }
                result = htmlOutput
                    ? paragraphs.map(p => `<p>${p}</p>`).join("\n\n")
                    : paragraphs.join("\n\n")
                break
            }
            case "sentences": {
                const sentences: string[] = []
                for (let i = 0; i < count; i++) {
                    sentences.push(generateSentence())
                }
                if (startWithLorem && sentences.length > 0) {
                    sentences[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                }
                result = sentences.join(" ")
                break
            }
            case "words": {
                const words = generateWords(count)
                if (startWithLorem && words.length >= 2) {
                    words[0] = "lorem"
                    words[1] = "ipsum"
                }
                result = words.join(" ")
                break
            }
        }

        setOutput(result)
        addEntry({
            input: JSON.stringify({ count, mode, startWithLorem, htmlOutput }),
            output: result,
            metadata: { action: "generate" },
        })
    }, [count, mode, startWithLorem, htmlOutput, addEntry, setOutput])

    return (
        <EditorSplit>
            <Panel>
                <PanelHeader
                    title="Lorem Ipsum"
                    badge={output ? <Badge tone="primary">{`${count} ${mode}`}</Badge> : undefined}
                    action={
                        <div style={{ display: "flex", gap: 6 }}>
                            <Button size="sm" iconLeft={<RefreshCw size={13} />} onClick={generate}>
                                Generate
                            </Button>
                            <CopyAction text={output} />
                        </div>
                    }
                />
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                        gap: 16,
                        padding: "10px 12px",
                        borderBottom: "1px solid hsl(var(--border-faint))",
                        background: "hsl(var(--surface-1))",
                        flexShrink: 0,
                    }}
                >
                    <Field label="Count">
                        <Input
                            id="lorem-count"
                            type="number"
                            min={1}
                            max={100}
                            value={count}
                            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: 90 }}
                        />
                    </Field>
                    <Field label="Type">
                        <Tabs
                            variant="segment"
                            items={[
                                { value: "paragraphs", label: "Paragraphs" },
                                { value: "sentences", label: "Sentences" },
                                { value: "words", label: "Words" },
                            ]}
                            value={mode}
                            onChange={(v) => setMode(v as GenerateMode)}
                        />
                    </Field>
                    <Row gap={16}>
                        <Checkbox
                            checked={startWithLorem}
                            onChange={setStartWithLorem}
                            label={'Start with "Lorem ipsum..."'}
                        />
                        {mode === "paragraphs" && (
                            <Checkbox
                                checked={htmlOutput}
                                onChange={setHtmlOutput}
                                label={"HTML <p> tags"}
                            />
                        )}
                    </Row>
                </div>
                <CodeEditor
                    value={output}
                    readOnly
                    showLineNumbers={false}
                    placeholder="Press Generate to create placeholder text."
                />
            </Panel>
        </EditorSplit>
    )
}
