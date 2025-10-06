import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToolCard } from "@/components/ToolCard";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markup";


export default function HtmlEscape() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const { toast } = useToast();

    const escapeHtml = () => {
        const escaped = input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        setOutput(escaped);
    };

    const unescapeHtml = () => {
        const unescaped = input
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&'); // This should be last
        setOutput(unescaped);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output);
        toast({ description: "Copied to clipboard!" });
    };

    const loadSample = () => {
        setInput('<div class="example">Hello & "welcome" to <HTML> escape tool!</div>');
    };

    const editorClassName = "flex-grow min-h-[20rem] font-mono text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

    return (
        <ToolCard
            title="HTML Escape / Unescape"
            description="Escape HTML entities or unescape HTML-encoded text"
            icon={<Code className="h-5 w-5" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="html-input" className="text-sm font-medium">
                        Input
                    </label>
                    <Editor
                        id="html-input"
                        placeholder="Enter HTML to escape or escaped HTML to unescape..."
                        value={input}
                        onValueChange={setInput}
                        highlight={(code) => Prism.highlight(code, Prism.languages.markup, 'markup')}
                        padding={10}
                        className={editorClassName}
                        data-testid="input-html"
                    />
                    <div className="flex gap-2">
                        <Button onClick={escapeHtml} data-testid="button-escape">
                            Escape HTML
                        </Button>
                        <Button onClick={unescapeHtml} variant="outline" data-testid="button-unescape">
                            Unescape HTML
                        </Button>
                        <Button onClick={loadSample} variant="outline" data-testid="button-sample">
                            Load Sample
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="html-output" className="text-sm font-medium">
                        Output
                    </label>
                    <Editor
                        id="html-output"
                        placeholder="Result will appear here..."
                        value={output}
                        readOnly
                        onValueChange={() => {}}
                        highlight={(code) => Prism.highlight(code, Prism.languages.markup, 'markup')}
                        padding={10}
                        className={editorClassName}
                        data-testid="output-html"
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

            <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium mb-2">Common HTML Entities:</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <span>&lt; → &amp;lt;</span>
                    <span>&gt; → &amp;gt;</span>
                    <span>&amp; → &amp;amp;</span>
                    <span>" → &amp;quot;</span>
                    <span>' → &amp;#39;</span>
                </div>
            </div>
        </ToolCard>
    );
}
