import { useEffect, useCallback, useRef, useState } from "react"

const DEFAULT_MAX_BYTES = 8 * 1024
const STATE_PARAM = "tb"

type UrlStateOptions = {
    enabled?: boolean
    maxBytes?: number
    compress?: boolean
}

type EncodedState = {
    hash: string
    oversize: boolean
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function encodeUtf8ToBase64(data: string): string {
    try {
        return btoa(encodeURIComponent(data))
    } catch {
        return ""
    }
}

function decodeBase64ToUtf8(data: string): string {
    try {
        return decodeURIComponent(atob(data))
    } catch {
        return ""
    }
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = ""
    bytes.forEach((b) => {
        binary += String.fromCharCode(b)
    })
    return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

async function compressToBase64(data: string): Promise<string | null> {
    if (!("CompressionStream" in window)) return null
    try {
        const stream = new CompressionStream("gzip")
        const writer = stream.writable.getWriter()
        const bytes = encoder.encode(data)
        const copy = new Uint8Array(bytes)
        await writer.write(copy.buffer)
        await writer.close()
        const buffer = await new Response(stream.readable).arrayBuffer()
        return bytesToBase64(new Uint8Array(buffer))
    } catch {
        return null
    }
}

async function decompressFromBase64(base64: string): Promise<string | null> {
    if (!("DecompressionStream" in window)) return null
    try {
        const bytes = base64ToBytes(base64)
        const copy = new Uint8Array(bytes)
        const stream = new DecompressionStream("gzip")
        const writer = stream.writable.getWriter()
        await writer.write(copy.buffer)
        await writer.close()
        const buffer = await new Response(stream.readable).arrayBuffer()
        return decoder.decode(buffer)
    } catch {
        return null
    }
}

async function encodeState(
    data: string,
    mode: "string" | "object",
    maxBytes: number,
    compress: boolean,
): Promise<EncodedState> {
    if (!data) {
        return { hash: "", oversize: false }
    }

    if (compress) {
        const compressed = await compressToBase64(data)
        if (compressed) {
            const prefix = mode === "string" ? "zs:" : "zj:"
            const hash = `${prefix}${compressed}`
            return { hash, oversize: hash.length > maxBytes }
        }
    }

    if (mode === "string") {
        const hash = encodeUtf8ToBase64(data)
        return { hash, oversize: hash.length > maxBytes }
    }

    const json = encodeUtf8ToBase64(data)
    const hash = `j:${json}`
    return { hash, oversize: hash.length > maxBytes }
}

async function decodeState(hash: string): Promise<unknown> {
    if (!hash) return null

    if (hash.startsWith("zs:")) {
        const decoded = await decompressFromBase64(hash.slice(3))
        return decoded ?? null
    }

    if (hash.startsWith("zj:")) {
        const decoded = await decompressFromBase64(hash.slice(3))
        if (!decoded) return null
        try {
            return JSON.parse(decoded)
        } catch {
            return null
        }
    }

    if (hash.startsWith("j:")) {
        const decoded = decodeBase64ToUtf8(hash.slice(2))
        if (!decoded) return null
        try {
            return JSON.parse(decoded)
        } catch {
            return null
        }
    }

    const legacy = decodeBase64ToUtf8(hash)
    return legacy || null
}

/**
 * Hook for syncing tool input state with the URL hash.
 * Enables shareable URLs for tools.
 *
 * @param value - Current input value
 * @param setValue - Setter for the input value
 * @param enabled - Whether URL state sync is active (default: true)
 */
export function useUrlState(
    value: string,
    setValue: (val: string) => void,
    options?: UrlStateOptions,
): { getShareUrl: () => string; shareWarning?: string; isOversize: boolean }
export function useUrlState<T extends Record<string, unknown>>(
    value: T,
    setValue: (val: T) => void,
    options?: UrlStateOptions,
): { getShareUrl: () => string; shareWarning?: string; isOversize: boolean }
export function useUrlState<T extends Record<string, unknown> | string>(
    value: T,
    setValue: (val: T) => void,
    options: UrlStateOptions = {},
) {
    const enabled = options.enabled ?? true
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
    const compress = options.compress ?? true
    const mode: "string" | "object" = typeof value === "string" ? "string" : "object"

    const initialized = useRef(false)
    const skipNextHashUpdate = useRef(false)
    const [shareUrl, setShareUrl] = useState(() => window.location.href)
    const [shareWarning, setShareWarning] = useState<string | undefined>(undefined)
    const [isOversize, setIsOversize] = useState(false)
    const isHashRouter = () => window.location.hash.startsWith("#/")

    const getStateToken = () => {
        if (isHashRouter()) {
            const params = new URLSearchParams(window.location.search)
            return params.get(STATE_PARAM) || ""
        }
        return window.location.hash.slice(1)
    }

    const updateUrlWithToken = (token: string) => {
        if (isHashRouter()) {
            const url = new URL(window.location.href)
            if (token) {
                url.searchParams.set(STATE_PARAM, token)
            } else {
                url.searchParams.delete(STATE_PARAM)
            }
            window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`)
            const origin = url.origin === "null" ? "" : url.origin
            setShareUrl(`${origin}${url.pathname}${url.search}${url.hash}`)
            return
        }

        if (token) {
            window.history.replaceState(null, "", `#${token}`)
            const origin = window.location.origin === "null" ? "" : window.location.origin
            setShareUrl(`${origin}${window.location.pathname}#${token}`)
        } else {
            window.history.replaceState(null, "", window.location.pathname)
            const origin = window.location.origin === "null" ? "" : window.location.origin
            setShareUrl(`${origin}${window.location.pathname}`)
        }
    }

    // On mount, restore state from URL hash
    useEffect(() => {
        if (!enabled || initialized.current) return
        initialized.current = true

        const token = getStateToken()
        if (!token) return

        ;(async () => {
            const decoded = await decodeState(token)
            if (decoded === null || decoded === undefined) return
            skipNextHashUpdate.current = true

            if (mode === "string") {
                if (typeof decoded === "string") {
                    setValue(decoded as T)
                }
                return
            }

            if (typeof decoded === "object") {
                setValue(decoded as T)
                return
            }

            if (typeof decoded === "string") {
                try {
                    const parsed = JSON.parse(decoded)
                    if (typeof parsed === "object" && parsed !== null) {
                        setValue(parsed as T)
                    }
                } catch {
                    // ignore non-object legacy data
                }
            }
        })()
    }, [enabled, mode, setValue])

    // Debounced update of URL hash when value changes
    useEffect(() => {
        if (!enabled) return
        if (skipNextHashUpdate.current) {
            skipNextHashUpdate.current = false
            return
        }

        let cancelled = false
        const timer = setTimeout(() => {
            ;(async () => {
                const data = mode === "string" ? String(value ?? "") : JSON.stringify(value ?? {})
                const { hash, oversize } = await encodeState(data, mode, maxBytes, compress)
                if (cancelled) return

                setIsOversize(oversize)
                if (oversize) {
                setShareWarning(`Share URL too large (>${Math.round(maxBytes / 1024)}KB). Link copied without data.`)
                updateUrlWithToken("")
                return
            }

            setShareWarning(undefined)
                updateUrlWithToken(hash)
            })()
        }, 500)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [value, enabled, mode, maxBytes, compress])

    const getShareUrl = useCallback((): string => shareUrl, [shareUrl])

    return { getShareUrl, shareWarning, isOversize }
}
