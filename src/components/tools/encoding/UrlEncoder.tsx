import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Link, Sparkles } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { useToolIO } from "@/hooks/use-tool-io";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { encodeUrl, decodeUrl } from "@/services";
import { useUrlState } from "@/hooks/use-url-state";
import { useToolHistory } from "@/hooks/use-tool-history";
import { useToolPipe } from "@/hooks/use-tool-pipe";
import { useWorkspace } from "@/hooks/use-workspace";
import { useEffect } from "react";

export default function UrlEncoder() {
    const { input, output, setInput, setOutput } = useToolIO();
    const { copyToClipboard } = useCopyToClipboard();
    const { getShareUrl } = useUrlState(input, setInput);
    const { addEntry } = useToolHistory("url-encoder", "URL Encoder");
    const { consumePipeData } = useToolPipe();
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState);

    useEffect(() => {
        if (input) return;
        const workspaceState = consumeWorkspaceState("url-encoder");
        if (workspaceState) {
            try {
                const parsed = JSON.parse(workspaceState) as { input?: string; output?: string };
                setInput(parsed.input || "");
                setOutput(parsed.output || "");
            } catch {
                setInput(workspaceState);
            }
            return;
        }
        const payload = consumePipeData();
        if (payload?.data) {
            setInput(payload.data);
        }
    }, [consumePipeData, input, setInput, setOutput, consumeWorkspaceState]);

    const handleEncode = () => {
        const result = encodeUrl(input);
        setOutput(result.success ? result.data! : `Error: ${result.error}`);
        addEntry({ input, output: result.success ? result.data! : `Error: ${result.error}`, metadata: { action: "encode" } });
    };

    const handleDecode = () => {
        const result = decodeUrl(input);
        setOutput(result.success ? result.data! : `Error: ${result.error}`);
        addEntry({ input, output: result.success ? result.data! : `Error: ${result.error}`, metadata: { action: "decode" } });
    };

    return (
        <ToolCard
            title="URL Encoder / Decoder"
            description="Encode text for URLs or decode URL-encoded text"
            icon={<Link className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "url-encoder",
                toolName: "URL Encoder",
                onRestore: (entry) => {
                    setInput(entry.input || "");
                    setOutput(entry.output || "");
                },
            }}
            pipeSource={{
                toolId: "url-encoder",
                output: output || "",
            }}
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
                        <Button onClick={handleEncode} data-testid="button-encode">
                            Encode
                        </Button>
                        <Button onClick={handleDecode} variant="outline" data-testid="button-decode">
                            Decode
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setInput("https://example.com/search?q=hello world&lang=en&page=1#results"); setOutput(""); }}>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Sample
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
