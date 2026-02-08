/**
 * Detects the format of user input and suggests appropriate tools.
 */

export interface DetectionResult {
    format: string
    confidence: number // 0-1
    toolId: string
    toolName: string
    message: string
}

const JWT_REGEX = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const BASE64_REGEX = /^[A-Za-z0-9+/]{20,}={0,2}$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const URL_ENCODED_REGEX = /(%[0-9A-Fa-f]{2}){3,}/
const CRON_REGEX = /^(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)$/
const UNIX_TIMESTAMP_REGEX = /^1[0-9]{9}$/
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const XML_REGEX = /^\s*<\?xml|^\s*<[a-zA-Z][\s\S]*<\/[a-zA-Z]/
const CSV_REGEX = /^[^\n,]+,[^\n,]+\n[^\n,]+,[^\n,]+/
const SQL_REGEX = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\s/i
const MARKDOWN_REGEX = /^#{1,6}\s|^\*\*|^- \[|^```/m
const YAML_REGEX = /^---\s*$|^[a-zA-Z_][a-zA-Z0-9_]*:\s/m
const PEM_CERT_REGEX = /^-----BEGIN (CERTIFICATE|PUBLIC KEY|PRIVATE KEY)-----/
const GIT_DIFF_REGEX = /^diff --git|^@@\s.*\s@@/m
const GRAPHQL_REGEX = /^\s*(query|mutation|subscription|fragment|type|schema|input|enum|interface)\s/im
const NGINX_REGEX = /^\s*(server|location|upstream|http)\s*\{/m
const DOCKER_REGEX = /^\s*(FROM|RUN|CMD|ENTRYPOINT|COPY|ADD|EXPOSE|ENV|WORKDIR)\s/im

export function detectInput(input: string): DetectionResult | null {
    const trimmed = input.trim()
    if (!trimmed || trimmed.length < 3) return null

    // JWT token
    if (JWT_REGEX.test(trimmed)) {
        return {
            format: "JWT",
            confidence: 0.95,
            toolId: "jwt-decoder",
            toolName: "JWT Decoder",
            message: "This looks like a JWT token",
        }
    }

    // PEM Certificate
    if (PEM_CERT_REGEX.test(trimmed)) {
        return {
            format: "PEM Certificate",
            confidence: 0.95,
            toolId: "certificate-decoder",
            toolName: "Certificate Decoder",
            message: "This looks like a PEM certificate",
        }
    }

    // Git diff
    if (GIT_DIFF_REGEX.test(trimmed)) {
        return {
            format: "Git Diff",
            confidence: 0.9,
            toolId: "git-diff-viewer",
            toolName: "Git Diff Viewer",
            message: "This looks like a git diff",
        }
    }

    // JSON
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
            JSON.parse(trimmed)
            return {
                format: "JSON",
                confidence: 0.95,
                toolId: "json-formatter",
                toolName: "JSON Formatter",
                message: "This looks like JSON data",
            }
        } catch {
            // Not valid JSON, continue checking
        }
    }

    // Cron expression
    if (CRON_REGEX.test(trimmed)) {
        return {
            format: "Cron",
            confidence: 0.85,
            toolId: "cron-parser",
            toolName: "Cron Expression Parser",
            message: "This looks like a cron expression",
        }
    }

    // Unix timestamp
    if (UNIX_TIMESTAMP_REGEX.test(trimmed)) {
        return {
            format: "Unix Timestamp",
            confidence: 0.8,
            toolId: "timestamp-converter",
            toolName: "Timestamp Converter",
            message: "This looks like a Unix timestamp",
        }
    }

    // Hex color
    if (HEX_COLOR_REGEX.test(trimmed)) {
        return {
            format: "Color",
            confidence: 0.9,
            toolId: "color-converter",
            toolName: "Color Converter",
            message: "This looks like a hex color",
        }
    }

    // UUID
    if (UUID_REGEX.test(trimmed)) {
        return {
            format: "UUID",
            confidence: 0.95,
            toolId: "uuid-generator",
            toolName: "UUID Generator",
            message: "This looks like a UUID",
        }
    }

    // SQL
    if (SQL_REGEX.test(trimmed)) {
        return {
            format: "SQL",
            confidence: 0.85,
            toolId: "sql-formatter",
            toolName: "SQL Formatter",
            message: "This looks like a SQL query",
        }
    }

    // GraphQL
    if (GRAPHQL_REGEX.test(trimmed)) {
        return {
            format: "GraphQL",
            confidence: 0.85,
            toolId: "graphql-formatter",
            toolName: "GraphQL Formatter",
            message: "This looks like a GraphQL query",
        }
    }

    // Nginx config
    if (NGINX_REGEX.test(trimmed)) {
        return {
            format: "Nginx Config",
            confidence: 0.85,
            toolId: "nginx-config-validator",
            toolName: "Nginx Config Validator",
            message: "This looks like an Nginx configuration",
        }
    }

    // Dockerfile
    if (DOCKER_REGEX.test(trimmed) && trimmed.split("\n").length > 1) {
        return {
            format: "Dockerfile",
            confidence: 0.8,
            toolId: "docker-command-builder",
            toolName: "Docker Command Builder",
            message: "This looks like a Dockerfile",
        }
    }

    // XML
    if (XML_REGEX.test(trimmed)) {
        return {
            format: "XML",
            confidence: 0.85,
            toolId: "xml-formatter",
            toolName: "XML Formatter",
            message: "This looks like XML",
        }
    }

    // YAML (check after XML since some YAML could false positive)
    if (YAML_REGEX.test(trimmed) && !trimmed.startsWith("<")) {
        return {
            format: "YAML",
            confidence: 0.7,
            toolId: "yaml-formatter",
            toolName: "YAML Formatter",
            message: "This looks like YAML",
        }
    }

    // Markdown
    if (MARKDOWN_REGEX.test(trimmed) && trimmed.length > 20) {
        return {
            format: "Markdown",
            confidence: 0.7,
            toolId: "markdown-previewer",
            toolName: "Markdown Previewer",
            message: "This looks like Markdown",
        }
    }

    // CSV
    if (CSV_REGEX.test(trimmed)) {
        return {
            format: "CSV",
            confidence: 0.75,
            toolId: "csv-to-json",
            toolName: "CSV to JSON",
            message: "This looks like CSV data",
        }
    }

    // URL-encoded
    if (URL_ENCODED_REGEX.test(trimmed)) {
        return {
            format: "URL-encoded",
            confidence: 0.8,
            toolId: "url-encoder",
            toolName: "URL Encoder",
            message: "This looks like URL-encoded text",
        }
    }

    // Base64 (check last since it's very broad)
    if (BASE64_REGEX.test(trimmed.replace(/\s/g, "")) && trimmed.length > 30) {
        return {
            format: "Base64",
            confidence: 0.6,
            toolId: "base64-encoder",
            toolName: "Base64 Encoder",
            message: "This looks like Base64-encoded data",
        }
    }

    return null
}
