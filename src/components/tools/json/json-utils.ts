/**
 * JSON utility functions for JSONPath, Schema generation, and Type conversion
 */

// --- JSONPath Query ---

export function queryJsonPath(data: unknown, path: string): unknown[] {
    const results: unknown[] = []

    if (!path.startsWith("$")) return results

    const tokens = tokenizePath(path.slice(1)) // Remove leading $
    traverse(data, tokens, 0, results)
    return results
}

function tokenizePath(path: string): string[] {
    const tokens: string[] = []
    let i = 0
    while (i < path.length) {
        if (path[i] === ".") {
            if (path[i + 1] === ".") {
                tokens.push("..")
                i += 2
            } else {
                i++
                // Read key
                let key = ""
                while (i < path.length && path[i] !== "." && path[i] !== "[") {
                    key += path[i++]
                }
                if (key) tokens.push(key)
            }
        } else if (path[i] === "[") {
            i++
            let bracket = ""
            while (i < path.length && path[i] !== "]") {
                bracket += path[i++]
            }
            i++ // skip ]
            if (bracket === "*") {
                tokens.push("[*]")
            } else if (bracket.startsWith("'") || bracket.startsWith('"')) {
                tokens.push(bracket.slice(1, -1))
            } else {
                tokens.push(`[${bracket}]`)
            }
        } else {
            let key = ""
            while (i < path.length && path[i] !== "." && path[i] !== "[") {
                key += path[i++]
            }
            if (key) tokens.push(key)
        }
    }
    return tokens
}

function traverse(data: unknown, tokens: string[], idx: number, results: unknown[]): void {
    if (idx >= tokens.length) {
        results.push(data)
        return
    }

    const token = tokens[idx]

    if (token === "..") {
        // Recursive descent
        if (idx + 1 < tokens.length) {
            traverse(data, tokens, idx + 1, results) // Try matching at current level
        }
        if (data && typeof data === "object") {
            const entries = Array.isArray(data) ? data.map((v, i) => [i, v]) : Object.entries(data)
            for (const [, val] of entries) {
                traverse(val, tokens, idx, results) // Recurse into children
            }
        }
    } else if (token === "[*]") {
        if (Array.isArray(data)) {
            for (const item of data) {
                traverse(item, tokens, idx + 1, results)
            }
        } else if (data && typeof data === "object") {
            for (const val of Object.values(data)) {
                traverse(val, tokens, idx + 1, results)
            }
        }
    } else if (token.startsWith("[") && token.endsWith("]")) {
        const index = parseInt(token.slice(1, -1), 10)
        if (Array.isArray(data) && index >= 0 && index < data.length) {
            traverse(data[index], tokens, idx + 1, results)
        }
    } else if (token === "*") {
        if (data && typeof data === "object") {
            const values = Array.isArray(data) ? data : Object.values(data)
            for (const val of values) {
                traverse(val, tokens, idx + 1, results)
            }
        }
    } else {
        // Property access
        if (data && typeof data === "object" && !Array.isArray(data)) {
            const obj = data as Record<string, unknown>
            if (token in obj) {
                traverse(obj[token], tokens, idx + 1, results)
            }
        }
    }
}

// --- JSON Schema Generator ---

export function generateJsonSchema(data: unknown): object {
    return {
        $schema: "http://json-schema.org/draft-07/schema#",
        ...inferSchema(data),
    }
}

function inferSchema(data: unknown): object {
    if (data === null) return { type: "null" }
    if (typeof data === "string") return { type: "string" }
    if (typeof data === "number") return Number.isInteger(data) ? { type: "integer" } : { type: "number" }
    if (typeof data === "boolean") return { type: "boolean" }

    if (Array.isArray(data)) {
        if (data.length === 0) return { type: "array", items: {} }
        // Infer from first item
        return { type: "array", items: inferSchema(data[0]) }
    }

    if (typeof data === "object") {
        const obj = data as Record<string, unknown>
        const properties: Record<string, object> = {}
        const required: string[] = []
        for (const [key, val] of Object.entries(obj)) {
            properties[key] = inferSchema(val)
            if (val !== null && val !== undefined) required.push(key)
        }
        return {
            type: "object",
            properties,
            required: required.length > 0 ? required : undefined,
        }
    }

    return {}
}

