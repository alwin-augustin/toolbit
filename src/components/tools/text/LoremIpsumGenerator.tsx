import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, TextCursorInput, Trash2 } from "lucide-react"
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
    const [count, setCount] = useState(3)
    const [mode, setMode] = useState<GenerateMode>("paragraphs")
    const [startWithLorem, setStartWithLorem] = useState(true)
    const [htmlOutput, setHtmlOutput] = useState(false)
    const [output, setOutput] = useState("")
    const { toast } = useToast()
    const shareState = useMemo(
        () => ({ count, mode, startWithLorem, htmlOutput }),
        [count, mode, startWithLorem, htmlOutput],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
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
    }, [count, mode, startWithLorem, htmlOutput, addEntry])

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
        toast({ description: "Copied to clipboard!" })
    }

    return (
        <ToolCard
            title="Lorem Ipsum Generator"
            description="Generate placeholder text for designs and mockups"
            icon={<TextCursorInput className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "lorem-ipsum-generator",
                toolName: "Lorem Ipsum Generator",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as { count?: number; mode?: GenerateMode; startWithLorem?: boolean; htmlOutput?: boolean }
                        setCount(typeof parsed.count === "number" ? parsed.count : 3)
                        setMode(parsed.mode === "sentences" || parsed.mode === "words" ? parsed.mode : "paragraphs")
                        setStartWithLorem(parsed.startWithLorem !== false)
                        setHtmlOutput(parsed.htmlOutput === true)
                        if (entry.output) setOutput(entry.output)
                    } catch {
                        // ignore
                    }
                },
            }}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <label htmlFor="lorem-count" className="text-sm font-medium">Count</label>
                    <Input
                        id="lorem-count"
                        type="number"
                        min={1}
                        max={100}
                        value={count}
                        onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <div className="flex gap-1">
                        {(["paragraphs", "sentences", "words"] as GenerateMode[]).map((m) => (
                            <Button
                                key={m}
                                variant={mode === m ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMode(m)}
                                className="text-xs capitalize"
                            >
                                {m}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Options</label>
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={startWithLorem}
                                onChange={(e) => setStartWithLorem(e.target.checked)}
                                className="rounded"
                            />
                            Start with "Lorem ipsum..."
                        </label>
                        {mode === "paragraphs" && (
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={htmlOutput}
                                    onChange={(e) => setHtmlOutput(e.target.checked)}
                                    className="rounded"
                                />
                                HTML {"<p>"} tags
                            </label>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button onClick={generate}>Generate</Button>
                {output && (
                    <>
                        <Button variant="outline" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                        <Button variant="outline" onClick={() => setOutput("")}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    </>
                )}
            </div>

            {output && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Output</label>
                    <Textarea
                        value={output}
                        readOnly
                        className="min-h-[200px] font-mono text-sm"
                    />
                </div>
            )}
        </ToolCard>
    )
}
