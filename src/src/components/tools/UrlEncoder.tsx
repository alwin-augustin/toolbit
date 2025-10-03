import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Link } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"

export default function UrlEncoder() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const { toast } = useToast()

    const encode = () => {
        const encoded = encodeURIComponent(input)
        setOutput(encoded)
    }

    const decode = () => {
        try {
            const decoded = decodeURIComponent(input)
            setOutput(decoded)
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : 'Invalid URL encoding'}`)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
        toast({ description: "Copied to clipboard!" })
    }

    return (
        <ToolCard
            title="URL Encoder / Decoder"
            description="Encode text for URLs or decode URL-encoded text"
            icon={<Link className="h-5 w-5" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="url-input" className="text-sm font-medium">
                        Input
                    </label>
                    <Textarea
                        id="url-input"
                        placeholder="Enter text to encode or URL-encoded text to decode..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="min-h-[24rem] font-mono text-sm"
                        data-testid="input-url"
                    />
                    <div className="flex gap-2">
                        <Button onClick={encode} data-testid="button-encode">
                            Encode
                        </Button>
                        <Button onClick={decode} variant="outline" data-testid="button-decode">
                            Decode
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="url-output" className="text-sm font-medium">
                        Output
                    </label>
                    <Textarea
                        id="url-output"
                        placeholder="Result will appear here..."
                        value={output}
                        readOnly
                        className="min-h-[24rem] font-mono text-sm"
                        data-testid="output-url"
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