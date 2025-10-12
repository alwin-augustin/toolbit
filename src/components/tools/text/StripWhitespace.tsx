import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Eraser } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StripWhitespace() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const { toast } = useToast()

    const stripLeading = () => {
        const result = input.split('\n').map(line => line.replace(/^\s+/, '')).join('\n')
        setOutput(result)
    }

    const stripTrailing = () => {
        const result = input.split('\n').map(line => line.replace(/\s+$/, '')).join('\n')
        setOutput(result)
    }

    const stripLeadingAndTrailing = () => {
        const result = input.split('\n').map(line => line.trim()).join('\n')
        setOutput(result)
    }

    const stripAll = () => {
        const result = input.replace(/\s+/g, ' ').trim()
        setOutput(result)
    }

    const stripEmpty = () => {
        const result = input.split('\n').filter(line => line.trim()).join('\n')
        setOutput(result)
    }

    const normalizeSpacing = () => {
        const result = input
            .split('\n')
            .map(line => line.replace(/\s+/g, ' ').trim())
            .filter(line => line)
            .join('\n')
        setOutput(result)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
        toast({ description: "Copied to clipboard!" })
    }

    const loadSample = () => {
        setInput(`   Leading spaces
Trailing spaces   
  Both leading and trailing  

    Extra     internal    spaces   
   
   Another line with   multiple   spaces   `)
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eraser className="h-5 w-5" />
                    Strip Whitespace
                </CardTitle>
                <CardDescription>
                    Remove leading, trailing, or all whitespace from text
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="whitespace-input" className="text-sm font-medium">
                            Input Text
                        </label>
                        <Textarea
                            id="whitespace-input"
                            placeholder="Paste text with whitespace to clean..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="min-h-[24rem] font-mono text-sm"
                            data-testid="input-whitespace"
                        />
                        <Button onClick={loadSample} variant="outline" data-testid="button-sample">
                            Load Sample
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="whitespace-output" className="text-sm font-medium">
                            Output
                        </label>
                        <Textarea
                            id="whitespace-output"
                            placeholder="Cleaned text will appear here..."
                            value={output}
                            readOnly
                            className="min-h-[24rem] font-mono text-sm"
                            data-testid="output-whitespace"
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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Button onClick={stripLeading} variant="outline" size="sm" data-testid="button-strip-leading">
                        Strip Leading
                    </Button>
                    <Button onClick={stripTrailing} variant="outline" size="sm" data-testid="button-strip-trailing">
                        Strip Trailing
                    </Button>
                    <Button onClick={stripLeadingAndTrailing} variant="outline" size="sm" data-testid="button-strip-both">
                        Strip Both
                    </Button>
                    <Button onClick={stripAll} variant="outline" size="sm" data-testid="button-strip-all">
                        Strip All Extra
                    </Button>
                    <Button onClick={stripEmpty} variant="outline" size="sm" data-testid="button-strip-empty">
                        Remove Empty Lines
                    </Button>
                    <Button onClick={normalizeSpacing} variant="outline" size="sm" data-testid="button-normalize">
                        Normalize All
                    </Button>
                </div>

                <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                    <p className="font-medium">Options:</p>
                    <ul className="text-xs space-y-1">
                        <li><strong>Strip Leading:</strong> Remove spaces/tabs from line beginnings</li>
                        <li><strong>Strip Trailing:</strong> Remove spaces/tabs from line ends</li>
                        <li><strong>Strip Both:</strong> Remove leading and trailing whitespace</li>
                        <li><strong>Strip All Extra:</strong> Replace multiple spaces with single space</li>
                        <li><strong>Remove Empty Lines:</strong> Remove blank lines</li>
                        <li><strong>Normalize All:</strong> Clean everything and remove empty lines</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}