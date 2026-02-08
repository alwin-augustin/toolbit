export interface SmartSuggestion {
    toolId: string;
    toolName: string;
    path: string;
    reason: string;
}

export function detectContentType(text: string): SmartSuggestion[] {
    const trimmed = text.trim();
    if (!trimmed) return [];

    const suggestions: SmartSuggestion[] = [];
    const MAX_DETECT_LENGTH = 200_000;

    if (trimmed.length > MAX_DETECT_LENGTH) {
        return [
            { toolId: "json-formatter", toolName: "JSON Formatter", path: "/app/json-formatter", reason: "Large input — open formatter" },
            { toolId: "base64-encoder", toolName: "Base64 Decoder", path: "/app/base64-encoder", reason: "Large input — try decode" },
            { toolId: "hash-generator", toolName: "Hash Generator", path: "/app/hash-generator", reason: "Large input — generate hash" },
        ];
    }

    // JWT detection (starts with eyJ)
    if (/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(trimmed)) {
        suggestions.push({ toolId: "jwt-decoder", toolName: "JWT Decoder", path: "/app/jwt-decoder", reason: "Detected JWT token" });
        suggestions.push({ toolId: "base64-encoder", toolName: "Base64 Decoder", path: "/app/base64-encoder", reason: "Decode Base64 segments" });
    }

    // JSON detection
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
            JSON.parse(trimmed);
            suggestions.push({ toolId: "json-formatter", toolName: "JSON Formatter", path: "/app/json-formatter", reason: "Detected valid JSON" });
            suggestions.push({ toolId: "json-validator", toolName: "JSON Schema Validator", path: "/app/json-validator", reason: "Validate against schema" });
        } catch {
            suggestions.push({ toolId: "json-formatter", toolName: "JSON Formatter", path: "/app/json-formatter", reason: "Looks like JSON (may have errors)" });
        }
    }

    // Base64 detection
    if (/^[A-Za-z0-9+/=]{20,}$/.test(trimmed) && trimmed.length % 4 === 0 && suggestions.length === 0) {
        suggestions.push({ toolId: "base64-encoder", toolName: "Base64 Decoder", path: "/app/base64-encoder", reason: "Detected Base64 encoded data" });
    }

    // URL-encoded detection
    if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
        suggestions.push({ toolId: "url-encoder", toolName: "URL Decoder", path: "/app/url-encoder", reason: "Detected URL-encoded text" });
    }

    // Cron expression detection
    if (/^(\*|[0-9,/-]+)\s+(\*|[0-9,/-]+)\s+(\*|[0-9,/-]+)\s+(\*|[0-9,/-]+)\s+(\*|[0-9,/-]+)(\s+(\*|[0-9,/-]+))?$/.test(trimmed)) {
        suggestions.push({ toolId: "cron-parser", toolName: "Cron Parser", path: "/app/cron-parser", reason: "Detected cron expression" });
    }

    // Unix timestamp detection
    if (/^\d{10,13}$/.test(trimmed)) {
        suggestions.push({ toolId: "timestamp-converter", toolName: "Timestamp Converter", path: "/app/timestamp-converter", reason: "Detected Unix timestamp" });
    }

    // HTML detection
    if (/<[a-z][\s\S]*>/i.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "html-escape", toolName: "HTML Escape", path: "/app/html-escape", reason: "Detected HTML content" });
    }

    // CSS detection
    if (/[.#@][a-zA-Z][\w-]*\s*\{/.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "css-formatter", toolName: "CSS Formatter", path: "/app/css-formatter", reason: "Detected CSS" });
    }

    // YAML detection
    if (/^[a-zA-Z_][\w]*:\s*.+/m.test(trimmed) && !trimmed.startsWith("{") && suggestions.length === 0) {
        suggestions.push({ toolId: "yaml-formatter", toolName: "YAML Formatter", path: "/app/yaml-formatter", reason: "Detected YAML" });
    }

    // SQL detection
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/im.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "sql-formatter", toolName: "SQL Formatter", path: "/app/sql-formatter", reason: "Detected SQL query" });
    }

    // XML detection
    if (/^<\?xml|^<[a-zA-Z][\w]*[\s>]/m.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "xml-formatter", toolName: "XML Formatter", path: "/app/xml-formatter", reason: "Detected XML" });
    }

    // Hex color detection
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(trimmed)) {
        suggestions.push({ toolId: "color-converter", toolName: "Color Converter", path: "/app/color-converter", reason: "Detected hex color" });
    }

    // Regex detection
    if (/^\/.*\/[gimsuvy]*$/.test(trimmed)) {
        suggestions.push({ toolId: "regex-tester", toolName: "Regex Tester", path: "/app/regex-tester", reason: "Detected regex pattern" });
    }

    // UUID detection
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
        suggestions.push({ toolId: "uuid-generator", toolName: "UUID Generator", path: "/app/uuid-generator", reason: "Detected UUID" });
    }

    // CSV detection
    if (trimmed.includes(",") && trimmed.includes("\n") && suggestions.length === 0) {
        const lines = trimmed.split("\n").filter(Boolean);
        if (lines.length >= 2) {
            const commaCount = lines[0].split(",").length;
            if (commaCount >= 2 && lines.every((line) => Math.abs(line.split(",").length - commaCount) <= 1)) {
                suggestions.push({ toolId: "csv-to-json", toolName: "CSV to JSON", path: "/app/csv-to-json", reason: "Detected CSV data" });
            }
        }
    }

    // Markdown detection
    if (/^#{1,6}\s|^\*{1,2}[^*]+\*{1,2}|\[.*\]\(.*\)/m.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "markdown-previewer", toolName: "Markdown Previewer", path: "/app/markdown-previewer", reason: "Detected Markdown" });
    }

    // Git diff detection
    if (/^diff --git|^@@\s/.test(trimmed)) {
        suggestions.push({ toolId: "git-diff-viewer", toolName: "Git Diff Viewer", path: "/app/git-diff-viewer", reason: "Detected git diff" });
    }

    // PEM certificate detection
    if (/-----BEGIN CERTIFICATE-----/.test(trimmed)) {
        suggestions.push({ toolId: "certificate-decoder", toolName: "Certificate Decoder", path: "/app/certificate-decoder", reason: "Detected PEM certificate" });
    }

    // Fallback: general text tools
    if (suggestions.length === 0 && trimmed.length > 0) {
        suggestions.push({ toolId: "hash-generator", toolName: "Hash Generator", path: "/app/hash-generator", reason: "Generate hash" });
        suggestions.push({ toolId: "base64-encoder", toolName: "Base64 Encoder", path: "/app/base64-encoder", reason: "Encode to Base64" });
        suggestions.push({ toolId: "case-converter", toolName: "Case Converter", path: "/app/case-converter", reason: "Convert text case" });
    }

    return suggestions.slice(0, 4);
}
