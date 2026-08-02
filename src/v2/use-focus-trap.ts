import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex=\"-1\"])",
].join(",");

export function useFocusTrap(
    active: boolean,
    containerRef: RefObject<HTMLElement | null>,
    onEscape: () => void,
    initialFocusRef?: RefObject<HTMLElement | null>,
) {
    useEffect(() => {
        if (!active) return;

        const previous = document.activeElement as HTMLElement | null;
        const focusInitial = () => {
            const initial = initialFocusRef?.current;
            const first = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
            (initial ?? first)?.focus();
        };
        const focusTimer = window.setTimeout(focusInitial, 0);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onEscape();
                return;
            }
            if (event.key !== "Tab" || !containerRef.current) return;

            const focusable = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
            if (!focusable.length) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);
            previous?.focus();
        };
    }, [active, containerRef, initialFocusRef, onEscape]);
}
