import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";

// Lazy load all tool components for code splitting
const JsonFormatter = lazy(() => import("@/components/tools/JsonFormatter").then(m => ({ default: m.default })));
const YamlFormatter = lazy(() => import("@/components/tools/YamlFormatter").then(m => ({ default: m.default })));
const Base64Encoder = lazy(() => import("@/components/tools/Base64Encoder").then(m => ({ default: m.default })));
const UrlEncoder = lazy(() => import("@/components/tools/UrlEncoder").then(m => ({ default: m.default })));
const JsonValidator = lazy(() => import("@/components/tools/JsonValidator").then(m => ({ default: m.default })));
const CaseConverter = lazy(() => import("@/components/tools/CaseConverter").then(m => ({ default: m.default })));
const TimestampConverter = lazy(() => import("@/components/tools/TimestampConverter").then(m => ({ default: m.default })));
const WordCounter = lazy(() => import("@/components/tools/WordCounter").then(m => ({ default: m.default })));
const DateCalculator = lazy(() => import("@/components/tools/DateCalculator").then(m => ({ default: m.default })));
const UuidGenerator = lazy(() => import("@/components/tools/UuidGenerator").then(m => ({ default: m.default })));
const HashGenerator = lazy(() => import("@/components/tools/HashGenerator").then(m => ({ default: m.default })));
const JwtDecoder = lazy(() => import("@/components/tools/JwtDecoder").then(m => ({ default: m.default })));
const DiffTool = lazy(() => import("@/components/tools/DiffTool").then(m => ({ default: m.default })));
const MarkdownPreviewer = lazy(() => import("@/components/tools/MarkdownPreviewer").then(m => ({ default: m.default })));
const ColorConverter = lazy(() => import("@/components/tools/ColorConverter").then(m => ({ default: m.default })));
const HtmlEscape = lazy(() => import("@/components/tools/HtmlEscape").then(m => ({ default: m.default })));
const StripWhitespace = lazy(() => import("@/components/tools/StripWhitespace").then(m => ({ default: m.default })));
const CsvToJsonConverter = lazy(() => import("@/components/tools/CsvToJsonConverter").then(m => ({ default: m.default })));
const JsonToPythonConverter = lazy(() => import("@/components/tools/JsonToPythonConverter").then(m => ({ default: m.default })));
const CronParser = lazy(() => import("@/components/tools/CronParser").then(m => ({ default: m.default })));
const UnitConverter = lazy(() => import("@/components/tools/UnitConverter").then(m => ({ default: m.default })));
const HttpStatusCodeReference = lazy(() => import("@/components/tools/HttpStatusCodeReference").then(m => ({ default: m.default })));
const CssFormatter = lazy(() => import("@/components/tools/CssFormatter").then(m => ({ default: m.default })));
const JsJsonMinifier = lazy(() => import("@/components/tools/JsJsonMinifier").then(m => ({ default: m.default })));

// Loading component with minimal spinner
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
);

const routes = [
    { path: "/", component: JsonFormatter },
    { path: "/json-formatter", component: JsonFormatter },
    { path: "/yaml-formatter", component: YamlFormatter },
    { path: "/base64-encoder", component: Base64Encoder },
    { path: "/url-encoder", component: UrlEncoder },
    { path: "/json-validator", component: JsonValidator },
    { path: "/case-converter", component: CaseConverter },
    { path: "/timestamp-converter", component: TimestampConverter },
    { path: "/word-counter", component: WordCounter },
    { path: "/date-calculator", component: DateCalculator },
    { path: "/uuid-generator", component: UuidGenerator },
    { path: "/hash-generator", component: HashGenerator },
    { path: "/jwt-decoder", component: JwtDecoder },
    { path: "/diff-tool", component: DiffTool },
    { path: "/markdown-previewer", component: MarkdownPreviewer },
    { path: "/color-converter", component: ColorConverter },
    { path: "/html-escape", component: HtmlEscape },
    { path: "/strip-whitespace", component: StripWhitespace },
    { path: "/csv-to-json", component: CsvToJsonConverter },
    { path: "/json-to-python", component: JsonToPythonConverter },
    { path: "/cron-parser", component: CronParser },
    { path: "/unit-converter", component: UnitConverter },
    { path: "/http-status-codes", component: HttpStatusCodeReference },
    { path: "/css-formatter", component: CssFormatter },
    { path: "/js-json-minifier", component: JsJsonMinifier },
];

export function AppRouter() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Switch>
                {routes.map(({ path, component }) => (
                    <Route key={path} path={path} component={component} />
                ))}
            </Switch>
        </Suspense>
    );
}
