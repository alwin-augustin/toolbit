import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, Container, Plus, Trash2, Zap } from "lucide-react"
import yaml from "js-yaml"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"
import { ToolEmptyState } from "@/components/ToolEmptyState"

interface PortMapping {
    host: string
    container: string
    protocol: string
}

interface VolumeMapping {
    host: string
    container: string
    mode: string
}

interface EnvVar {
    key: string
    value: string
}

interface Preset {
    label: string
    image: string
    name: string
    ports: PortMapping[]
    volumes: VolumeMapping[]
    envVars: EnvVar[]
    flags: Record<string, boolean>
}

const PRESETS: Preset[] = [
    {
        label: "Nginx",
        image: "nginx:latest",
        name: "my-nginx",
        ports: [{ host: "8080", container: "80", protocol: "tcp" }],
        volumes: [{ host: "./html", container: "/usr/share/nginx/html", mode: "ro" }],
        envVars: [],
        flags: { detach: true, rm: false, interactive: false, privileged: false },
    },
    {
        label: "PostgreSQL",
        image: "postgres:16",
        name: "my-postgres",
        ports: [{ host: "5432", container: "5432", protocol: "tcp" }],
        volumes: [{ host: "pgdata", container: "/var/lib/postgresql/data", mode: "rw" }],
        envVars: [{ key: "POSTGRES_PASSWORD", value: "mysecretpassword" }, { key: "POSTGRES_DB", value: "mydb" }],
        flags: { detach: true, rm: false, interactive: false, privileged: false },
    },
    {
        label: "Redis",
        image: "redis:7-alpine",
        name: "my-redis",
        ports: [{ host: "6379", container: "6379", protocol: "tcp" }],
        volumes: [{ host: "redis-data", container: "/data", mode: "rw" }],
        envVars: [],
        flags: { detach: true, rm: false, interactive: false, privileged: false },
    },
    {
        label: "Node.js",
        image: "node:20-alpine",
        name: "my-node-app",
        ports: [{ host: "3000", container: "3000", protocol: "tcp" }],
        volumes: [{ host: ".", container: "/app", mode: "rw" }],
        envVars: [{ key: "NODE_ENV", value: "production" }],
        flags: { detach: true, rm: false, interactive: false, privileged: false },
    },
    {
        label: "MySQL",
        image: "mysql:8",
        name: "my-mysql",
        ports: [{ host: "3306", container: "3306", protocol: "tcp" }],
        volumes: [{ host: "mysql-data", container: "/var/lib/mysql", mode: "rw" }],
        envVars: [{ key: "MYSQL_ROOT_PASSWORD", value: "rootpassword" }, { key: "MYSQL_DATABASE", value: "mydb" }],
        flags: { detach: true, rm: false, interactive: false, privileged: false },
    },
]

const DEFAULT_STATE = {
    image: "nginx:latest",
    containerName: "my-container",
    ports: [{ host: "8080", container: "80", protocol: "tcp" }],
    volumes: [] as VolumeMapping[],
    envVars: [] as EnvVar[],
    network: "",
    restartPolicy: "",
    flags: { detach: true, rm: false, interactive: false, privileged: false, readOnly: false },
    memory: "",
    cpus: "",
    tab: "run" as const,
}

