import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Hash, Sparkles } from "lucide-react"
import { ToolCard } from "@/components/ToolCard"
import { useUrlState } from "@/hooks/use-url-state"

export default function WordCounter() {
    const [text, setText] = useState("")
    const { getShareUrl } = useUrlState(text, setText)
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
        <ToolCard
            title="Word Counter"
            description="Count words, characters, lines, and more"
            icon={<Hash className="h-5 w-5" />}
            shareUrl={getShareUrl()}
        >
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="word-input" className="text-sm font-medium">
                        Enter your text
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => setText("The quick brown fox jumps over the lazy dog. This is a sample paragraph for testing the word counter tool.\n\nIt contains multiple sentences and paragraphs. You can see the statistics update in real time as you type!")}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Sample
                    </Button>
                </div>
                <Textarea
                    id="word-input"
                    placeholder="Type or paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[24rem] text-sm"
                    data-testid="input-text"
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold text-primary" data-testid="count-words">
                        {stats.words.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Words</div>
                </div>

                <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold text-primary" data-testid="count-characters">
                        {stats.characters.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Characters</div>
                </div>

                <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold text-primary" data-testid="count-characters-no-spaces">
                        {stats.charactersNoSpaces.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Characters (no spaces)</div>
                </div>

                <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold text-primary" data-testid="count-lines">
                        {stats.lines.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Lines</div>
                </div>

                <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold text-primary" data-testid="count-paragraphs">
                        {stats.paragraphs.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Paragraphs</div>
                </div>

                <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold text-primary" data-testid="count-sentences">
                        {stats.sentences.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Sentences</div>
                </div>
            </div>
        </ToolCard>
    )
}
