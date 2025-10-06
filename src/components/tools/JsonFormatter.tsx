import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToolCard } from "@/components/ToolCard";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";



export default function JsonFormatter() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [isValid, setIsValid] = useState(true);
    const { toast } = useToast();

    const formatJson = () => {
        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            setOutput(formatted);
            setIsValid(true);
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
            setIsValid(false);
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
            setIsValid(true);
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
            setIsValid(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output);
        toast({ description: "Copied to clipboard!" });
    };
    
    const editorClassName = "flex-grow min-h-[20rem] font-mono text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

    return (
        <ToolCard
            title="JSON Formatter & Validator"
            description="Format, minify, and validate JSON data"
            icon={<FileText className="h-5 w-5" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="json-input" className="text-sm font-medium">
                        Input JSON
                    </label>
                    <Editor
                        id="json-input"
                        value={input}
                        onValueChange={setInput}
                        highlight={(code) => Prism.highlight(code, Prism.languages.json, "json")}
                        padding={10}
                        className={editorClassName}
                        data-testid="input-json"
                        placeholder='{"key": "value"}'
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

                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="json-output" className="text-sm font-medium">
                        Output
                    </label>
                    <Editor
                        id="json-output"
                        value={output}
                        onValueChange={() => {}}
                        readOnly
                        highlight={(code) => Prism.highlight(code, Prism.languages.json, "json")}
                        padding={10}
                        className={`${editorClassName} ${isValid ? "" : "text-destructive"}`}
                        data-testid="output-json"
                        placeholder="Formatted JSON will appear here..."
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
    );
}
