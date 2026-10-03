import { useMemo } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconPlus,
  IconSparkles,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';

export interface DockerPort {
  host: string;
  container: string;
  protocol: string;
}

export interface DockerVolume {
  host: string;
  container: string;
  mode: string;
}

export interface DockerEnvVar {
  key: string;
  value: string;
}

export interface DockerRunFlags {
  detach: boolean;
  rm: boolean;
  interactive: boolean;
  privileged: boolean;
}

export interface DockerRunOptions {
  image: string;
  name: string;
  ports: DockerPort[];
  volumes: DockerVolume[];
  env: DockerEnvVar[];
  network: string;
  restart: string;
  flags: DockerRunFlags;
}

export const DOCKER_SAMPLE: DockerRunOptions = {
  image: 'nginx:latest',
  name: 'my-nginx',
  ports: [{ host: '8080', container: '80', protocol: 'tcp' }],
  volumes: [],
  env: [],
  network: '',
  restart: '',
  flags: { detach: true, rm: false, interactive: false, privileged: false },
};

const FLAG_LABELS: Record<keyof DockerRunFlags, string> = {
  detach: '-d (detached)',
  rm: '--rm',
  interactive: '-it',
  privileged: '--privileged',
};

/** Quote a shell argument only when it contains characters outside a safe set. */
export function shellQuote(value: string): string {
  if (value.length > 0 && /^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

/** Build a copy-only `docker run` command. Generated-command scope only: never executed. */
export function buildDockerRunCommand(options: DockerRunOptions): string {
  const parts = ['docker run'];
  if (options.flags.detach) parts.push('-d');
  if (options.flags.rm) parts.push('--rm');
  if (options.flags.interactive) parts.push('-it');
  if (options.flags.privileged) parts.push('--privileged');
  if (options.name.trim()) parts.push(`--name ${shellQuote(options.name.trim())}`);
  if (options.network.trim()) parts.push(`--network ${shellQuote(options.network.trim())}`);
  if (options.restart.trim()) parts.push(`--restart ${shellQuote(options.restart.trim())}`);
  for (const port of options.ports) {
    if (port.host.trim() && port.container.trim()) {
      const mapping = `${port.host.trim()}:${port.container.trim()}${port.protocol !== 'tcp' ? `/${port.protocol}` : ''}`;
      parts.push(`-p ${shellQuote(mapping)}`);
    }
  }
  for (const volume of options.volumes) {
    if (volume.host.trim() && volume.container.trim()) {
      const mapping = `${volume.host.trim()}:${volume.container.trim()}${volume.mode === 'ro' ? ':ro' : ''}`;
      parts.push(`-v ${shellQuote(mapping)}`);
    }
  }
  for (const variable of options.env) {
    if (variable.key.trim()) {
      parts.push(`-e ${shellQuote(`${variable.key.trim()}=${variable.value}`)}`);
    }
  }
  parts.push(shellQuote(options.image.trim() || 'nginx:latest'));
  return parts.join(' \\\n  ');
}

export function DockerScreen() {
  const [image, setImage] = useSessionDocumentState<string>('image', DOCKER_SAMPLE.image);
  const [containerName, setContainerName] = useSessionDocumentState<string>(
    'containerName',
    DOCKER_SAMPLE.name,
  );
  const [ports, setPorts] = useSessionDocumentState<DockerPort[]>('ports', DOCKER_SAMPLE.ports);
  const [volumes, setVolumes] = useSessionDocumentState<DockerVolume[]>('volumes', []);
  const [envVars, setEnvVars] = useSessionDocumentState<DockerEnvVar[]>('envVars', []);
  const [network, setNetwork] = useSessionDocumentState<string>('network', '');
  const [restart, setRestart] = useSessionDocumentState<string>('restart', '');
  const [flags, setFlags] = useSessionDocumentState<DockerRunFlags>('flags', DOCKER_SAMPLE.flags);
  const notify = useWorkbenchMemory((s) => s.notify);

  const output = useMemo(
    () =>
      buildDockerRunCommand({
        image,
        name: containerName,
        ports,
        volumes,
        env: envVars,
        network,
        restart,
        flags,
      }),
    [image, containerName, ports, volumes, envVars, network, restart, flags],
  );

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(output);
      notify('Docker command copied');
    } catch {
      notify('Clipboard unavailable. Select the command and copy it.');
    }
  };

  const loadSample = () => {
    setImage(DOCKER_SAMPLE.image);
    setContainerName(DOCKER_SAMPLE.name);
    setPorts(DOCKER_SAMPLE.ports);
    setVolumes(DOCKER_SAMPLE.volumes);
    setEnvVars(DOCKER_SAMPLE.env);
    setNetwork(DOCKER_SAMPLE.network);
    setRestart(DOCKER_SAMPLE.restart);
    setFlags(DOCKER_SAMPLE.flags);
  };

  const resetAll = () => {
    setImage('');
    setContainerName('');
    setPorts([]);
    setVolumes([]);
    setEnvVars([]);
    setNetwork('');
    setRestart('');
    setFlags({ detach: false, rm: false, interactive: false, privileged: false });
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Docker</h1>
          <p>Build a docker run command to copy</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconDeviceDesktop size={18} />
            Session only
          </span>
        </div>
      </div>
      <div className="wb-toolbar">
        <button type="button" className="wb-button primary" onClick={loadSample}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
        <button type="button" className="wb-button" onClick={resetAll}>
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Reset
        </button>
        <button type="button" className="wb-button primary" onClick={() => void copyCommand()}>
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy command
        </button>
      </div>
      <p>
        Generated-command scope only: this builds a command string for review. Nothing here runs or
        manages containers. Copy the command and run it yourself.
      </p>
      <div className="wb-setting-row">
        <span>
          <strong>Image</strong>
          <small>Container image, with optional tag</small>
        </span>
        <input
          aria-label="Docker image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="nginx:latest"
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Container name</strong>
          <small>Optional --name value</small>
        </span>
        <input
          aria-label="Container name"
          value={containerName}
          onChange={(e) => setContainerName(e.target.value)}
          placeholder="my-container"
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Network</strong>
          <small>Optional --network value</small>
        </span>
        <input
          aria-label="Docker network"
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          placeholder="bridge"
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Restart policy</strong>
          <small>Optional --restart value</small>
        </span>
        <NativeSelect
          aria-label="Restart policy"
          value={restart}
          onChange={(e) => setRestart(e.target.value)}
        >
          <NativeSelectOption value="">none</NativeSelectOption>
          <NativeSelectOption value="always">always</NativeSelectOption>
          <NativeSelectOption value="unless-stopped">unless-stopped</NativeSelectOption>
          <NativeSelectOption value="on-failure">on-failure</NativeSelectOption>
        </NativeSelect>
      </div>
      {(Object.keys(FLAG_LABELS) as (keyof DockerRunFlags)[]).map((key) => (
        <div className="wb-setting-row" key={key}>
          <span>
            <strong>{FLAG_LABELS[key]}</strong>
            <small>Run flag for the generated command</small>
          </span>
          <Checkbox
            aria-label={`Flag ${FLAG_LABELS[key]}`}
            checked={flags[key]}
            onCheckedChange={(checked) => setFlags({ ...flags, [key]: Boolean(checked) })}
          />
        </div>
      ))}
      <div className="wb-setting-row">
        <span>
          <strong>Port mappings ({ports.length})</strong>
          <small>Expose container ports on the host</small>
        </span>
        <button
          type="button"
          className="wb-button"
          onClick={() => setPorts([...ports, { host: '', container: '', protocol: 'tcp' }])}
        >
          <IconPlus size={20} aria-hidden="true" />
          Add
        </button>
      </div>
      {ports.length === 0 ? (
        <div className="wb-empty">
          <h2>No ports yet</h2>
          <p>Add a mapping to expose a container port.</p>
        </div>
      ) : null}
      {ports.map((port, index) => (
        <div className="wb-list-row" key={`port-${index}`}>
          <input
            aria-label={`Port ${index + 1} host`}
            value={port.host}
            onChange={(e) =>
              setPorts(
                ports.map((entry, i) => (i === index ? { ...entry, host: e.target.value } : entry)),
              )
            }
            placeholder="Host"
          />
          <input
            aria-label={`Port ${index + 1} container`}
            value={port.container}
            onChange={(e) =>
              setPorts(
                ports.map((entry, i) =>
                  i === index ? { ...entry, container: e.target.value } : entry,
                ),
              )
            }
            placeholder="Container"
          />
          <NativeSelect
            aria-label={`Port ${index + 1} protocol`}
            value={port.protocol}
            onChange={(e) =>
              setPorts(
                ports.map((entry, i) =>
                  i === index ? { ...entry, protocol: e.target.value } : entry,
                ),
              )
            }
          >
            <NativeSelectOption value="tcp">tcp</NativeSelectOption>
            <NativeSelectOption value="udp">udp</NativeSelectOption>
          </NativeSelect>
          <button
            type="button"
            className="wb-icon-button"
            aria-label={`Remove port ${index + 1}`}
            onClick={() => setPorts(ports.filter((_, i) => i !== index))}
          >
            <IconX size={20} />
          </button>
        </div>
      ))}
      <div className="wb-setting-row">
        <span>
          <strong>Volumes ({volumes.length})</strong>
          <small>Mount host paths or named volumes</small>
        </span>
        <button
          type="button"
          className="wb-button"
          onClick={() => setVolumes([...volumes, { host: '', container: '', mode: 'rw' }])}
        >
          <IconPlus size={20} aria-hidden="true" />
          Add
        </button>
      </div>
      {volumes.length === 0 ? (
        <div className="wb-empty">
          <h2>No volumes yet</h2>
          <p>Add one to persist data or mount files.</p>
        </div>
      ) : null}
      {volumes.map((volume, index) => (
        <div className="wb-list-row" key={`volume-${index}`}>
          <input
            aria-label={`Volume ${index + 1} host`}
            value={volume.host}
            onChange={(e) =>
              setVolumes(
                volumes.map((entry, i) =>
                  i === index ? { ...entry, host: e.target.value } : entry,
                ),
              )
            }
            placeholder="Host path"
          />
          <input
            aria-label={`Volume ${index + 1} container`}
            value={volume.container}
            onChange={(e) =>
              setVolumes(
                volumes.map((entry, i) =>
                  i === index ? { ...entry, container: e.target.value } : entry,
                ),
              )
            }
            placeholder="Container path"
          />
          <NativeSelect
            aria-label={`Volume ${index + 1} mode`}
            value={volume.mode}
            onChange={(e) =>
              setVolumes(
                volumes.map((entry, i) =>
                  i === index ? { ...entry, mode: e.target.value } : entry,
                ),
              )
            }
          >
            <NativeSelectOption value="rw">rw</NativeSelectOption>
            <NativeSelectOption value="ro">ro</NativeSelectOption>
          </NativeSelect>
          <button
            type="button"
            className="wb-icon-button"
            aria-label={`Remove volume ${index + 1}`}
            onClick={() => setVolumes(volumes.filter((_, i) => i !== index))}
          >
            <IconX size={20} />
          </button>
        </div>
      ))}
      <div className="wb-setting-row">
        <span>
          <strong>Environment ({envVars.length})</strong>
          <small>KEY=value pairs passed into the container</small>
        </span>
        <button
          type="button"
          className="wb-button"
          onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
        >
          <IconPlus size={20} aria-hidden="true" />
          Add
        </button>
      </div>
      {envVars.length === 0 ? (
        <div className="wb-empty">
          <h2>No variables yet</h2>
          <p>Add KEY=value pairs when the container needs them.</p>
        </div>
      ) : null}
      {envVars.map((variable, index) => (
        <div className="wb-list-row" key={`env-${index}`}>
          <input
            aria-label={`Variable ${index + 1} key`}
            value={variable.key}
            onChange={(e) =>
              setEnvVars(
                envVars.map((entry, i) =>
                  i === index ? { ...entry, key: e.target.value } : entry,
                ),
              )
            }
            placeholder="KEY"
          />
          <input
            aria-label={`Variable ${index + 1} value`}
            value={variable.value}
            onChange={(e) =>
              setEnvVars(
                envVars.map((entry, i) =>
                  i === index ? { ...entry, value: e.target.value } : entry,
                ),
              )
            }
            placeholder="value"
          />
          <button
            type="button"
            className="wb-icon-button"
            aria-label={`Remove variable ${index + 1}`}
            onClick={() => setEnvVars(envVars.filter((_, i) => i !== index))}
          >
            <IconX size={20} />
          </button>
        </div>
      ))}
      <h2 className="wb-section-title">Generated command</h2>
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Generated command panel">
          <div className="wb-pane-header">
            <h2>docker run</h2>
            <div className="wb-copy-actions">
              <button
                type="button"
                className="wb-button primary"
                onClick={() => void copyCommand()}
              >
                <IconCopy size={22} stroke={1.7} aria-hidden="true" />
                Copy
              </button>
            </div>
          </div>
          <CodeEditor value={output} language="text" readOnly label="Generated docker command" />
          <div className="wb-pane-footer">
            <span>Review before running. Nothing here executes it.</span>
          </div>
        </section>
      </div>
    </>
  );
}
