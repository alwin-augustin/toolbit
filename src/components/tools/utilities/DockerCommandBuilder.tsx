import { useState, useCallback, useMemo } from "react"
import type { ReactNode } from "react"
import { Copy, Check, Download, Plus, RotateCcw, Trash2, Zap } from "lucide-react"
import yaml from "js-yaml"
import { Button, IconButton, Input, Select, Checkbox, Tabs } from "@/ds/components"
import { Panel, PanelHeader, EditorSplit } from "@/v2/EditorPanels"
import { CodeEditor } from "@/v2/CodeEditor"
import { Row, Grid2, Field, SectionTitle } from "@/v2/restyle-kit"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

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

const FLAG_LABELS: Record<string, string> = {
    detach: "-d (detached)",
    rm: "--rm",
    interactive: "-it",
    privileged: "--privileged",
    readOnly: "--read-only",
}

const mutedHint = { fontSize: "var(--text-xs)", color: "hsl(var(--text-faint))" } as const

function FormSection({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section
            style={{
                border: "1px solid hsl(var(--border-faint))",
                borderRadius: "var(--radius-md)",
                background: "hsl(var(--surface-1))",
                padding: 12,
                display: "grid",
                gap: 10,
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "grid", gap: 2 }}>
                    <SectionTitle>{title}</SectionTitle>
                    {hint && <span style={mutedHint}>{hint}</span>}
                </div>
                {action}
            </div>
            {children}
        </section>
    )
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
    const [copied, setCopied] = useState(false)
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
    useUrlState(shareState, (state) => {
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
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
        addEntry({
            input: JSON.stringify({ image, containerName, ports, volumes, envVars, network, restartPolicy, flags, memory, cpus, tab }),
            output,
            metadata: { action: "copy", tab },
        })
    }, [output, addEntry, image, containerName, ports, volumes, envVars, network, restartPolicy, flags, memory, cpus, tab])

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
        <EditorSplit>
            <Panel>
                <PanelHeader
                    title="Configuration"
                    action={
                        <Button variant="ghost" size="sm" iconLeft={<RotateCcw size={13} />} onClick={resetAll}>
                            Reset
                        </Button>
                    }
                />
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 12, display: "grid", gap: 12, alignContent: "start" }}>
                    <Row>
                        {PRESETS.map(p => (
                            <Button key={p.label} variant="outline" size="sm" iconLeft={<Zap size={13} />} onClick={() => applyPreset(p)}>
                                {p.label}
                            </Button>
                        ))}
                    </Row>

                    <FormSection title="Core configuration" hint="Define the image and container identity.">
                        <Grid2>
                            <Field label="Image">
                                <Input mono value={image} onChange={(e) => setImage(e.target.value)} placeholder="nginx:latest" />
                            </Field>
                            <Field label="Container name">
                                <Input mono value={containerName} onChange={(e) => setContainerName(e.target.value)} placeholder="my-container" />
                            </Field>
                        </Grid2>
                    </FormSection>

                    <FormSection title="Run flags" hint="Common runtime switches for docker run.">
                        <Row gap={16}>
                            {Object.entries(flags).map(([key, val]) => (
                                <Checkbox
                                    key={key}
                                    checked={val}
                                    onChange={(v) => setFlags(f => ({ ...f, [key]: v }))}
                                    label={FLAG_LABELS[key] ?? key}
                                />
                            ))}
                        </Row>
                    </FormSection>

                    <FormSection
                        title="Port mappings"
                        hint="Expose container ports to the host."
                        action={
                            <Button variant="ghost" size="sm" iconLeft={<Plus size={13} />} onClick={() => setPorts([...ports, { host: "", container: "", protocol: "tcp" }])}>
                                Add
                            </Button>
                        }
                    >
                        {ports.map((p, i) => (
                            <Row key={i} wrap={false}>
                                <Input mono value={p.host} onChange={(e) => setPorts(ps => ps.map((pp, j) => j === i ? { ...pp, host: e.target.value } : pp))} placeholder="Host" style={{ width: 90 }} />
                                <span style={mutedHint}>:</span>
                                <Input mono value={p.container} onChange={(e) => setPorts(ps => ps.map((pp, j) => j === i ? { ...pp, container: e.target.value } : pp))} placeholder="Container" style={{ width: 90 }} />
                                <Select value={p.protocol} onChange={(e) => setPorts(ps => ps.map((pp, j) => j === i ? { ...pp, protocol: e.target.value } : pp))}>
                                    <option value="tcp">tcp</option>
                                    <option value="udp">udp</option>
                                </Select>
                                <IconButton size="sm" title="Remove port mapping" onClick={() => setPorts(ps => ps.filter((_, j) => j !== i))}>
                                    <Trash2 size={13} />
                                </IconButton>
                            </Row>
                        ))}
                    </FormSection>

                    <FormSection
                        title="Volumes"
                        hint="Mount host paths or named volumes."
                        action={
                            <Button variant="ghost" size="sm" iconLeft={<Plus size={13} />} onClick={() => setVolumes([...volumes, { host: "", container: "", mode: "rw" }])}>
                                Add
                            </Button>
                        }
                    >
                        {volumes.length === 0 && (
                            <span style={mutedHint}>No volumes yet. Add one to persist data or mount files.</span>
                        )}
                        {volumes.map((v, i) => (
                            <Row key={i} wrap={false}>
                                <Input mono value={v.host} onChange={(e) => setVolumes(vs => vs.map((vv, j) => j === i ? { ...vv, host: e.target.value } : vv))} placeholder="Host path" style={{ flex: 1 }} />
                                <span style={mutedHint}>:</span>
                                <Input mono value={v.container} onChange={(e) => setVolumes(vs => vs.map((vv, j) => j === i ? { ...vv, container: e.target.value } : vv))} placeholder="Container path" style={{ flex: 1 }} />
                                <Select value={v.mode} onChange={(e) => setVolumes(vs => vs.map((vv, j) => j === i ? { ...vv, mode: e.target.value } : vv))}>
                                    <option value="rw">rw</option>
                                    <option value="ro">ro</option>
                                </Select>
                                <IconButton size="sm" title="Remove volume" onClick={() => setVolumes(vs => vs.filter((_, j) => j !== i))}>
                                    <Trash2 size={13} />
                                </IconButton>
                            </Row>
                        ))}
                    </FormSection>

                    <FormSection
                        title="Environment variables"
                        hint="Pass configuration values into the container."
                        action={
                            <Button variant="ghost" size="sm" iconLeft={<Plus size={13} />} onClick={() => setEnvVars([...envVars, { key: "", value: "" }])}>
                                Add
                            </Button>
                        }
                    >
                        {envVars.length === 0 && (
                            <span style={mutedHint}>No variables yet. Add KEY=value pairs when needed.</span>
                        )}
                        {envVars.map((e, i) => (
                            <Row key={i} wrap={false}>
                                <Input mono value={e.key} onChange={(ev) => setEnvVars(es => es.map((ee, j) => j === i ? { ...ee, key: ev.target.value } : ee))} placeholder="KEY" style={{ flex: 1 }} />
                                <span style={mutedHint}>=</span>
                                <Input mono value={e.value} onChange={(ev) => setEnvVars(es => es.map((ee, j) => j === i ? { ...ee, value: ev.target.value } : ee))} placeholder="value" style={{ flex: 1 }} />
                                <IconButton size="sm" title="Remove variable" onClick={() => setEnvVars(es => es.filter((_, j) => j !== i))}>
                                    <Trash2 size={13} />
                                </IconButton>
                            </Row>
                        ))}
                    </FormSection>

                    <FormSection title="Resources & policies" hint="Networking, restart policy, and limits.">
                        <Grid2>
                            <Field label="Network">
                                <Input mono value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="bridge" />
                            </Field>
                            <Field label="Restart policy">
                                <Select fullWidth value={restartPolicy} onChange={(e) => setRestartPolicy(e.target.value)}>
                                    <option value="">none</option>
                                    <option value="always">always</option>
                                    <option value="unless-stopped">unless-stopped</option>
                                    <option value="on-failure">on-failure</option>
                                </Select>
                            </Field>
                            <Field label="Memory limit">
                                <Input mono value={memory} onChange={(e) => setMemory(e.target.value)} placeholder="512m" />
                            </Field>
                            <Field label="CPU limit">
                                <Input mono value={cpus} onChange={(e) => setCpus(e.target.value)} placeholder="1.5" />
                            </Field>
                        </Grid2>
                    </FormSection>
                </div>
            </Panel>
            <Panel>
                <PanelHeader
                    title="Output"
                    badge={
                        <Tabs
                            variant="segment"
                            value={tab}
                            onChange={(v) => setTab(v === "compose" ? "compose" : "run")}
                            items={[
                                { value: "run", label: "docker run" },
                                { value: "compose", label: "docker-compose.yml" },
                            ]}
                        />
                    }
                    action={
                        <Row wrap={false} gap={6}>
                            {tab === "compose" && (
                                <IconButton size="sm" title="Download docker-compose.yml" onClick={downloadCompose}>
                                    <Download size={14} />
                                </IconButton>
                            )}
                            <IconButton size="sm" title="Copy output" onClick={copyCommand}>
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                            </IconButton>
                        </Row>
                    }
                />
                <CodeEditor value={output} language="text" readOnly />
            </Panel>
        </EditorSplit>
    )
}
