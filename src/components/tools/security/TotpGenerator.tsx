import { useState, useCallback, useEffect, useRef } from "react"
import { Key, Plus, Trash2 } from "lucide-react"
import { Button, IconButton, Input, Select, Alert, Card } from "@/ds/components"
import { CopyAction } from "@/v2/EditorPanels"
import { ToolPage, SectionTitle, Field, Row, Grid2 } from "@/v2/restyle-kit"

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
    }, [accountName, secret, digits, period, accounts])

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

    const progressPercent = (timeLeft / period) * 100
    const expiring = timeLeft <= 5

    return (
        <ToolPage maxWidth={640}>
            <Card>
                <div style={{ display: "grid", gap: 16 }}>
                    <SectionTitle>Secret</SectionTitle>
                    <Field label="Secret key (Base32)">
                        <Input
                            mono
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            placeholder="JBSWY3DPEHPK3PXP"
                            invalid={!!error}
                        />
                    </Field>
                    {error && <Alert tone="danger">{error}</Alert>}
                    <Grid2>
                        <Field label="Digits">
                            <Select fullWidth value={digits} onChange={(e) => setDigits(Number(e.target.value))}>
                                <option value={6}>6 digits</option>
                                <option value={8}>8 digits</option>
                            </Select>
                        </Field>
                        <Field label="Period">
                            <Select fullWidth value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
                                <option value={30}>30 seconds</option>
                                <option value={60}>60 seconds</option>
                            </Select>
                        </Field>
                    </Grid2>
                </div>
            </Card>

            {code && (
                <Card>
                    <div style={{ display: "grid", gap: 12, justifyItems: "center", padding: "12px 0" }}>
                        <div
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "var(--text-3xl, 2rem)",
                                fontWeight: 700,
                                letterSpacing: "0.3em",
                                color: "hsl(var(--text-strong))",
                            }}
                            data-testid="totp-code"
                        >
                            {code}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                                style={{
                                    width: 128,
                                    height: 8,
                                    borderRadius: 999,
                                    background: "hsl(var(--surface-2))",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        borderRadius: 999,
                                        width: `${progressPercent}%`,
                                        background: expiring ? "hsl(var(--danger))" : "hsl(var(--primary))",
                                        transition: "width 1s linear",
                                    }}
                                />
                            </div>
                            <span
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "var(--text-sm)",
                                    fontWeight: expiring ? 700 : 400,
                                    color: expiring ? "hsl(var(--danger))" : "hsl(var(--text-muted))",
                                }}
                            >
                                {timeLeft}s
                            </span>
                            <CopyAction text={code} />
                        </div>
                    </div>
                </Card>
            )}

            <Card>
                <div style={{ display: "grid", gap: 12 }}>
                    <SectionTitle>Saved accounts</SectionTitle>
                    <Row wrap={false}>
                        <Input
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Account name (e.g., GitHub)"
                            style={{ flex: 1 }}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            iconLeft={<Plus size={14} />}
                            onClick={addAccount}
                            disabled={!accountName.trim() || !secret.trim()}
                        >
                            Save
                        </Button>
                    </Row>
                    {accounts.map((account, i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                padding: "6px 10px",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid hsl(var(--border))",
                                background: "hsl(var(--surface-1))",
                                fontSize: "var(--text-sm)",
                            }}
                        >
                            <button
                                onClick={() => loadAccount(account)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    flex: 1,
                                    textAlign: "left",
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    color: "hsl(var(--text-body))",
                                    font: "inherit",
                                }}
                            >
                                <Key size={14} />
                                <span style={{ fontWeight: 500 }}>{account.name}</span>
                                <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))" }}>
                                    ({account.digits} digits, {account.period}s)
                                </span>
                            </button>
                            <IconButton size="sm" title="Remove account" onClick={() => removeAccount(i)}>
                                <Trash2 size={14} />
                            </IconButton>
                        </div>
                    ))}
                    <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))" }}>
                        All secrets are stored locally in your browser. No data is sent to any server.
                    </span>
                </div>
            </Card>
        </ToolPage>
    )
}
