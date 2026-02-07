import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Code, Image, FileUp, Sparkles } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { FileDropZone } from "@/components/FileDropZone";
import { useToolIO } from "@/hooks/use-tool-io";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { encodeBase64, decodeBase64 } from "@/services";
import { useUrlState } from "@/hooks/use-url-state";
import { useToast } from "@/hooks/use-toast";
import { useToolHistory } from "@/hooks/use-tool-history";
import { useToolPipe } from "@/hooks/use-tool-pipe";
import { useWorkspace } from "@/hooks/use-workspace";

const SAMPLE_TEXT = "Hello, World! This is a sample text for Base64 encoding.";

type Mode = "single" | "batch";

export default function Base64Encoder() {
    const { input, output, setInput, setOutput } = useToolIO();
    const { copyToClipboard } = useCopyToClipboard();
    const [imageDataUri, setImageDataUri] = useState("");
    const [mode, setMode] = useState<Mode>("single");
    const [batchInput, setBatchInput] = useState("");
    const [batchOutput, setBatchOutput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const shareState = useMemo(() => ({ input, mode, batchInput }), [input, mode, batchInput]);
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setInput(typeof state.input === "string" ? state.input : "");
        setMode(state.mode === "batch" ? "batch" : "single");
        setBatchInput(typeof state.batchInput === "string" ? state.batchInput : "");
    });
    const { addEntry } = useToolHistory("base64-encoder", "Base64 Encoder");
    const { consumePipeData } = useToolPipe();
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState);

    useEffect(() => {
        if (input || batchInput) return;
        const workspaceState = consumeWorkspaceState("base64-encoder");
        if (workspaceState) {
            try {
                const parsed = JSON.parse(workspaceState) as { input?: string; output?: string; mode?: Mode; batchInput?: string };
                setMode(parsed.mode === "batch" ? "batch" : "single");
                setInput(parsed.input || "");
                if (parsed.batchInput) setBatchInput(parsed.batchInput);
                if (parsed.output) {
                    if (parsed.mode === "batch") setBatchOutput(parsed.output);
                    else setOutput(parsed.output);
                }
            } catch {
                setInput(workspaceState);
            }
            return;
        }
        const payload = consumePipeData();
        if (payload?.data) {
            setInput(payload.data);
            setMode("single");
        }
    }, [consumePipeData, input, batchInput, setInput, consumeWorkspaceState, setMode, setBatchInput, setBatchOutput, setOutput]);

    const handleEncode = () => {
        const result = encodeBase64(input);
        setOutput(result.success ? result.data! : `Error: ${result.error}`);
        setImageDataUri("");
        addEntry({
            input: JSON.stringify({ mode, input, batchInput }),
            output: result.success ? result.data! : `Error: ${result.error}`,
            metadata: { action: "encode", mode },
        });
    };

    const handleDecode = () => {
        const result = decodeBase64(input);
        setOutput(result.success ? result.data! : `Error: ${result.error}`);
        setImageDataUri("");
        addEntry({
            input: JSON.stringify({ mode, input, batchInput }),
            output: result.success ? result.data! : `Error: ${result.error}`,
            metadata: { action: "decode", mode },
        });
    };

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // result is data:mime;base64,xxxx
            const base64Part = result.split(",")[1];
            setInput(base64Part);
            setImageDataUri(result);
            setOutput("");
            toast({ description: `Loaded ${file.name} as Data URI` });
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be re-selected
        e.target.value = "";
    }, [setInput, toast]);

    const handleGenerateDataUri = useCallback(() => {
        if (!input.trim()) return;
        // Try to detect if it's already base64 encoded
        const cleanInput = input.trim();
        if (cleanInput.startsWith("data:")) {
            setImageDataUri(cleanInput);
            setOutput(cleanInput);
        } else {
            // Default to text/plain; user can adjust
            const dataUri = `data:text/plain;base64,${cleanInput}`;
            setOutput(dataUri);
            setImageDataUri("");
        }
    }, [input, setOutput]);

    const handleBatchEncode = useCallback(() => {
        if (!batchInput.trim()) return;
        const lines = batchInput.split("\n").filter(l => l.trim());
        const results = lines.map(line => {
            try { return btoa(unescape(encodeURIComponent(line))); }
            catch { return `[Error encoding: ${line}]`; }
        });
        const output = results.join("\n");
        setBatchOutput(output);
        addEntry({
            input: JSON.stringify({ mode, input, batchInput }),
            output,
            metadata: { action: "batch-encode", mode },
        });
    }, [batchInput, addEntry, input, mode]);

    const handleBatchDecode = useCallback(() => {
        if (!batchInput.trim()) return;
        const lines = batchInput.split("\n").filter(l => l.trim());
        const results = lines.map(line => {
            try { return decodeURIComponent(escape(atob(line.trim()))); }
            catch { return `[Error decoding: ${line}]`; }
        });
        const output = results.join("\n");
        setBatchOutput(output);
        addEntry({
            input: JSON.stringify({ mode, input, batchInput }),
            output,
            metadata: { action: "batch-decode", mode },
        });
    }, [batchInput, addEntry, input, mode]);

    // Detect if output looks like an image when decoded
    const imagePreview = useMemo(() => {
        if (imageDataUri) return imageDataUri;

        // Check if input looks like base64-encoded image data
        const trimmed = input.trim();
        if (trimmed.startsWith("data:image/")) {
            return trimmed;
        }

        // Check for common image magic bytes in base64
        if (trimmed.startsWith("/9j/")) return `data:image/jpeg;base64,${trimmed}`;  // JPEG
        if (trimmed.startsWith("iVBOR")) return `data:image/png;base64,${trimmed}`;  // PNG
        if (trimmed.startsWith("R0lGOD")) return `data:image/gif;base64,${trimmed}`; // GIF
        if (trimmed.startsWith("UklGR")) return `data:image/webp;base64,${trimmed}`; // WebP

        return null;
    }, [input, imageDataUri]);

    return (
        <ToolCard
            title="Base64 Encoder / Decoder"
            description="Encode text to Base64, decode Base64, generate Data URIs, and preview images"
            icon={<Code className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "base64-encoder",
                toolName: "Base64 Encoder",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as { mode?: Mode; input?: string; batchInput?: string };
                        setMode(parsed.mode === "batch" ? "batch" : "single");
                        setInput(parsed.input || "");
                        setBatchInput(parsed.batchInput || "");
                        if (entry.output) {
                            if (parsed.mode === "batch") setBatchOutput(entry.output);
                            else setOutput(entry.output);
                        }
                    } catch {
                        setInput(entry.input || "");
                        setOutput(entry.output || "");
                    }
                },
            }}
            pipeSource={{
                toolId: "base64-encoder",
                output: output || "",
            }}
        >
            {/* Mode toggle */}
            <div className="flex gap-1 border rounded-md p-0.5 w-fit">
                {(["single", "batch"] as const).map(m => (
                    <button
                        key={m}
                        className={`px-3 py-1.5 text-sm font-medium rounded capitalize transition-colors ${
                            mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setMode(m)}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {mode === "batch" ? (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Input (one item per line)</label>
                        <Textarea
                            value={batchInput}
                            onChange={(e) => setBatchInput(e.target.value)}
                            placeholder={"Hello World\nFoo Bar\nBase64 Test"}
                            className="min-h-[150px] font-mono text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleBatchEncode}>Encode All</Button>
                        <Button onClick={handleBatchDecode} variant="outline">Decode All</Button>
                    </div>
                    {batchOutput && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Results</label>
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(batchOutput)}>
                                    <Copy className="h-3 w-3 mr-1" /> Copy All
                                </Button>
                            </div>
                            <Textarea
                                value={batchOutput}
                                readOnly
                                className="min-h-[150px] font-mono text-sm"
                            />
                        </div>
                    )}
                </div>
            ) : (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FileDropZone onFileContent={setInput} accept={[".txt", "text/plain"]}>
                <div className="space-y-2">
                    <label htmlFor="base64-input" className="text-sm font-medium">
                        Input
                    </label>
                    <Textarea
                        id="base64-input"
                        placeholder="Enter text to encode or Base64 to decode..."
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setImageDataUri(""); }}
                        className="min-h-[20rem] font-mono text-sm"
                        data-testid="input-base64"
                    />
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleEncode} data-testid="button-encode">
                            Encode
                        </Button>
                        <Button onClick={handleDecode} variant="outline" data-testid="button-decode">
                            Decode
                        </Button>
                        <Button onClick={handleGenerateDataUri} variant="outline">
                            Data URI
                        </Button>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <FileUp className="h-4 w-4 mr-1" />
                            File → Base64
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setInput(SAMPLE_TEXT); setOutput(""); setImageDataUri(""); }}>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Sample
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,.pdf,.txt"
                        />
                    </div>
                </div>
                </FileDropZone>

                <div className="space-y-2">
                    <label htmlFor="base64-output" className="text-sm font-medium">
                        Output
                    </label>
                    <Textarea
                        id="base64-output"
                        placeholder="Result will appear here..."
                        value={output}
                        readOnly
                        className="min-h-[20rem] font-mono text-sm"
                        data-testid="output-base64"
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

            {/* Image Preview */}
            {mode === "single" && imagePreview && (
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Image Preview
                    </label>
                    <div className="rounded-md border bg-muted/30 p-4 flex justify-center">
                        <img
                            src={imagePreview}
                            alt="Decoded preview"
                            className="max-w-full max-h-64 rounded object-contain"
                            onError={() => setImageDataUri("")}
                        />
                    </div>
                </div>
            )}
            </>
            )}
        </ToolCard>
    );
}
