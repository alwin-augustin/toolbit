import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, FileText, ArrowLeftRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as yaml from "js-yaml"
import { ToolCard } from "@/components/ToolCard"

export default function YamlFormatter() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [isValid, setIsValid] = useState(true)
    const { toast } = useToast()

    const formatYaml = () => {
        try {
            const parsed = yaml.load(input)
            const formatted = yaml.dump(parsed, { indent: 2 })
            setOutput(formatted)
            setIsValid(true)
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : 'Invalid YAML'}`)
            setIsValid(false)
        }
    }

    const yamlToJson = () => {
        try {
            const parsed = yaml.load(input)
            const json = JSON.stringify(parsed, null, 2)
            setOutput(json)
            setIsValid(true)
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : 'Invalid YAML'}`)
            setIsValid(false)
        }
    }

    const jsonToYaml = () => {
        try {
            const parsed = JSON.parse(input)
            const yamlOutput = yaml.dump(parsed, { indent: 2 })
            setOutput(yamlOutput)
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
            title="YAML Formatter & Converter"
            description="Format YAML and convert between YAML and JSON"
            icon={<FileText className="h-5 w-5" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="yaml-input" className="text-sm font-medium">
                        Input (YAML or JSON)
                    </label>
                    <Textarea
                        id="yaml-input"
                        placeholder="key: value"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-grow font-mono text-sm"
                        data-testid="input-yaml"
                    />
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={formatYaml} data-testid="button-format-yaml">
                            Format YAML
                        </Button>
                        <Button onClick={yamlToJson} variant="outline" data-testid="button-yaml-to-json">
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            YAML → JSON
                        </Button>
                        <Button onClick={jsonToYaml} variant="outline" data-testid="button-json-to-yaml">
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            JSON → YAML
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="yaml-output" className="text-sm font-medium">
                        Output
                    </label>
                    <Textarea
                        id="yaml-output"
                        placeholder="Formatted output will appear here..."
                        value={output}
                        readOnly
                        className={`flex-grow font-mono text-sm ${isValid ? '' : 'text-destructive'}`}
                        data-testid="output-yaml"
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