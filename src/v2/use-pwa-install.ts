import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(available: boolean) => void>();

if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        listeners.forEach((l) => l(true));
    });
    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        listeners.forEach((l) => l(false));
    });
}

/** Wires the "Install as PWA" CTA to the browser's native install prompt. */
export function usePwaInstall() {
    const [available, setAvailable] = useState(deferredPrompt !== null);

    useEffect(() => {
        listeners.add(setAvailable);
        return () => {
            listeners.delete(setAvailable);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        setAvailable(false);
    };

    return { installAvailable: available, install };
}
