export type Sensitivity = 'normal' | 'personal' | 'secret';
export type NetworkPolicy = 'none' | 'user_initiated';
export interface ToolPolicy { sensitivity: Sensitivity; network: NetworkPolicy; historyDefault: 'enabled' | 'disabled' }
const secret = new Set(['password-generator', 'totp-generator', 'jwt-decoder', 'certificate-decoder', 'api-request-builder', 'websocket-tester', 'qr-code-generator', 'docker-command-builder']);
const personal = new Set(['pdf-tools', 'image-converter']);
export function getToolPolicy(id: string): ToolPolicy {
    const sensitivity = secret.has(id) ? 'secret' : personal.has(id) ? 'personal' : 'normal';
    return { sensitivity, network: ['api-request-builder', 'websocket-tester'].includes(id) ? 'user_initiated' : 'none', historyDefault: sensitivity === 'secret' ? 'disabled' : 'enabled' };
}
export function canPersistTool(id: string) { return getToolPolicy(id).historyDefault === 'enabled'; }
export function canShareTool(id: string) { return getToolPolicy(id).sensitivity !== 'secret'; }
