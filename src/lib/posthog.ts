import posthog from "posthog-js";

const apiKey = import.meta.env.VITE_POSTHOG_KEY;
const apiHost = import.meta.env.VITE_POSTHOG_HOST;
const anonymousIdKey = "toolbit:analytics-anonymous-id";

function getAnonymousId() {
    const existingId = window.localStorage.getItem(anonymousIdKey);
    if (existingId) return existingId;

    const anonymousId = `toolbit_${crypto.randomUUID()}`;
    window.localStorage.setItem(anonymousIdKey, anonymousId);
    return anonymousId;
}

if (!apiKey || !apiHost) {
    if (import.meta.env.DEV) {
        const missingVariable = apiKey ? "VITE_POSTHOG_HOST" : "VITE_POSTHOG_KEY";
        throw new Error(
            `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
        );
    }
} else {
    posthog.init(apiKey, {
        api_host: apiHost,
        defaults: "2026-05-30",
        persistence: "localStorage",
        autocapture: false,
        disable_session_recording: true,
        capture_pageview: false,
        capture_pageleave: true,
        capture_exceptions: {
            capture_unhandled_errors: true,
            capture_unhandled_rejections: true,
            capture_console_errors: false,
        },
        logs: {
            serviceName: "toolbit-web",
            environment: import.meta.env.MODE,
        },
    });

    // Toolbit has no accounts. This stable, random device ID lets us understand
    // returning usage without collecting a name, email address, or tool input.
    posthog.identify(getAnonymousId(), {
        identity_kind: "anonymous_device",
        app: "toolbit",
    });
}

export { posthog };
export const isPostHogEnabled = Boolean(apiKey && apiHost);
