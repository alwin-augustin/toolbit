import { Switch, Route, Redirect } from "wouter";
import {
    JsonFormatter,
    Base64Encoder,
    UrlEncoder,
    JsonValidator,
    CaseConverter,
    TimestampConverter,
    WordCounter,
    DateCalculator,
    UuidGenerator,
    HashGenerator,
    JwtDecoder,
    DiffTool,
    MarkdownPreviewer,
    ColorConverter,
    HtmlEscape,
    StripWhitespace,
    CsvToJsonConverter,
    CronParser,
    UnitConverter,
    HttpStatusCodeReference,
    CssFormatter,
    JsJsonMinifier,
} from "@/components/tools";

const routes = [
    { path: "/app/json-formatter", component: JsonFormatter },
    { path: "/app/base64-encoder", component: Base64Encoder },
    { path: "/app/url-encoder", component: UrlEncoder },
    { path: "/app/json-validator", component: JsonValidator },
    { path: "/app/case-converter", component: CaseConverter },
    { path: "/app/timestamp-converter", component: TimestampConverter },
    { path: "/app/word-counter", component: WordCounter },
    { path: "/app/date-calculator", component: DateCalculator },
    { path: "/app/uuid-generator", component: UuidGenerator },
    { path: "/app/hash-generator", component: HashGenerator },
    { path: "/app/jwt-decoder", component: JwtDecoder },
    { path: "/app/diff-tool", component: DiffTool },
    { path: "/app/markdown-previewer", component: MarkdownPreviewer },
    { path: "/app/color-converter", component: ColorConverter },
    { path: "/app/html-escape", component: HtmlEscape },
    { path: "/app/strip-whitespace", component: StripWhitespace },
    { path: "/app/csv-to-json", component: CsvToJsonConverter },
    { path: "/app/cron-parser", component: CronParser },
    { path: "/app/unit-converter", component: UnitConverter },
    { path: "/app/http-status-codes", component: HttpStatusCodeReference },
    { path: "/app/css-formatter", component: CssFormatter },
    { path: "/app/js-json-minifier", component: JsJsonMinifier },
];

export function AppRouter() {
    return (
        <Switch>
            {/* Redirect /app to default tool */}
            <Route path="/app">
                <Redirect to="/app/json-formatter" />
            </Route>
            {routes.map(({ path, component }) => (
                <Route key={path} path={path} component={component} />
            ))}
        </Switch>
    );
}
