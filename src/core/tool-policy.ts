export type Sensitivity = 'normal' | 'personal' | 'secret';
export type NetworkPolicy = 'none' | 'user_initiated';
export interface ToolPolicy {
  sensitivity: Sensitivity;
  network: NetworkPolicy;
  historyDefault: 'enabled' | 'disabled';
}
// Tools whose content must never be recorded, exported or shared: credentials
// and tokens (which named this class) and user-authored private content such as
// Notes, which asks for the same treatment — no history, no share, no telemetry.
const secret = new Set([
  'password-generator',
  'totp-generator',
  'jwt-decoder',
  'certificate-decoder',
  'api-request-builder',
  'websocket-tester',
  'qr-code-generator',
  'docker-command-builder',
  'notes',
]);
const personal = new Set(['pdf-tools', 'image-converter']);
export function getToolPolicy(id: string): ToolPolicy {
  const sensitivity = secret.has(id) ? 'secret' : personal.has(id) ? 'personal' : 'normal';
  return {
    sensitivity,
    network: ['api-request-builder', 'websocket-tester'].includes(id) ? 'user_initiated' : 'none',
    historyDefault: sensitivity === 'secret' ? 'disabled' : 'enabled',
  };
}
export function canPersistTool(id: string) {
  return getToolPolicy(id).historyDefault === 'enabled';
}
export function canShareTool(id: string) {
  return getToolPolicy(id).sensitivity !== 'secret';
}
