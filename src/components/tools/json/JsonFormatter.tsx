import { Button } from "@/components/ui/button";
import { Copy, FileText } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import { useToolIO } from "@/hooks/use-tool-io";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatJson, minifyJson } from "@/services";

export default function JsonFormatter() {
    const { input, output, isValid, error, setInput, setOutput, setValidation } = useToolIO();
    const { copyToClipboard } = useCopyToClipboard();

    const handleFormat = () => {
        const result = formatJson(input, 2);
        if (result.success) {
            setOutput(result.data!);
            setValidation(true);
        } else {
            setOutput(`Error: ${result.error}`);
            setValidation(false, result.error);
        }
    };

    const handleMinify = () => {
        const result = minifyJson(input);
        if (result.success) {
            setOutput(result.data!);
            setValidation(true);
        } else {
            setOutput(`Error: ${result.error}`);
            setValidation(false, result.error);
        }
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
                        <Button onClick={handleFormat} data-testid="button-format">
                            Format
                        </Button>
                        <Button onClick={handleMinify} variant="outline" data-testid="button-minify">
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
                        onClick={() => copyToClipboard(output)}
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
