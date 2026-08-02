import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * v2 implementations that replace the legacy tool page for a given slug.
 * The six priority tools render these inside the workspace shell; the
 * unified cron experience also claims the crontab-generator slug.
 */
export const V2_TOOL_OVERRIDES: Record<string, LazyExoticComponent<ComponentType>> = {
    "json-formatter": lazy(() => import("./JsonFormatterV2")),
    "jwt-decoder": lazy(() => import("./JwtDecoderV2")),
    "base64-encoder": lazy(() => import("./Base64EncoderV2")),
    "url-encoder": lazy(() => import("./UrlEncoderV2")),
    "uuid-generator": lazy(() => import("./UuidGeneratorV2")),
    "cron-parser": lazy(() => import("./CronParserV2")),
    "crontab-generator": lazy(() => import("./CronParserV2")),
};
