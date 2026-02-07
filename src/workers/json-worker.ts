export function formatJsonWorker(input: string, spaces: number): string {
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed, null, spaces)
}

export function minifyJsonWorker(input: string): string {
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed)
}
