/**
 * Web Worker for YAML parsing, formatting, and conversion.
 * Offloads js-yaml operations to a background thread for large files.
 */
import * as yaml from "js-yaml"

interface YamlRequest {
    input: string
    action: "format" | "yaml-to-json" | "json-to-yaml"
}

self.onmessage = (event: MessageEvent<YamlRequest>) => {
    const { input, action } = event.data
    try {
        let result: string
        if (action === "format") {
            const parsed = yaml.load(input)
            result = yaml.dump(parsed, { indent: 2 })
        } else if (action === "yaml-to-json") {
            const parsed = yaml.load(input)
            result = JSON.stringify(parsed, null, 2)
        } else {
            const parsed = JSON.parse(input)
            result = yaml.dump(parsed, { indent: 2 })
        }
        self.postMessage({ ok: true, result })
    } catch (error) {
        self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) })
    }
}
