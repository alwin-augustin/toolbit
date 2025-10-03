import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";

// Lazy load all tool components for code splitting
const JsonFormatter = lazy(() => import("@/components/tools/JsonFormatter"));
const YamlFormatter = lazy(() => import("@/components/tools/YamlFormatter"));
const Base64Encoder = lazy(() => import("@/components/tools/Base64Encoder"));
const UrlEncoder = lazy(() => import("@/components/tools/UrlEncoder"));
const JsonValidator = lazy(() => import("@/components/tools/JsonValidator"));
const CaseConverter = lazy(() => import("@/components/tools/CaseConverter"));
const TimestampConverter = lazy(() => import("@/components/tools/TimestampConverter"));
const WordCounter = lazy(() => import("@/components/tools/WordCounter"));
const DateCalculator = lazy(() => import("@/components/tools/DateCalculator"));
const UuidGenerator = lazy(() => import("@/components/tools/UuidGenerator"));
const HashGenerator = lazy(() => import("@/components/tools/HashGenerator"));
const JwtDecoder = lazy(() => import("@/components/tools/JwtDecoder"));
const DiffTool = lazy(() => import("@/components/tools/DiffTool"));
const MarkdownPreviewer = lazy(() => import("@/components/tools/MarkdownPreviewer"));
const ColorConverter = lazy(() => import("@/components/tools/ColorConverter"));
const HtmlEscape = lazy(() => import("@/components/tools/HtmlEscape"));
const StripWhitespace = lazy(() => import("@/components/tools/StripWhitespace"));
const CsvToJsonConverter = lazy(() => import("@/components/tools/CsvToJsonConverter"));
const JsonToPythonConverter = lazy(() => import("@/components/tools/JsonToPythonConverter"));
const CronParser = lazy(() => import("@/components/tools/CronParser"));
const UnitConverter = lazy(() => import("@/components/tools/UnitConverter"));
const HttpStatusCodeReference = lazy(() => import("@/components/tools/HttpStatusCodeReference"));
const CssFormatter = lazy(() => import("@/components/tools/CssFormatter"));
const JsJsonMinifier = lazy(() => import("@/components/tools/JsJsonMinifier"));

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
