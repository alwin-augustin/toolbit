import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Link } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { useToolIO } from "@/hooks/use-tool-io";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { encodeUrl, decodeUrl } from "@/services";

export default function UrlEncoder() {
    const { input, output, setInput, setOutput } = useToolIO();
    const { copyToClipboard } = useCopyToClipboard();

    const handleEncode = () => {
        const result = encodeUrl(input);
        setOutput(result.success ? result.data! : `Error: ${result.error}`);
    };

    const handleDecode = () => {
        const result = decodeUrl(input);
        setOutput(result.success ? result.data! : `Error: ${result.error}`);
    };

    return (
        <ToolCard
            title="URL Encoder / Decoder"
            description="Encode text for URLs or decode URL-encoded text"
            icon={<Link className="h-5 w-5" />}
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
