import { TOOLS } from '@/config/tools.config';
import { safeStorage, usePreferences } from '@/lib/preferences';

export const EVENT_NAMES = [
  'page_viewed',
  'tool_opened',
  'transform_succeeded',
  'transform_failed',
  'output_copied',
  'pipeline_step_added',
  'recipe_saved',
  'recipe_rerun',
  'workspace_restored',
  'workspace_saved',
  'snippet_saved',
  'tool_shared',
  'smart_detection_used',
  'app_error',
  'operational_log',
] as const;
export type EventName = (typeof EVENT_NAMES)[number];
export const ERROR_CODES = [
  'INVALID_INPUT',
  'INPUT_TOO_LARGE',
  'CANCELLED',
  'CLIPBOARD_DENIED',
  'STORAGE_UNAVAILABLE',
  'RENDER_FAILED',
  'UNEXPECTED',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
type Props = {
  tool_id?: string;
  operation_id?: 'encode' | 'decode' | 'format' | 'validate' | 'normalize' | 'hash';
  route?: string;
  error_code?: ErrorCode;
  duration_bucket?: 'fast' | 'medium' | 'slow';
  byte_bucket?: 'small' | 'medium' | 'large';
  step_count?: number;
  schema_version?: number;
  release_id?: string;
  component?: 'app' | 'tool';
  source?: 'pipeline' | 'open_tabs';
};
const toolIds = new Set(TOOLS.map((t) => t.id));
const routes = new Set(['home', 'about', 'privacy', 'terms', 'unknown', ...toolIds]);
const enumProps: Record<string, Set<unknown>> = {
  tool_id: toolIds,
  route: routes,
  operation_id: new Set(['encode', 'decode', 'format', 'validate', 'normalize', 'hash']),
  error_code: new Set(ERROR_CODES),
  duration_bucket: new Set(['fast', 'medium', 'slow']),
  byte_bucket: new Set(['small', 'medium', 'large']),
  component: new Set(['app', 'tool']),
  source: new Set(['pipeline', 'open_tabs']),
};
/** Rebuild properties from enums and bounded numbers; never pass through strings. */
export function sanitizeProperties(raw: Record<string, unknown> = {}): Props {
  const out: Record<string, unknown> = {
    release_id:
      import.meta.env.VITE_TELEMETRY_VERIFICATION === 'true' ? 'verification-2026-10-01' : '1.0.0',
  };
  for (const [key, allowed] of Object.entries(enumProps))
    if (allowed.has(raw[key])) out[key] = raw[key];
  for (const key of ['step_count', 'schema_version'])
    if (Number.isInteger(raw[key]) && Number(raw[key]) >= 0 && Number(raw[key]) <= 1000)
      out[key] = raw[key];
  return out as Props;
}
export function routeName(path: string) {
  const route = path.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
  return routes.has(route || 'home') ? route || 'home' : 'unknown';
}
let sessionIdentity = `toolbit_${crypto.randomUUID()}`;
const identityKey = 'toolbit:analytics-anonymous-id';
const pending = new Set<AbortController>();
function configure() {
  if (!usePreferences.getState().analytics) {
    safeStorage.removeItem(identityKey);
    sessionIdentity = `toolbit_${crypto.randomUUID()}`;
    for (const request of pending) request.abort();
    pending.clear();
    return;
  }
  if (!import.meta.env.VITE_POSTHOG_KEY || !import.meta.env.VITE_POSTHOG_HOST) return;
  const id = safeStorage.getItem(identityKey) || `toolbit_${crypto.randomUUID()}`;
  safeStorage.setItem(identityKey, id);
  sessionIdentity = id;
}
configure();
usePreferences.subscribe((state, previous) => {
  if (state.analytics !== previous.analytics) configure();
});
/** Explicit capture transport: no SDK, automatic properties, cookies, referrer or retry queue. */
export function track(name: EventName, properties: Props = {}) {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST;
  if (!apiKey || !apiHost || !usePreferences.getState().analytics || !EVENT_NAMES.includes(name))
    return;
  const controller = new AbortController();
  pending.add(controller);
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const body = JSON.stringify({
      api_key: apiKey,
      event: name,
      properties: {
        ...sanitizeProperties({ route: routeName(window.location.pathname), ...properties }),
        distinct_id: sessionIdentity,
        $process_person_profile: false,
      },
    });
    void fetch(`${apiHost.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    })
      .catch(() => {
        /* analytics cannot affect tools */
      })
      .finally(() => {
        clearTimeout(timer);
        pending.delete(controller);
      });
  } catch {
    clearTimeout(timer);
    pending.delete(controller);
  }
}
const reported = new WeakSet<object>();
export function reportError(error: unknown, component: 'app' | 'tool') {
  if (typeof error === 'object' && error) {
    if (reported.has(error)) return;
    reported.add(error);
  }
  track('app_error', { component, error_code: 'RENDER_FAILED' });
}
/** Transitional adapter for legacy event call sites. Unknown events fail closed. */
export const posthog = {
  capture(name: string, properties: Record<string, unknown> = {}) {
    const aliases: Record<string, EventName> = {
      $pageview: 'page_viewed',
      workspace_loaded: 'workspace_restored',
      pipeline_tool_selected: 'pipeline_step_added',
    };
    const event = aliases[name] || (name as EventName);
    if (!EVENT_NAMES.includes(event)) return;
    const normalized = {
      ...properties,
      step_count: properties.step_count ?? properties.tool_count,
      route: routeName(String(properties.path || '/')),
    };
    track(event, sanitizeProperties(normalized));
  },
  captureException(error: unknown) {
    reportError(error, 'app');
  },
};
// Compatibility gate only; track() rechecks the live preference before sending.
export const isPostHogEnabled = Boolean(
  import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_HOST,
);
