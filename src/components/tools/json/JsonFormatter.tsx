import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, FileText, Sparkles, Trash2, TreePine, Code, Search, FileCode, Braces, AlertTriangle } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-go";
import "prismjs/components/prism-python";
import { useToolIO } from "@/hooks/use-tool-io";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useUrlState } from "@/hooks/use-url-state";
import { formatJson, minifyJson } from "@/services";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileDropZone } from "@/components/FileDropZone";
import { JsonTreeView } from "./JsonTreeView";
import { runInWorker } from "@/lib/worker-utils";
import { formatJsonWorker, minifyJsonWorker } from "@/workers/json-worker";
import { useToolHistory } from "@/hooks/use-tool-history";
import { useToolPipe } from "@/hooks/use-tool-pipe";
import { useWorkspace } from "@/hooks/use-workspace";
import {
    queryJsonPath,
    generateJsonSchema,
    jsonToTypeScript,
    jsonToGo,
    jsonToPython,
} from "./json-utils";

const SAMPLE_JSON = `{
  "store": {
    "name": "BookStore",
    "books": [
      { "title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "price": 10.99, "inStock": true },
      { "title": "1984", "author": "George Orwell", "price": 8.99, "inStock": true },
      { "title": "Moby Dick", "author": "Herman Melville", "price": 12.50, "inStock": false }
    ],
    "location": { "city": "New York", "zip": "10001" }
  }
}`;

type OutputView = "text" | "tree";
type AdvancedTab = "none" | "query" | "schema" | "types";
type TypeLang = "typescript" | "go" | "python";

const SIZE_WARNING_BYTES = 1_000_000; // 1MB
const TREE_DISABLED_BYTES = 5_000_000; // 5MB
const WORKER_THRESHOLD_BYTES = 200_000; // 200KB

