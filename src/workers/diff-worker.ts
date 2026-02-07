import * as Diff from "diff"

type DiffLine = {
    type: "added" | "removed" | "unchanged"
    value: string
    lineNumOld?: number
    lineNumNew?: number
}

type DiffRequest = {
    text1: string
    text2: string
    ignoreWhitespace: boolean
}

type DiffResponse =
    | { ok: true; diffLines: DiffLine[]; patch: string }
    | { ok: false; error: string }

const normalize = (text: string, ignoreWhitespace: boolean) => (
    ignoreWhitespace ? text.replace(/[ \t]+/g, " ").replace(/ +\n/g, "\n") : text
)

const computeDiff = (text1: string, text2: string, ignoreWhitespace: boolean): DiffLine[] => {
    const changes = Diff.diffLines(
        normalize(text1, ignoreWhitespace),
        normalize(text2, ignoreWhitespace),
    )

    const lines: DiffLine[] = []
    let oldLine = 1
    let newLine = 1

    for (const change of changes) {
        const changeLines = change.value.replace(/\n$/, "").split("\n")
        for (const line of changeLines) {
            if (change.added) {
                lines.push({ type: "added", value: line, lineNumNew: newLine++ })
            } else if (change.removed) {
                lines.push({ type: "removed", value: line, lineNumOld: oldLine++ })
            } else {
                lines.push({ type: "unchanged", value: line, lineNumOld: oldLine++, lineNumNew: newLine++ })
            }
        }
    }

    return lines
}

const generatePatch = (text1: string, text2: string, ignoreWhitespace: boolean): string => (
    Diff.createTwoFilesPatch(
        "original",
        "modified",
        normalize(text1, ignoreWhitespace),
        normalize(text2, ignoreWhitespace),
    )
)

self.onmessage = (event: MessageEvent<DiffRequest>) => {
    try {
        const { text1, text2, ignoreWhitespace } = event.data
        const diffLines = computeDiff(text1, text2, ignoreWhitespace)
        const patch = generatePatch(text1, text2, ignoreWhitespace)
        const response: DiffResponse = { ok: true, diffLines, patch }
        self.postMessage(response)
    } catch (error) {
        const message = (error && (error as Error).message) ? (error as Error).message : String(error)
        const response: DiffResponse = { ok: false, error: message }
        self.postMessage(response)
    }
}
