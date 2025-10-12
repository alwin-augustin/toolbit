import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Code } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { useToolIO } from "@/hooks/use-tool-io";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { encodeBase64, decodeBase64 } from "@/services";

export default function Base64Encoder() {
    const { input, output, setInput, setOutput } = useToolIO();
    const { copyToClipboard } = useCopyToClipboard();

    const handleEncode = () => {
        const result = encodeBase64(input);
        setOutput(result.success ? result.data! : `Error: ${result.error}`);
    };

    const handleDecode = () => {
        const result = decodeBase64(input);
        setOutput(result.success ? result.data! : `Error: ${result.error}`);
    };

    return (
        <ToolCard
            title="Base64 Encoder / Decoder"
            description="Encode text to Base64 or decode Base64 to text"
            icon={<Code className="h-5 w-5" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="base64-input" className="text-sm font-medium">
                        Input
                    </label>
                    <Textarea
                        id="base64-input"
                        placeholder="Enter text to encode or Base64 to decode..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="min-h-[24rem] font-mono text-sm"
                        data-testid="input-base64"
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
                    <label htmlFor="base64-output" className="text-sm font-medium">
                        Output
                    </label>
                    <Textarea
                        id="base64-output"
                        placeholder="Result will appear here..."
                        value={output}
                        readOnly
                        className="min-h-[24rem] font-mono text-sm"
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
        </ToolCard>
    );
}