// --- Type Converters ---

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function toValidIdentifier(s: string): string {
    return s.replace(/[^a-zA-Z0-9_]/g, "_")
}

function toPascalCase(s: string): string {
    return s.split(/[-_\s]/).map(capitalize).join("")
}

export function jsonToTypeScript(data: unknown, rootName = "Root"): string {
    const interfaces: string[] = []

    function generate(obj: unknown, name: string): string {
        if (obj === null) return "null"
        if (typeof obj === "string") return "string"
        if (typeof obj === "number") return "number"
        if (typeof obj === "boolean") return "boolean"

        if (Array.isArray(obj)) {
            if (obj.length === 0) return "unknown[]"
            const itemType = generate(obj[0], name + "Item")
            return `${itemType}[]`
        }

        if (typeof obj === "object") {
            const entries = Object.entries(obj as Record<string, unknown>)
            const fields = entries.map(([key, val]) => {
                const fieldType = generate(val, toPascalCase(key))
                const safeName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`
                return `  ${safeName}: ${fieldType};`
            })
            interfaces.push(`interface ${toValidIdentifier(name)} {\n${fields.join("\n")}\n}`)
            return toValidIdentifier(name)
        }

        return "unknown"
    }

    generate(data, rootName)
    return interfaces.join("\n\n")
}

export function jsonToGo(data: unknown, rootName = "Root"): string {
    const structs: string[] = []

    function generate(obj: unknown, name: string): string {
        if (obj === null) return "interface{}"
        if (typeof obj === "string") return "string"
        if (typeof obj === "number") return Number.isInteger(obj) ? "int" : "float64"
        if (typeof obj === "boolean") return "bool"

        if (Array.isArray(obj)) {
            if (obj.length === 0) return "[]interface{}"
            const itemType = generate(obj[0], name + "Item")
            return `[]${itemType}`
        }

        if (typeof obj === "object") {
            const entries = Object.entries(obj as Record<string, unknown>)
            const fields = entries.map(([key, val]) => {
                const fieldType = generate(val, toPascalCase(key))
                const goName = toPascalCase(key)
                return `\t${goName} ${fieldType} \`json:"${key}"\``
            })
            structs.push(`type ${toValidIdentifier(name)} struct {\n${fields.join("\n")}\n}`)
            return toValidIdentifier(name)
        }

        return "interface{}"
    }

    generate(data, rootName)
    return structs.join("\n\n")
}

export function jsonToPython(data: unknown, rootName = "Root"): string {
    const classes: string[] = []

    function generate(obj: unknown, name: string): string {
        if (obj === null) return "None"
        if (typeof obj === "string") return "str"
        if (typeof obj === "number") return Number.isInteger(obj) ? "int" : "float"
        if (typeof obj === "boolean") return "bool"

        if (Array.isArray(obj)) {
            if (obj.length === 0) return "list"
            const itemType = generate(obj[0], name + "Item")
            return `list[${itemType}]`
        }

        if (typeof obj === "object") {
            const entries = Object.entries(obj as Record<string, unknown>)
            const fields = entries.map(([key, val]) => {
                const fieldType = generate(val, toPascalCase(key))
                return `    ${toValidIdentifier(key)}: ${fieldType}`
            })
            classes.push(`class ${toValidIdentifier(name)}(TypedDict):\n${fields.join("\n")}`)
            return toValidIdentifier(name)
        }

        return "Any"
    }

    generate(data, rootName)
    return `from typing import TypedDict\n\n${classes.join("\n\n")}`
}
