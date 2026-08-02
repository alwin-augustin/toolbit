import { useEffect } from "react";
import { detectContentType } from "@/lib/smart-detect";
import { useToolPipe } from "@/hooks/use-tool-pipe";

const STORAGE_KEY = "toolbit:smart-paste";

/** True when the paste landed in an editable element and should be left alone. */
export function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!target.closest(".cm-editor");
}

/** Detects the pasted content type and returns the tool to route to. */
export function detectSmartPaste(text: string): { toolId: string; reason: string } | null {
    const suggestions = detectContentType(text);
    if (!suggestions.length) return null;
    return { toolId: suggestions[0].toolId, reason: suggestions[0].reason };
}

export function stashSmartPaste(text: string) {
    sessionStorage.setItem(STORAGE_KEY, text);
}

export function consumeSmartPaste(): string | null {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value !== null) sessionStorage.removeItem(STORAGE_KEY);
    return value;
}

/** Tools call this on mount to pick up content routed to them by smart paste. */
export function useSmartPasteInput(onInput: (text: string) => void) {
    const consumePipeData = useToolPipe((state) => state.consumePipeData);
    useEffect(() => {
        const value = consumeSmartPaste();
        if (value !== null) {
            onInput(value);
            return;
        }
        const piped = consumePipeData();
        if (piped) onInput(piped.data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
