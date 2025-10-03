import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { GitCompare } from "lucide-react"
import { ToolCard } from "@/components/ToolCard"

export default function DiffTool() {
    const [text1, setText1] = useState("")
    const [text2, setText2] = useState("")
    const [diffResult, setDiffResult] = useState<string[]>([])

    const generateDiff = () => {
        const lines1 = text1.split('\n')
        const lines2 = text2.split('\n')
        const result: string[] = []

        const maxLines = Math.max(lines1.length, lines2.length)

        for (let i = 0; i < maxLines; i++) {
            const line1 = lines1[i] || ''
            const line2 = lines2[i] || ''

            if (line1 === line2) {
                result.push(`  ${line1}`)
            } else {
                if (line1) result.push(`- ${line1}`)
                if (line2) result.push(`+ ${line2}`)
            }
        }

        setDiffResult(result)
    }

    const loadSample = () => {
        setText1(`function hello() {
  console.log("Hello World");
  return true;
}`)
        setText2(`function hello() {
  console.log("Hello Universe");
  console.log("Additional line");
  return true;
}`)
    }

    const getDiffLineClass = (line: string) => {
        if (line.startsWith('- ')) {
            return 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
        } else if (line.startsWith('+ ')) {
            return 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
        }
        return ''
    }

    return (
        <ToolCard
            title="Diff Tool"
            description="Compare two texts and highlight differences"
            icon={<GitCompare className="h-5 w-5" />}
        >
            <div className="flex gap-2">
                <Button onClick={generateDiff} data-testid="button-compare">
                    Compare Texts
                </Button>
                <Button onClick={loadSample} variant="outline" data-testid="button-sample">
                    Load Sample
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="text1" className="text-sm font-medium">
                        Original Text
                    </label>
                    <Textarea
                        id="text1"
                        placeholder="Enter original text..."
                        value={text1}
                        onChange={(e) => setText1(e.target.value)}
                        className="h-48 font-mono text-sm"
                        data-testid="input-text1"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="text2" className="text-sm font-medium">
                        Modified Text
                    </label>
                    <Textarea
                        id="text2"
                        placeholder="Enter modified text..."
                        value={text2}
                        onChange={(e) => setText2(e.target.value)}
                        className="h-48 font-mono text-sm"
                        data-testid="input-text2"
                    />
                </div>
            </div>

            {diffResult.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Differences
                    </label>
                    <div className="border rounded-md p-3 bg-background max-h-64 overflow-y-auto">
                        <div className="text-xs text-muted-foreground mb-2">
                            <span className="text-red-600">- removed</span> | <span className="text-green-600">+ added</span> | <span>unchanged</span>
                        </div>
                        {diffResult.map((line, index) => (
                            <div
                                key={index}
                                className={`font-mono text-sm px-2 py-0.5 ${getDiffLineClass(line)}`}
                                data-testid={`diff-line-${index}`}
                            >
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ToolCard>
    )
}