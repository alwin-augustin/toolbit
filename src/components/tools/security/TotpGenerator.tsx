import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, Key, Plus, Trash2, Shield } from "lucide-react"

interface Account {
    name: string
    secret: string
    digits: number
    period: number
}

const STORAGE_KEY = "toolbit-totp-accounts"

function base32Decode(input: string): Uint8Array {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    const cleanInput = input.replace(/[=\s]/g, "").toUpperCase()
    let bits = ""
    for (let i = 0; i < cleanInput.length; i++) {
        const idx = alphabet.indexOf(cleanInput[i])
        if (idx === -1) throw new Error(`Invalid Base32 character: ${cleanInput[i]}`)
        bits += idx.toString(2).padStart(5, "0")
    }
    const bytes = new Uint8Array(Math.floor(bits.length / 8))
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2)
    }
    return bytes
}

async function generateTOTP(secret: string, digits: number, period: number): Promise<string> {
    const key = base32Decode(secret)
    const time = Math.floor(Date.now() / 1000 / period)
    const timeBuffer = new ArrayBuffer(8)
    const timeView = new DataView(timeBuffer)
    timeView.setUint32(4, time, false)

    const cryptoKey = await crypto.subtle.importKey(
        "raw", key.buffer as ArrayBuffer, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
    )
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, timeBuffer)
    const hmac = new Uint8Array(signature)

    const offset = hmac[hmac.length - 1] & 0x0f
    const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, digits)

    return code.toString().padStart(digits, "0")
}

function loadAccounts(): Account[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}

function saveAccounts(accounts: Account[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

export default function TotpGenerator() {
    const [secret, setSecret] = useState("")
    const [digits, setDigits] = useState(6)
    const [period, setPeriod] = useState(30)
    const [code, setCode] = useState("")
    const [timeLeft, setTimeLeft] = useState(30)
    const [accounts, setAccounts] = useState<Account[]>(loadAccounts)
    const [accountName, setAccountName] = useState("")
    const [error, setError] = useState("")
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const { toast } = useToast()

    const generate = useCallback(async () => {
        if (!secret.trim()) {
            setCode("")
            setError("")
            return
        }
        try {
            setError("")
            const totp = await generateTOTP(secret.trim(), digits, period)
            setCode(totp)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid secret key")
            setCode("")
        }
    }, [secret, digits, period])

    useEffect(() => {
        generate()
        const tick = () => {
            const now = Math.floor(Date.now() / 1000)
            const remaining = period - (now % period)
            setTimeLeft(remaining)
            if (remaining === period) generate()
        }
        tick()
        intervalRef.current = setInterval(tick, 1000)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [generate, period])

    const addAccount = useCallback(() => {
        if (!accountName.trim() || !secret.trim()) return
        const newAccounts = [...accounts, { name: accountName.trim(), secret: secret.trim(), digits, period }]
        setAccounts(newAccounts)
        saveAccounts(newAccounts)
        setAccountName("")
        toast({ title: "Account saved" })
    }, [accountName, secret, digits, period, accounts, toast])

    const removeAccount = useCallback((index: number) => {
        const newAccounts = accounts.filter((_, i) => i !== index)
        setAccounts(newAccounts)
        saveAccounts(newAccounts)
    }, [accounts])

    const loadAccount = useCallback((account: Account) => {
        setSecret(account.secret)
        setDigits(account.digits)
        setPeriod(account.period)
    }, [])

    const copyCode = useCallback(() => {
        if (code) {
            navigator.clipboard.writeText(code)
            toast({ title: "Code copied" })
        }
    }, [code, toast])

    const progressPercent = (timeLeft / period) * 100

    return (
        <ToolCard
            title="TOTP/2FA Generator"
            description="Generate time-based one-time passwords (TOTP) offline"
            icon={<Shield className="h-5 w-5" />}
        >
            <div className="space-y-4">
                {/* Secret Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Key (Base32)</label>
                    <Input
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        placeholder="JBSWY3DPEHPK3PXP"
                        className="font-mono"
                    />
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>

                {/* Options */}
                <div className="flex gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Digits</label>
                        <select
                            value={digits}
                            onChange={(e) => setDigits(Number(e.target.value))}
                            className="block w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                        >
                            <option value={6}>6 digits</option>
                            <option value={8}>8 digits</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Period</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(Number(e.target.value))}
                            className="block w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                        >
                            <option value={30}>30 seconds</option>
                            <option value={60}>60 seconds</option>
                        </select>
                    </div>
                </div>

                {/* Code Display */}
                {code && (
                    <div className="text-center py-6 rounded-lg border bg-muted/30">
                        <div className="text-4xl font-mono font-bold tracking-[0.3em] mb-3">{code}</div>
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-red-500" : "bg-primary"}`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className={`text-sm font-mono ${timeLeft <= 5 ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                                {timeLeft}s
                            </span>
                            <Button variant="ghost" size="sm" onClick={copyCode}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Save Account */}
                <div className="flex gap-2">
                    <Input
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Account name (e.g., GitHub)"
                        className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={addAccount} disabled={!accountName.trim() || !secret.trim()}>
                        <Plus className="h-4 w-4 mr-1" /> Save
                    </Button>
                </div>

                {/* Saved Accounts */}
                {accounts.length > 0 && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Saved Accounts</label>
                        {accounts.map((account, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 p-2 rounded border bg-muted/20 text-sm">
                                <button
                                    onClick={() => loadAccount(account)}
                                    className="flex items-center gap-2 hover:text-primary transition-colors text-left flex-1"
                                >
                                    <Key className="h-3.5 w-3.5" />
                                    <span className="font-medium">{account.name}</span>
                                    <span className="text-xs text-muted-foreground">({account.digits} digits, {account.period}s)</span>
                                </button>
                                <Button variant="ghost" size="sm" onClick={() => removeAccount(i)}>
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    All secrets are stored locally in your browser. No data is sent to any server.
                </p>
            </div>
        </ToolCard>
    )
}
