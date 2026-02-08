import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { ToolCard } from "@/components/ToolCard";
import { useUrlState } from "@/hooks/use-url-state";
import { useToolHistory } from "@/hooks/use-tool-history";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";



export default function JsonValidator() {
    const [jsonData, setJsonData] = useState("");
    const [schema, setSchema] = useState("");
    const [result, setResult] = useState("");
    const [isValid, setIsValid] = useState(true);
    const [jsonReady, setJsonReady] = useState(false);
    const shareState = useMemo(() => ({ jsonData, schema }), [jsonData, schema]);
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setJsonData(typeof state.jsonData === "string" ? state.jsonData : "");
        setSchema(typeof state.schema === "string" ? state.schema : "");
    });
    const { addEntry } = useToolHistory("json-validator", "JSON Validator");

    useEffect(() => {
        let active = true;
        import("prismjs/components/prism-json")
            .then(() => {
                if (active) setJsonReady(true);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    const validateJson = () => {
        try {
            const parsedData = JSON.parse(jsonData);
            const parsedSchema = JSON.parse(schema);

            const ajv = new Ajv();
            addFormats(ajv);
            const validate = ajv.compile(parsedSchema);
            const valid = validate(parsedData);

            if (valid) {
                setResult("✅ JSON is valid according to the schema");
                setIsValid(true);
                addEntry({ input: JSON.stringify({ jsonData, schema }), output: "valid", metadata: { action: "validate" } });
            } else {
                const errors = validate.errors?.map(err =>
                    `${err.instancePath || 'root'}: ${err.message}`
                ).join('\n') || 'Unknown validation error';
                setResult(`❌ Validation failed:\n${errors}`);
                setIsValid(false);
                addEntry({ input: JSON.stringify({ jsonData, schema }), output: errors, metadata: { action: "validate" } });
            }
        } catch (error) {
            setResult(`Error: ${error instanceof Error ? error.message : 'Invalid JSON or schema'}`);
            setIsValid(false);
            addEntry({ input: JSON.stringify({ jsonData, schema }), output: "error", metadata: { action: "validate" } });
        }
    };

    const editorClassName = "flex-grow min-h-[20rem] font-mono text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

    return (
        <ToolCard
            title="JSON Schema Validator"
            description="Validate JSON data against a JSON schema"
            icon={<Shield className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "json-validator",
                toolName: "JSON Validator",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as { jsonData?: string; schema?: string };
                        setJsonData(parsed.jsonData || "");
                        setSchema(parsed.schema || "");
                    } catch {
                        setJsonData(entry.input || "");
                    }
                },
            }}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="json-schema" className="text-sm font-medium">
                        JSON Schema
                    </label>
                    <Editor
                        id="json-schema"
                        placeholder='{"type": "object", "properties": {"name": {"type": "string"}}}'
                        value={schema}
                        onValueChange={setSchema}
                        highlight={(code) => (jsonReady && Prism.languages.json ? Prism.highlight(code, Prism.languages.json, "json") : code)}
                        padding={10}
                        className={editorClassName}
                        data-testid="input-json-schema"
                    />
                </div>
                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="json-data" className="text-sm font-medium">
                        JSON Data
                    </label>
                    <Editor
                        id="json-data"
                        placeholder='{"name": "John", "age": 30}'
                        value={jsonData}
                        onValueChange={setJsonData}
                        highlight={(code) => (jsonReady && Prism.languages.json ? Prism.highlight(code, Prism.languages.json, "json") : code)}
                        padding={10}
                        className={editorClassName}
                        data-testid="input-json-data"
                    />
                </div>
            </div>

            <Button onClick={validateJson} className="w-full" data-testid="button-validate">
                <Shield className="h-4 w-4 mr-2" />
                Validate
            </Button>

            {result && (
                <div className={`p-4 rounded-md border ${isValid ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'}`}>
                    <div className="flex items-start gap-2">
                        {isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                        )}
                        <pre className="text-sm whitespace-pre-wrap font-mono" data-testid="validation-result">
                            {result}
                        </pre>
                    </div>
                </div>
            )}
        </ToolCard>
    );
}