export default function DockerCommandBuilder() {
    const [image, setImage] = useState(DEFAULT_STATE.image)
    const [containerName, setContainerName] = useState(DEFAULT_STATE.containerName)
    const [ports, setPorts] = useState<PortMapping[]>(DEFAULT_STATE.ports)
    const [volumes, setVolumes] = useState<VolumeMapping[]>(DEFAULT_STATE.volumes)
    const [envVars, setEnvVars] = useState<EnvVar[]>(DEFAULT_STATE.envVars)
    const [network, setNetwork] = useState(DEFAULT_STATE.network)
    const [restartPolicy, setRestartPolicy] = useState(DEFAULT_STATE.restartPolicy)
    const [flags, setFlags] = useState(DEFAULT_STATE.flags)
    const [memory, setMemory] = useState(DEFAULT_STATE.memory)
    const [cpus, setCpus] = useState(DEFAULT_STATE.cpus)
    const [tab, setTab] = useState<"run" | "compose">(DEFAULT_STATE.tab)
    const { toast } = useToast()
    const shareState = useMemo(
        () => ({
            image,
            containerName,
            ports,
            volumes,
            envVars,
            network,
            restartPolicy,
            flags,
            memory,
            cpus,
            tab,
        }),
        [image, containerName, ports, volumes, envVars, network, restartPolicy, flags, memory, cpus, tab],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setImage(typeof state.image === "string" ? state.image : DEFAULT_STATE.image)
        setContainerName(typeof state.containerName === "string" ? state.containerName : DEFAULT_STATE.containerName)
        setPorts(Array.isArray(state.ports) ? (state.ports as PortMapping[]) : DEFAULT_STATE.ports)
        setVolumes(Array.isArray(state.volumes) ? (state.volumes as VolumeMapping[]) : DEFAULT_STATE.volumes)
        setEnvVars(Array.isArray(state.envVars) ? (state.envVars as EnvVar[]) : DEFAULT_STATE.envVars)
        setNetwork(typeof state.network === "string" ? state.network : DEFAULT_STATE.network)
        setRestartPolicy(typeof state.restartPolicy === "string" ? state.restartPolicy : DEFAULT_STATE.restartPolicy)
        setFlags(typeof state.flags === "object" && state.flags ? (state.flags as typeof flags) : DEFAULT_STATE.flags)
        setMemory(typeof state.memory === "string" ? state.memory : DEFAULT_STATE.memory)
        setCpus(typeof state.cpus === "string" ? state.cpus : DEFAULT_STATE.cpus)
        setTab(state.tab === "compose" ? "compose" : "run")
    })
    const { addEntry } = useToolHistory("docker-command-builder", "Docker Command Builder")

    const applyPreset = useCallback((preset: Preset) => {
        setImage(preset.image)
        setContainerName(preset.name)
        setPorts(preset.ports)
        setVolumes(preset.volumes)
        setEnvVars(preset.envVars)
        setFlags((current) => ({ ...current, ...preset.flags }))
    }, [])

    const resetAll = useCallback(() => {
        setImage(DEFAULT_STATE.image)
        setContainerName(DEFAULT_STATE.containerName)
        setPorts(DEFAULT_STATE.ports)
        setVolumes(DEFAULT_STATE.volumes)
        setEnvVars(DEFAULT_STATE.envVars)
        setNetwork(DEFAULT_STATE.network)
        setRestartPolicy(DEFAULT_STATE.restartPolicy)
        setFlags(DEFAULT_STATE.flags)
        setMemory(DEFAULT_STATE.memory)
        setCpus(DEFAULT_STATE.cpus)
        setTab(DEFAULT_STATE.tab)
    }, [])

    const dockerRunCommand = useMemo(() => {
        const parts = ["docker run"]
        if (flags.detach) parts.push("-d")
        if (flags.rm) parts.push("--rm")
        if (flags.interactive) parts.push("-it")
        if (flags.privileged) parts.push("--privileged")
        if (flags.readOnly) parts.push("--read-only")
        if (containerName.trim()) parts.push(`--name ${containerName.trim()}`)
        if (network.trim()) parts.push(`--network ${network.trim()}`)
        if (restartPolicy) parts.push(`--restart ${restartPolicy}`)
        if (memory.trim()) parts.push(`--memory ${memory.trim()}`)
        if (cpus.trim()) parts.push(`--cpus ${cpus.trim()}`)
        for (const p of ports) {
            if (p.host && p.container) parts.push(`-p ${p.host}:${p.container}${p.protocol !== "tcp" ? `/${p.protocol}` : ""}`)
        }
        for (const v of volumes) {
            if (v.host && v.container) parts.push(`-v ${v.host}:${v.container}${v.mode === "ro" ? ":ro" : ""}`)
        }
        for (const e of envVars) {
            if (e.key) parts.push(`-e ${e.key}=${e.value}`)
        }
        parts.push(image)
        return parts.join(" \\\n  ")
    }, [image, containerName, ports, volumes, envVars, network, restartPolicy, flags, memory, cpus])

    const dockerComposeYaml = useMemo(() => {
        const service: Record<string, unknown> = { image }
        if (containerName.trim()) service.container_name = containerName.trim()
        if (ports.some(p => p.host && p.container)) {
            service.ports = ports.filter(p => p.host && p.container).map(p => `${p.host}:${p.container}`)
        }
        if (volumes.some(v => v.host && v.container)) {
            service.volumes = volumes.filter(v => v.host && v.container).map(v => `${v.host}:${v.container}${v.mode === "ro" ? ":ro" : ""}`)
        }
        if (envVars.some(e => e.key)) {
            service.environment = {}
            for (const e of envVars) {
                if (e.key) (service.environment as Record<string, string>)[e.key] = e.value
            }
        }
        if (network.trim()) service.networks = [network.trim()]
        if (restartPolicy) service.restart = restartPolicy
        if (memory.trim()) {
            service.deploy = { resources: { limits: { memory: memory.trim() } } }
        }
        const compose = { version: "3.8", services: { [containerName.trim() || "app"]: service } }
        return yaml.dump(compose, { indent: 2, lineWidth: -1 })
    }, [image, containerName, ports, volumes, envVars, network, restartPolicy, memory])

    const output = tab === "run" ? dockerRunCommand : dockerComposeYaml

    const copyCommand = useCallback(() => {
        navigator.clipboard.writeText(output)
        toast({ title: "Copied to clipboard" })
        addEntry({
            input: JSON.stringify({ image, containerName, ports, volumes, envVars, network, restartPolicy, flags, memory, cpus, tab }),
            output,
            metadata: { action: "copy", tab },
        })
    }, [output, toast, addEntry, image, containerName, ports, volumes, envVars, network, restartPolicy, flags, memory, cpus, tab])

    const downloadCompose = useCallback(() => {
        if (tab !== "compose") return
        const blob = new Blob([dockerComposeYaml], { type: "text/yaml" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "docker-compose.yml"
        link.click()
        URL.revokeObjectURL(url)
        addEntry({
            input: JSON.stringify({ image, containerName, ports, volumes, envVars, network, restartPolicy, flags, memory, cpus, tab }),
            output: dockerComposeYaml,
            metadata: { action: "download", tab: "compose" },
        })
    }, [tab, dockerComposeYaml, addEntry, image, containerName, ports, volumes, envVars, network, restartPolicy, flags, memory, cpus])

    return (
        <ToolCard
            title="Docker Command Builder"
            description="Build docker run commands and docker-compose files visually"
            icon={<Container className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            pipeSource={{ toolId: "docker-command-builder", output }}
            history={{
                toolId: "docker-command-builder",
                toolName: "Docker Command Builder",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as {
                            image?: string;
                            containerName?: string;
                            ports?: PortMapping[];
                            volumes?: VolumeMapping[];
                            envVars?: EnvVar[];
                            network?: string;
                            restartPolicy?: string;
                            flags?: typeof flags;
                            memory?: string;
                            cpus?: string;
                            tab?: "run" | "compose";
                        };
                        setImage(parsed.image || "nginx:latest")
                        setContainerName(parsed.containerName || "my-container")
                        setPorts(parsed.ports || [{ host: "8080", container: "80", protocol: "tcp" }])
                        setVolumes(parsed.volumes || [])
                        setEnvVars(parsed.envVars || [])
                        setNetwork(parsed.network || "")
                        setRestartPolicy(parsed.restartPolicy || "")
                        setFlags(parsed.flags || { detach: true, rm: false, interactive: false, privileged: false, readOnly: false })
                        setMemory(parsed.memory || "")
                        setCpus(parsed.cpus || "")
                        setTab(parsed.tab === "compose" ? "compose" : "run")
                    } catch {
                        // ignore
                    }
                },
            }}
        >
            <div className="space-y-4">
                <ToolEmptyState
                    title="Build a container in seconds"
                    description="Pick a preset, tweak ports and environment variables, and copy the generated docker run or docker-compose output."
                    actions={(
                        <>
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={resetAll}>
                                Reset to defaults
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setTab("run")}>
                                Focus docker run
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setTab("compose")}>
                                Focus compose
                            </Button>
                        </>
                    )}
                    hint="Output updates live as you edit. Use the copy button to send it to your clipboard."
                    compact={false}
                />

                {/* Presets */}
                <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map(p => (
                        <Button key={p.label} variant="outline" size="sm" className="text-xs h-7" onClick={() => applyPreset(p)}>
                            <Zap className="h-3 w-3 mr-1" /> {p.label}
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Form */}
                    <div className="space-y-3">
                        {/* Core */}
                        <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                            <div>
                                <div className="text-xs font-semibold">Core configuration</div>
                                <p className="text-[11px] text-muted-foreground">Define the image and container identity.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Image</label>
                                    <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="nginx:latest" className="text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Container Name</label>
                                    <Input value={containerName} onChange={(e) => setContainerName(e.target.value)} placeholder="my-container" className="text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Flags */}
                        <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                            <div>
                                <div className="text-xs font-semibold">Run flags</div>
                                <p className="text-[11px] text-muted-foreground">Common runtime switches for docker run.</p>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm">
                                {Object.entries(flags).map(([key, val]) => (
                                    <label key={key} className="flex items-center gap-1.5">
                                        <input type="checkbox" checked={val} onChange={(e) => setFlags(f => ({ ...f, [key]: e.target.checked }))} className="rounded" />
                                        <span className="text-xs">
                                            {key === "detach" ? "-d (detached)" : key === "rm" ? "--rm" : key === "interactive" ? "-it" : key === "privileged" ? "--privileged" : "--read-only"}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Ports */}
                        <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="text-xs font-semibold">Port mappings</div>
                                    <p className="text-[11px] text-muted-foreground">Expose container ports to the host.</p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setPorts([...ports, { host: "", container: "", protocol: "tcp" }])}>
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            {ports.map((p, i) => (
                                <div key={i} className="flex flex-wrap gap-1.5 items-center">
                                    <Input value={p.host} onChange={(e) => setPorts(ps => ps.map((pp, j) => j === i ? { ...pp, host: e.target.value } : pp))} placeholder="Host" className="text-xs w-20" />
                                    <span className="text-xs text-muted-foreground">:</span>
                                    <Input value={p.container} onChange={(e) => setPorts(ps => ps.map((pp, j) => j === i ? { ...pp, container: e.target.value } : pp))} placeholder="Container" className="text-xs w-20" />
                                    <select value={p.protocol} onChange={(e) => setPorts(ps => ps.map((pp, j) => j === i ? { ...pp, protocol: e.target.value } : pp))} className="text-xs rounded border bg-background px-1 py-1">
                                        <option value="tcp">tcp</option>
                                        <option value="udp">udp</option>
                                    </select>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPorts(ps => ps.filter((_, j) => j !== i))}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Volumes */}
                        <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="text-xs font-semibold">Volumes</div>
                                    <p className="text-[11px] text-muted-foreground">Mount host paths or named volumes.</p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setVolumes([...volumes, { host: "", container: "", mode: "rw" }])}>
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            {volumes.length === 0 && (
                                <div className="text-[11px] text-muted-foreground">No volumes yet. Add one to persist data or mount files.</div>
                            )}
                            {volumes.map((v, i) => (
                                <div key={i} className="flex flex-wrap gap-1.5 items-center">
                                    <Input value={v.host} onChange={(e) => setVolumes(vs => vs.map((vv, j) => j === i ? { ...vv, host: e.target.value } : vv))} placeholder="Host path" className="text-xs flex-1" />
                                    <span className="text-xs text-muted-foreground">:</span>
                                    <Input value={v.container} onChange={(e) => setVolumes(vs => vs.map((vv, j) => j === i ? { ...vv, container: e.target.value } : vv))} placeholder="Container path" className="text-xs flex-1" />
                                    <select value={v.mode} onChange={(e) => setVolumes(vs => vs.map((vv, j) => j === i ? { ...vv, mode: e.target.value } : vv))} className="text-xs rounded border bg-background px-1 py-1">
                                        <option value="rw">rw</option>
                                        <option value="ro">ro</option>
                                    </select>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setVolumes(vs => vs.filter((_, j) => j !== i))}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Env Vars */}
                        <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="text-xs font-semibold">Environment variables</div>
                                    <p className="text-[11px] text-muted-foreground">Pass configuration values into the container.</p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEnvVars([...envVars, { key: "", value: "" }])}>
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            {envVars.length === 0 && (
                                <div className="text-[11px] text-muted-foreground">No variables yet. Add KEY=value pairs when needed.</div>
                            )}
                            {envVars.map((e, i) => (
                                <div key={i} className="flex flex-wrap gap-1.5 items-center">
                                    <Input value={e.key} onChange={(ev) => setEnvVars(es => es.map((ee, j) => j === i ? { ...ee, key: ev.target.value } : ee))} placeholder="KEY" className="text-xs flex-1 font-mono" />
                                    <span className="text-xs text-muted-foreground">=</span>
                                    <Input value={e.value} onChange={(ev) => setEnvVars(es => es.map((ee, j) => j === i ? { ...ee, value: ev.target.value } : ee))} placeholder="value" className="text-xs flex-1" />
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEnvVars(es => es.filter((_, j) => j !== i))}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Advanced */}
                        <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                            <div>
                                <div className="text-xs font-semibold">Resources & policies</div>
                                <p className="text-[11px] text-muted-foreground">Networking, restart policy, and limits.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Network</label>
                                    <Input value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="bridge" className="text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Restart Policy</label>
                                    <select value={restartPolicy} onChange={(e) => setRestartPolicy(e.target.value)} className="w-full text-xs rounded border bg-background px-2 py-1.5">
                                        <option value="">none</option>
                                        <option value="always">always</option>
                                        <option value="unless-stopped">unless-stopped</option>
                                        <option value="on-failure">on-failure</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Memory Limit</label>
                                    <Input value={memory} onChange={(e) => setMemory(e.target.value)} placeholder="512m" className="text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">CPU Limit</label>
                                    <Input value={cpus} onChange={(e) => setCpus(e.target.value)} placeholder="1.5" className="text-xs" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Output */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1">
                                <Button variant={tab === "run" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setTab("run")}>
                                    docker run
                                </Button>
                                <Button variant={tab === "compose" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setTab("compose")}>
                                    docker-compose.yml
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                {tab === "compose" && (
                                    <Button variant="outline" size="sm" className="text-xs" onClick={downloadCompose}>
                                        Download
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" className="text-xs" onClick={copyCommand}>
                                    <Copy className="h-3.5 w-3.5 mr-1" />
                                    Copy
                                </Button>
                            </div>
                        </div>
                        <div className="relative">
                            <Textarea
                                value={output}
                                readOnly
                                className="font-mono text-sm min-h-[420px] bg-muted/30"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolCard>
    )
}
