import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { LoadingFallback } from "@/components/LoadingFallback";

// Lazy load all tool components for better performance
const JsonFormatter = lazy(() => import("@/components/tools").then(m => ({ default: m.JsonFormatter })));
const YamlFormatter = lazy(() => import("@/components/tools").then(m => ({ default: m.YamlFormatter })));
const Base64Encoder = lazy(() => import("@/components/tools").then(m => ({ default: m.Base64Encoder })));
const UrlEncoder = lazy(() => import("@/components/tools").then(m => ({ default: m.UrlEncoder })));
const JsonValidator = lazy(() => import("@/components/tools").then(m => ({ default: m.JsonValidator })));
const CaseConverter = lazy(() => import("@/components/tools").then(m => ({ default: m.CaseConverter })));
const TimestampConverter = lazy(() => import("@/components/tools").then(m => ({ default: m.TimestampConverter })));
const WordCounter = lazy(() => import("@/components/tools").then(m => ({ default: m.WordCounter })));
const DateCalculator = lazy(() => import("@/components/tools").then(m => ({ default: m.DateCalculator })));
const UuidGenerator = lazy(() => import("@/components/tools").then(m => ({ default: m.UuidGenerator })));
const HashGenerator = lazy(() => import("@/components/tools").then(m => ({ default: m.HashGenerator })));
const JwtDecoder = lazy(() => import("@/components/tools").then(m => ({ default: m.JwtDecoder })));
const DiffTool = lazy(() => import("@/components/tools").then(m => ({ default: m.DiffTool })));
const MarkdownPreviewer = lazy(() => import("@/components/tools").then(m => ({ default: m.MarkdownPreviewer })));
const ColorConverter = lazy(() => import("@/components/tools").then(m => ({ default: m.ColorConverter })));
const HtmlEscape = lazy(() => import("@/components/tools").then(m => ({ default: m.HtmlEscape })));
const StripWhitespace = lazy(() => import("@/components/tools").then(m => ({ default: m.StripWhitespace })));
const CsvToJsonConverter = lazy(() => import("@/components/tools").then(m => ({ default: m.CsvToJsonConverter })));
const JsonToPythonConverter = lazy(() => import("@/components/tools").then(m => ({ default: m.JsonToPythonConverter })));
const CronParser = lazy(() => import("@/components/tools").then(m => ({ default: m.CronParser })));
const UnitConverter = lazy(() => import("@/components/tools").then(m => ({ default: m.UnitConverter })));
const HttpStatusCodeReference = lazy(() => import("@/components/tools").then(m => ({ default: m.HttpStatusCodeReference })));
const CssFormatter = lazy(() => import("@/components/tools").then(m => ({ default: m.CssFormatter })));
const JsJsonMinifier = lazy(() => import("@/components/tools").then(m => ({ default: m.JsJsonMinifier })));

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
                {routes.map(({ path, component: Component }) => (
                    <Route key={path} path={path}>
                        <Suspense fallback={<LoadingFallback />}>
                            <Component />
                        </Suspense>
                    </Route>
                ))}
            </Switch>
        </Suspense>
    );
}
