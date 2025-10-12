import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Type } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"

export default function CaseConverter() {
    const [input, setInput] = useState("")
    const [results, setResults] = useState({
        upper: "",
        lower: "",
        title: "",
        camel: "",
        pascal: "",
        snake: "",
        kebab: "",
        constant: ""
    })
    const { toast } = useToast()

    const convertCases = () => {
        const text = input.trim()

        setResults({
            upper: text.toUpperCase(),
            lower: text.toLowerCase(),
            title: text.replace(/\w\S*/g, (txt) =>
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            ),
            camel: text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                index === 0 ? word.toLowerCase() : word.toUpperCase()
            ).replace(/\s+/g, ''),
            pascal: text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) =>
                word.toUpperCase()
            ).replace(/\s+/g, ''),
            snake: text.toLowerCase().replace(/\s+/g, '_'),
            kebab: text.toLowerCase().replace(/\s+/g, '-'),
            constant: text.toUpperCase().replace(/\s+/g, '_')
        })
    }

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text)
        toast({ description: `${type} case copied to clipboard!` })
    }

    return (
        <ToolCard
            title="Case Converter"
            description="Convert text to different case formats"
            icon={<Type className="h-5 w-5" />}
        >
            <div className="space-y-2">
                <label htmlFor="case-input" className="text-sm font-medium">
                    Input Text
                </label>
                <Textarea
                    id="case-input"
                    placeholder="Hello World Example"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="h-20 font-mono text-sm"
                    data-testid="input-case"
                />
                <Button onClick={convertCases} data-testid="button-convert">
                    Convert All Cases
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                    upper: "UPPER CASE",
                    lower: "lower case",
                    title: "Title Case",
                    camel: "camelCase",
                    pascal: "PascalCase",
                    snake: "snake_case",
                    kebab: "kebab-case",
                    constant: "CONSTANT_CASE"
                }).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                        <label className="text-sm font-medium">{label}</label>
                        <div className="flex gap-2">
                            <Textarea
                                value={results[key as keyof typeof results]}
                                readOnly
                                className="h-10 font-mono text-sm resize-none"
                                data-testid={`output-${key}`}
                            />
                            <Button
                                onClick={() => copyToClipboard(results[key as keyof typeof results], label)}
                                disabled={!results[key as keyof typeof results]}
                                variant="outline"
                                size="icon"
                                data-testid={`button-copy-${key}`}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </ToolCard>
    )
}