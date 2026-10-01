import { track, sanitizeProperties } from './telemetry';
export const posthogLogger = {
    info(_message: string, attributes: Record<string, unknown>) { track('operational_log', sanitizeProperties(attributes)); },
};
