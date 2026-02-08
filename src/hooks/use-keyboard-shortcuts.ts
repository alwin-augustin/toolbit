/**
 * Hook for global keyboard shortcuts in tools
 */

import { useEffect, useCallback } from 'react';
import { useTheme } from './use-theme';
import { useSidebar } from './use-sidebar';

interface KeyboardShortcutOptions {
    onPrimaryAction?: () => void;
    onCopyOutput?: () => void;
    onClear?: () => void;
    onPipe?: () => void;
}

/**
 * Hook to handle common keyboard shortcuts in tools
 * - Cmd/Ctrl + Enter: Primary action (Format/Encode/Convert)
 * - Cmd/Ctrl + Shift + C: Copy output
 * - Cmd/Ctrl + Shift + X: Clear all
 * - Cmd/Ctrl + Shift + L: Toggle theme
 * - Cmd/Ctrl + Shift + P: Pipe output to next tool
 * - Cmd/Ctrl + B: Toggle sidebar
 */
export function useKeyboardShortcuts(options: KeyboardShortcutOptions = {}) {
    const { onPrimaryAction, onCopyOutput, onClear, onPipe } = options;
    const { toggleTheme } = useTheme();

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const isMod = e.metaKey || e.ctrlKey;
        const isShift = e.shiftKey;

        // Don't trigger shortcuts when typing in inputs/textareas (except for specific combos)
        const isInInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);

        // Cmd/Ctrl + Enter: Primary action
        if (isMod && e.key === 'Enter' && onPrimaryAction) {
            e.preventDefault();
            onPrimaryAction();
            return;
        }

        // Cmd/Ctrl + Shift + C: Copy output (works even in inputs)
        if (isMod && isShift && e.key.toLowerCase() === 'c' && onCopyOutput) {
            e.preventDefault();
            onCopyOutput();
            return;
        }

        // Cmd/Ctrl + Shift + X: Clear all
        if (isMod && isShift && e.key.toLowerCase() === 'x' && onClear) {
            e.preventDefault();
            onClear();
            return;
        }

        // Cmd/Ctrl + Shift + P: Pipe output
        if (isMod && isShift && e.key.toLowerCase() === 'p' && onPipe) {
            e.preventDefault();
            onPipe();
            return;
        }

        // Cmd/Ctrl + Shift + L: Toggle theme (global)
        if (isMod && isShift && e.key.toLowerCase() === 'l' && !isInInput) {
            e.preventDefault();
            toggleTheme();
            return;
        }
    }, [onPrimaryAction, onCopyOutput, onClear, onPipe, toggleTheme]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Hook for theme toggle shortcut only (for components without tool actions)
 */
export function useGlobalShortcuts() {
    const { toggleTheme } = useTheme();
    const { toggleMode } = useSidebar();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            const isShift = e.shiftKey;
            const isInInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);

            // Cmd/Ctrl + Shift + L: Toggle theme
            if (isMod && isShift && e.key.toLowerCase() === 'l' && !isInInput) {
                e.preventDefault();
                toggleTheme();
            }

            // Cmd/Ctrl + B: Toggle sidebar
            if (isMod && e.key.toLowerCase() === 'b' && !isInInput) {
                e.preventDefault();
                toggleMode();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [toggleTheme, toggleMode]);
}
