import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
    {
        category: "Navigation",
        items: [
            { keys: ["⌘", "K"], description: "Open command palette" },
            { keys: ["⌘", "P"], description: "Open command palette (alt)" },
            { keys: ["ESC"], description: "Close sidebar / dialogs" },
        ],
    },
    {
        category: "Tool Actions",
        items: [
            { keys: ["⌘", "↵"], description: "Execute primary action (Format/Encode/Convert)" },
            { keys: ["⌘", "⇧", "C"], description: "Copy output to clipboard" },
            { keys: ["⌘", "⇧", "X"], description: "Clear all fields" },
        ],
    },
    {
        category: "General",
        items: [
            { keys: ["⌘", "⇧", "L"], description: "Toggle light/dark theme" },
            { keys: ["?"], description: "Show this help dialog" },
        ],
    },
];

export function KeyboardShortcutsHelp() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Show help with "?" key (when not in an input)
            if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                setOpen(true);
            }
        };

        const handleShowShortcuts = () => setOpen(true);

        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("show-keyboard-shortcuts", handleShowShortcuts);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("show-keyboard-shortcuts", handleShowShortcuts);
        };
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription>
                        Use these shortcuts to work faster with Toolbit
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {shortcuts.map((section) => (
                        <div key={section.category}>
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">
                                {section.category}
                            </h4>
                            <div className="space-y-2">
                                {section.items.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span>{shortcut.description}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, i) => (
                                                <kbd
                                                    key={i}
                                                    className="px-2 py-1 rounded bg-muted text-muted-foreground font-mono text-xs min-w-[24px] text-center"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    <span className="flex items-center justify-center gap-1">
                        On Windows/Linux, use <kbd className="px-1.5 py-0.5 rounded bg-muted">Ctrl</kbd> instead of <kbd className="px-1.5 py-0.5 rounded bg-muted">⌘</kbd>
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
