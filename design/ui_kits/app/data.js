/* Shared tool catalog for the Toolbit app UI kit. */
(function () {
  window.TB_CATEGORIES = [
    { id: "format", label: "Format & Validate", icon: "fileJson" },
    { id: "encode", label: "Encode & Decode", icon: "lock" },
    { id: "generate", label: "Generate", icon: "wand" },
    { id: "transform", label: "Transform", icon: "swap" },
    { id: "analyze", label: "Analyze", icon: "microscope" },
    { id: "build", label: "Build", icon: "hammer" },
    { id: "text", label: "Text & Docs", icon: "fileText" },
  ];
  window.TB_TOOLS = [
    { id: "json-formatter", name: "JSON Formatter", cat: "format", desc: "Format, minify & validate JSON" },
    { id: "yaml-formatter", name: "YAML Formatter", cat: "format", desc: "Format and validate YAML" },
    { id: "xml-formatter", name: "XML Formatter", cat: "format", desc: "Pretty-print and validate XML" },
    { id: "sql-formatter", name: "SQL Formatter", cat: "format", desc: "Format SQL queries" },
    { id: "graphql-formatter", name: "GraphQL Formatter", cat: "format", desc: "Format GraphQL documents" },
    { id: "base64-encoder", name: "Base64 Encoder", cat: "encode", desc: "Encode / decode Base64" },
    { id: "url-encoder", name: "URL Encoder", cat: "encode", desc: "Encode / decode URLs" },
    { id: "jwt-decoder", name: "JWT Decoder", cat: "encode", desc: "Decode & inspect JWTs" },
    { id: "html-entities", name: "HTML Entities", cat: "encode", desc: "Escape / unescape HTML" },
    { id: "uuid-generator", name: "UUID Generator", cat: "generate", desc: "Generate UUIDs v4 / v7" },
    { id: "hash-generator", name: "Hash Generator", cat: "generate", desc: "MD5, SHA-1, SHA-256…" },
    { id: "password-generator", name: "Password Generator", cat: "generate", desc: "Strong random passwords" },
    { id: "qr-code", name: "QR Code", cat: "generate", desc: "Generate QR codes" },
    { id: "csv-to-json", name: "CSV ↔ JSON", cat: "transform", desc: "Convert between CSV and JSON" },
    { id: "case-converter", name: "Case Converter", cat: "transform", desc: "camelCase, snake_case…" },
    { id: "timestamp", name: "Timestamp", cat: "transform", desc: "Unix ↔ human time" },
    { id: "color-converter", name: "Color Converter", cat: "transform", desc: "HEX, RGB, HSL, OKLCH" },
    { id: "diff-tool", name: "Diff Tool", cat: "analyze", desc: "Compare two texts" },
    { id: "regex-tester", name: "Regex Tester", cat: "analyze", desc: "Test & explain regex" },
    { id: "cron-parser", name: "Cron Parser", cat: "analyze", desc: "Explain cron expressions" },
    { id: "api-builder", name: "API Request Builder", cat: "build", desc: "Compose HTTP requests" },
    { id: "websocket-tester", name: "WebSocket Tester", cat: "build", desc: "Test WS connections" },
    { id: "markdown", name: "Markdown Previewer", cat: "text", desc: "Live Markdown preview" },
    { id: "word-counter", name: "Word Counter", cat: "text", desc: "Count words & chars" },
  ];
})();
