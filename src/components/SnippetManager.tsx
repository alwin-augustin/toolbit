import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FileText, Copy, Trash2, Plus } from "lucide-react";
import { listSnippets, saveSnippet, deleteSnippet, type Snippet } from "@/lib/snippet-db";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

function previewText(text: string, max = 120): string {
    const cleaned = text.replace(/\s+/g, " ").trim();
    return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned;
}

interface SnippetManagerProps {
    showTrigger?: boolean;
}

export function SnippetManager({ showTrigger = true }: SnippetManagerProps) {
    const [open, setOpen] = useState(false);
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const { copyToClipboard } = useCopyToClipboard();

    const refresh = async () => {
        setLoading(true);
        const list = await listSnippets();
        setSnippets(list);
        setLoading(false);
    };

    useEffect(() => {
        if (open) refresh();
    }, [open]);

    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener("open-snippets", handleOpen);
        return () => window.removeEventListener("open-snippets", handleOpen);
    }, []);

    const handleCreate = async () => {
        if (!content.trim()) return;
        const snippet: Snippet = {
            id: crypto.randomUUID(),
            name: name.trim() || "Snippet",
            content,
            createdAt: Date.now(),
        };
        await saveSnippet(snippet);
        setName("");
        setContent("");
        await refresh();
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {showTrigger && (
                <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Snippets">
                    <FileText className="h-4 w-4" />
                </Button>
            )}
            <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>Snippets</SheetTitle>
                    <SheetDescription>
                        Save reusable inputs and outputs. All data stays on this device.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Create Snippet</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Snippet name"
                        />
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Paste snippet content..."
                            className="min-h-[120px] font-mono text-sm"
                        />
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-1" />
                            Save Snippet
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Saved Snippets</label>
                        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                        {!loading && snippets.length === 0 && (
                            <div className="text-sm text-muted-foreground">No snippets yet.</div>
                        )}
                        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2">
                            {snippets.map((snippet) => (
                                <div key={snippet.id} className="border rounded-md p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-sm">{snippet.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(snippet.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(snippet.content)}
                                            >
                                                <Copy className="h-3.5 w-3.5 mr-1" />
                                                Copy
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={async () => {
                                                    await deleteSnippet(snippet.id);
                                                    await refresh();
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono text-muted-foreground break-words">
                                        {previewText(snippet.content)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