export default function JsonFormatter() {
    const { input, output, isValid, setInput, setOutput, setValidation, clear } = useToolIO();
    const { copyToClipboard } = useCopyToClipboard();
    const { getShareUrl } = useUrlState(input, setInput);
    const { addEntry } = useToolHistory("json-formatter", "JSON Formatter");
    const { consumePipeData } = useToolPipe();
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState);
    const [outputView, setOutputView] = useState<OutputView>("text");
    const [indentSize, setIndentSize] = useState(2);
    const [advancedTab, setAdvancedTab] = useState<AdvancedTab>("none");

    // JSONPath state
    const [jsonPathQuery, setJsonPathQuery] = useState("$.store.books[*].title");
    const [jsonPathResult, setJsonPathResult] = useState("");

    // Schema state
    const [schemaOutput, setSchemaOutput] = useState("");

    // Types state
    const [typeLang, setTypeLang] = useState<TypeLang>("typescript");
    const [typeOutput, setTypeOutput] = useState("");

    const inputSizeBytes = new Blob([input]).size;
    const isLargeFile = inputSizeBytes > SIZE_WARNING_BYTES;
    const treeDisabled = inputSizeBytes > TREE_DISABLED_BYTES;

    const parsedJson = useMemo(() => {
        if (!output || !isValid) return null;
        try {
            return JSON.parse(output);
        } catch {
            return null;
        }
    }, [output, isValid]);

    const handleFormat = useCallback(async () => {
        if (!input.trim()) return;
        if (inputSizeBytes > WORKER_THRESHOLD_BYTES) {
            try {
                const result = await runInWorker(formatJsonWorker, [input, indentSize]);
                setOutput(result);
                setValidation(true);
                await addEntry({ input, output: result, metadata: { action: "format", indentSize } });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Invalid JSON";
                setOutput(`Error: ${message}`);
                setValidation(false, message);
            }
            return;
        }

        const result = formatJson(input, indentSize);
        if (result.success) {
            setOutput(result.data!);
            setValidation(true);
            await addEntry({ input, output: result.data!, metadata: { action: "format", indentSize } });
        } else {
            setOutput(`Error: ${result.error}`);
            setValidation(false, result.error);
        }
    }, [input, indentSize, inputSizeBytes, setOutput, setValidation]);

    const handleMinify = useCallback(async () => {
        if (!input.trim()) return;
        if (inputSizeBytes > WORKER_THRESHOLD_BYTES) {
            try {
                const result = await runInWorker(minifyJsonWorker, [input]);
                setOutput(result);
                setValidation(true);
                await addEntry({ input, output: result, metadata: { action: "minify" } });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Invalid JSON";
                setOutput(`Error: ${message}`);
                setValidation(false, message);
            }
            return;
        }

        const result = minifyJson(input);
        if (result.success) {
            setOutput(result.data!);
            setValidation(true);
            await addEntry({ input, output: result.data!, metadata: { action: "minify" } });
        } else {
            setOutput(`Error: ${result.error}`);
            setValidation(false, result.error);
        }
    }, [input, inputSizeBytes, setOutput, setValidation]);

    const handleLoadSample = () => {
        setInput(SAMPLE_JSON);
        setOutput("");
    };

    const handleCopyOutput = () => {
        if (output) copyToClipboard(output);
    };

    const handleJsonPath = useCallback(() => {
        if (!input.trim() || !jsonPathQuery.trim()) return;
        try {
            const data = JSON.parse(input);
            const results = queryJsonPath(data, jsonPathQuery);
            setJsonPathResult(JSON.stringify(results, null, 2));
        } catch (e) {
            setJsonPathResult(`Error: ${(e as Error).message}`);
        }
    }, [input, jsonPathQuery]);

    const handleGenerateSchema = useCallback(() => {
        if (!input.trim()) return;
        try {
            const data = JSON.parse(input);
            const schema = generateJsonSchema(data);
            setSchemaOutput(JSON.stringify(schema, null, 2));
        } catch (e) {
            setSchemaOutput(`Error: ${(e as Error).message}`);
        }
    }, [input]);

    const handleGenerateTypes = useCallback(() => {
        if (!input.trim()) return;
        try {
            const data = JSON.parse(input);
            let result: string;
            if (typeLang === "typescript") result = jsonToTypeScript(data);
            else if (typeLang === "go") result = jsonToGo(data);
            else result = jsonToPython(data);
            setTypeOutput(result);
        } catch (e) {
            setTypeOutput(`Error: ${(e as Error).message}`);
        }
    }, [input, typeLang]);

    useKeyboardShortcuts({
        onPrimaryAction: handleFormat,
        onCopyOutput: handleCopyOutput,
        onClear: clear,
    });

    const editorClassName = "flex-grow min-h-[20rem] font-mono text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

    const prismLang: Record<TypeLang, { grammar: Prism.Grammar; name: string }> = {
        typescript: { grammar: Prism.languages.typescript, name: "typescript" },
        go: { grammar: Prism.languages.go, name: "go" },
        python: { grammar: Prism.languages.python, name: "python" },
    };

    useEffect(() => {
        if (input) return;
        // Check for smart-paste data from AppHome
        const smartPaste = sessionStorage.getItem("toolbit:smart-paste");
        if (smartPaste) {
            sessionStorage.removeItem("toolbit:smart-paste");
            setInput(smartPaste.trim());
            return;
        }
        const workspaceState = consumeWorkspaceState("json-formatter");
        if (workspaceState) {
            try {
                const parsed = JSON.parse(workspaceState) as { input?: string; output?: string; metadata?: Record<string, unknown> };
                if (parsed.input) setInput(parsed.input);
                if (parsed.output) setOutput(parsed.output);
            } catch {
                setInput(workspaceState);
            }
            return;
        }
        const payload = consumePipeData();
        if (payload?.data) {
            setInput(payload.data);
        }
    }, [consumePipeData, input, setInput, consumeWorkspaceState, setOutput]);

    return (
        <ToolCard
            title="JSON Formatter & Validator"
            description="Format, minify, and validate JSON data"
            icon={<FileText className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "json-formatter",
                toolName: "JSON Formatter",
                onRestore: (entry) => {
                    setInput(entry.input || "");
                    setOutput(entry.output || "");
                    setValidation(true);
                    if (typeof entry.metadata?.indentSize === "number") {
                        setIndentSize(entry.metadata.indentSize);
                    }
                },
            }}
            pipeSource={{
                toolId: "json-formatter",
                output: output || "",
            }}
        >
            {/* Large file warning */}
            {isLargeFile && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 p-2.5 rounded-md border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Large file ({(inputSizeBytes / 1_000_000).toFixed(1)}MB).
                    {treeDisabled && " Tree view disabled for performance."}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FileDropZone onFileContent={setInput} accept={[".json", ".txt", "application/json"]}>
                <div className="space-y-2 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                        <label htmlFor="json-input" className="text-sm font-medium">
                            Input JSON
                        </label>
                        <div className="flex gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLoadSample}
                                        className="h-7 px-2 text-xs"
                                    >
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Sample
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Load sample JSON data</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clear}
                                        disabled={!input && !output}
                                        className="h-7 px-2 text-xs"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Clear all</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
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
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={handleFormat} data-testid="button-format">
                                    Format
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Format JSON</TooltipContent>
                        </Tooltip>
                        <Button onClick={handleMinify} variant="outline" data-testid="button-minify">
                            Minify
                        </Button>
                        <select
                            value={indentSize}
                            onChange={(e) => setIndentSize(Number(e.target.value))}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                            <option value={2}>2 spaces</option>
                            <option value={4}>4 spaces</option>
                            <option value={8}>8 spaces</option>
                        </select>
                    </div>
                </div>
                </FileDropZone>

                <div className="space-y-2 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                        <label htmlFor="json-output" className="text-sm font-medium">
                            Output
                        </label>
                        {parsedJson !== null && !treeDisabled && (
                            <div className="flex gap-1">
                                <Button
                                    variant={outputView === "text" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setOutputView("text")}
                                    className="h-7 px-2 text-xs"
                                >
                                    <Code className="h-3 w-3 mr-1" />
                                    Text
                                </Button>
                                <Button
                                    variant={outputView === "tree" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setOutputView("tree")}
                                    className="h-7 px-2 text-xs"
                                >
                                    <TreePine className="h-3 w-3 mr-1" />
                                    Tree
                                </Button>
                            </div>
                        )}
                    </div>
                    {outputView === "tree" && parsedJson !== null && !treeDisabled ? (
                        <JsonTreeView data={parsedJson} />
                    ) : (
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
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={handleCopyOutput}
                                disabled={!output}
                                variant="outline"
                                data-testid="button-copy"
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy to clipboard</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Advanced Features */}
            <div className="border-t pt-4 space-y-3">
                <div className="flex gap-1 flex-wrap">
                    {([
                        { id: "query" as const, label: "JSONPath Query", icon: Search },
                        { id: "schema" as const, label: "Generate Schema", icon: FileCode },
                        { id: "types" as const, label: "Convert to Types", icon: Braces },
                    ]).map(({ id, label, icon: Icon }) => (
                        <Button
                            key={id}
                            variant={advancedTab === id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAdvancedTab(advancedTab === id ? "none" : id)}
                        >
                            <Icon className="h-3.5 w-3.5 mr-1" />
                            {label}
                        </Button>
                    ))}
                </div>

                {/* JSONPath Query */}
                {advancedTab === "query" && (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                value={jsonPathQuery}
                                onChange={(e) => setJsonPathQuery(e.target.value)}
                                placeholder="$.store.books[*].title"
                                className="flex-1 font-mono text-sm"
                                onKeyDown={(e) => e.key === "Enter" && handleJsonPath()}
                            />
                            <Button size="sm" onClick={handleJsonPath}>
                                <Search className="h-3.5 w-3.5 mr-1" />
                                Query
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Supports: $.key, [n], [*], ..key (recursive), * (wildcard)
                        </div>
                        {jsonPathResult && (
                            <div className="relative">
                                <Textarea
                                    value={jsonPathResult}
                                    readOnly
                                    className="min-h-[100px] font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(jsonPathResult)}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Schema Generator */}
                {advancedTab === "schema" && (
                    <div className="space-y-2">
                        <Button size="sm" onClick={handleGenerateSchema}>
                            <FileCode className="h-3.5 w-3.5 mr-1" />
                            Generate JSON Schema (draft-07)
                        </Button>
                        {schemaOutput && (
                            <div className="relative">
                                <Editor
                                    value={schemaOutput}
                                    onValueChange={() => {}}
                                    readOnly
                                    highlight={(code) => Prism.highlight(code, Prism.languages.json, "json")}
                                    padding={10}
                                    className="min-h-[150px] font-mono text-sm rounded-md border border-input bg-background"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(schemaOutput)}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Type Converter */}
                {advancedTab === "types" && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {(["typescript", "go", "python"] as const).map(lang => (
                                <Button
                                    key={lang}
                                    variant={typeLang === lang ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => { setTypeLang(lang); setTypeOutput("") }}
                                    className="capitalize"
                                >
                                    {lang === "typescript" ? "TypeScript" : lang === "go" ? "Go" : "Python"}
                                </Button>
                            ))}
                            <Button size="sm" variant="outline" onClick={handleGenerateTypes}>
                                Generate
                            </Button>
                        </div>
                        {typeOutput && (
                            <div className="relative">
                                <Editor
                                    value={typeOutput}
                                    onValueChange={() => {}}
                                    readOnly
                                    highlight={(code) => {
                                        const lang = prismLang[typeLang];
                                        return Prism.highlight(code, lang.grammar, lang.name);
                                    }}
                                    padding={10}
                                    className="min-h-[150px] font-mono text-sm rounded-md border border-input bg-background"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(typeOutput)}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ToolCard>
    );
}
