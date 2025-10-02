import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"

export default function JsonFormatter() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [isValid, setIsValid] = useState(true)
    const { toast } = useToast()

    const formatJson = () => {
        try {
            const parsed = JSON.parse(input)
            const formatted = JSON.stringify(parsed, null, 2)
            setOutput(formatted)
            setIsValid(true)
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
            setIsValid(false)
        }
    }

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(input)
            const minified = JSON.stringify(parsed)
            setOutput(minified)
            setIsValid(true)
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
            setIsValid(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
        toast({ description: "Copied to clipboard!" })
    }

    return (
        <ToolCard
            title="JSON Formatter & Validator"
            description="Format, minify, and validate JSON data"
            icon={<FileText className="h-5 w-5" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="json-input" className="text-sm font-medium">
                        Input JSON
                    </label>
                    <Textarea
                        id="json-input"
                        placeholder='{"key": "value"}'
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="min-h-[24rem] font-mono text-sm"
                        data-testid="input-json"
                    />
                    <div className="flex gap-2">
                        <Button onClick={formatJson} data-testid="button-format">
                            Format
                        </Button>
                        <Button onClick={minifyJson} variant="outline" data-testid="button-minify">
                            Minify
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="json-output" className="text-sm font-medium">
                        Output
                    </label>
                    <Textarea
                        id="json-output"
                        placeholder="Formatted JSON will appear here..."
                        value={output}
                        readOnly
                        className={`min-h-[24rem] font-mono text-sm ${isValid ? '' : 'text-destructive'}`}
                        data-testid="output-json"
                    />
                    <Button
                        onClick={copyToClipboard}
                        disabled={!output}
                        variant="outline"
                        data-testid="button-copy"
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </Button>
                </div>
            </div>
        </ToolCard>
    )
}