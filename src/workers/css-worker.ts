/**
 * Web Worker for CSS formatting and minification.
 * Offloads cssbeautify/csso to a background thread for large stylesheets.
 */
import cssbeautify from "cssbeautify"
import { minify } from "csso"

interface CssRequest {
    css: string
    action: "format" | "minify"
}

self.onmessage = (event: MessageEvent<CssRequest>) => {
    const { css, action } = event.data
    try {
        let result: string
        if (action === "format") {
            result = cssbeautify(css, { indent: "  ", autosemicolon: true })
        } else {
            result = minify(css).css
        }
        self.postMessage({ ok: true, result })
    } catch (error) {
        self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) })
    }
}
