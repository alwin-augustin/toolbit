import { useSessionDocumentState } from "@/v2/document-state";
import { useDocumentField } from "@/v2/document-state";
import { Sparkles } from "lucide-react"
import { Button, Card, Input, Textarea } from "@/ds/components"
import { CopyAction } from "@/v2/EditorPanels"
import { ToolPage, Field, Row, Grid2, SectionTitle } from "@/v2/restyle-kit"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

const CASE_LABELS: Record<string, string> = {
    upper: "UPPER CASE",
    lower: "lower case",
    title: "Title Case",
    camel: "camelCase",
    pascal: "PascalCase",
    snake: "snake_case",
    kebab: "kebab-case",
    constant: "CONSTANT_CASE",
}

export default function CaseConverter() {
    const [input, setInput] = useDocumentField<string>("input", "")
    const [results, setResults] = useSessionDocumentState("results", {
        upper: "",
        lower: "",
        title: "",
        camel: "",
        pascal: "",
        snake: "",
        kebab: "",
        constant: ""
    })
    useUrlState(input, setInput)
    const { addEntry } = useToolHistory("case-converter", "Case Converter")

    const convertCases = () => {
        const text = input.trim()

        const output = {
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
        }
        setResults(output)
        addEntry({ input, output: JSON.stringify(output, null, 2), metadata: { action: "convert" } })
    }

    return (
        <ToolPage>
            <Card>
                <div style={{ display: "grid", gap: 12 }}>
                    <SectionTitle>Input</SectionTitle>
                    <Field label="Input text" hint="Spaces are converted into separators for snake/kebab/camel.">
                        <Textarea
                            id="case-input"
                            placeholder="Hello World Example"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={3}
                            data-testid="input-case"
                        />
                    </Field>
                    <Row>
                        <Button onClick={convertCases} data-testid="button-convert">
                            Convert all cases
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            iconLeft={<Sparkles size={14} />}
                            onClick={() => setInput("the quick brown fox jumps over the lazy dog")}
                        >
                            Sample
                        </Button>
                    </Row>
                </div>
            </Card>

            <Card>
                <div style={{ display: "grid", gap: 12 }}>
                    <SectionTitle>Results</SectionTitle>
                    <Grid2>
                        {Object.entries(CASE_LABELS).map(([key, label]) => (
                            <Field key={key} label={label}>
                                <Row wrap={false}>
                                    <Input
                                        mono
                                        value={results[key as keyof typeof results]}
                                        readOnly
                                        style={{ flex: 1 }}
                                        data-testid={`output-${key}`}
                                    />
                                    <CopyAction text={results[key as keyof typeof results]} />
                                </Row>
                            </Field>
                        ))}
                    </Grid2>
                </div>
            </Card>
        </ToolPage>
    )
}
