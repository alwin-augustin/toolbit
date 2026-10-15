import { TOOLS } from '@/content/tools.config';
import { safeStorage, usePreferences } from '@/core/preferences';
import { canShareTool } from '@/core/tool-policy';
import { isDesktopBuild } from '@/platform/desktop';

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
  'discovery_query',
  'discovery_suggestion_accepted',
  'discovery_handoff',
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
  from_tool_id?: string;
  to_tool_id?: string;
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
  discovery_source?: 'palette' | 'start';
  resolved_by?: 'name' | 'intent' | 'keyword' | 'type' | 'mixed' | 'none' | 'detect';
  result_count_bucket?: 'none' | 'few' | 'many';
};
const toolIds = new Set(TOOLS.map((t) => t.id));
const routes = new Set(['home', 'about', 'privacy', 'terms', 'unknown', ...toolIds]);
const enumProps: Record<string, Set<unknown>> = {
  tool_id: toolIds,
  from_tool_id: toolIds,
  to_tool_id: toolIds,
  route: routes,
  operation_id: new Set(['encode', 'decode', 'format', 'validate', 'normalize', 'hash']),
  error_code: new Set(ERROR_CODES),
  duration_bucket: new Set(['fast', 'medium', 'slow']),
  byte_bucket: new Set(['small', 'medium', 'large']),
  component: new Set(['app', 'tool']),
  source: new Set(['pipeline', 'open_tabs']),
  discovery_source: new Set(['palette', 'start']),
  resolved_by: new Set(['name', 'intent', 'keyword', 'type', 'mixed', 'none', 'detect']),
  result_count_bucket: new Set(['none', 'few', 'many']),
};
/** Rebuild properties from enums and bounded numbers; never pass through strings. */
export function sanitizeProperties(raw: Record<string, unknown> = {}): Props {
  const out: Record<string, unknown> = {
    release_id:
      import.meta.env.VITE_TELEMETRY_VERIFICATION === 'true' ? 'verification-2026-10-01' : '2.0.0',
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
/**
 * The browser's own privacy signal, treated the way the consent toggle is: a
 * refusal. `Do Not Track` and Global Privacy Control are the two signals a
 * browser or extension can set without the app being asked, and neither should
 * be outvoted by a stored preference — so a signal suppresses sending without
 * rewriting the user's stored choice.
 */
export function privacySignalRefused(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true;
}
function configure() {
  // The installed app has no analytics at all: not a preference the user can
  // flip, but a property of the build. Nothing is stored, nothing is sent.
  if (isDesktopBuild) return;
  if (!usePreferences.getState().analytics || privacySignalRefused()) {
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
  if (
    isDesktopBuild ||
    !apiKey ||
    !apiHost ||
    !usePreferences.getState().analytics ||
    privacySignalRefused() ||
    !EVENT_NAMES.includes(name)
  )
    return;
  const eventProperties = sanitizeProperties({
    route: routeName(window.location.pathname),
    ...properties,
  });
  // A tool excluded from sharing (secret/private, e.g. Notes) keeps its presence
  // out of analytics too: if the event names one — as tool_id, a handoff edge,
  // or its route — it never leaves the device. Payloads are already stripped by
  // sanitizeProperties.
  const namedTools = [
    eventProperties.tool_id,
    eventProperties.from_tool_id,
    eventProperties.to_tool_id,
  ];
  if (
    namedTools.some((id) => id !== undefined && !canShareTool(id)) ||
    (eventProperties.route && !canShareTool(eventProperties.route))
  )
    return;
  const controller = new AbortController();
  pending.add(controller);
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const body = JSON.stringify({
      api_key: apiKey,
      event: name,
      properties: {
        ...eventProperties,
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
  !isDesktopBuild && import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_HOST,
);
