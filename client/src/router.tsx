import { Switch, Route } from "wouter";
import {
    JsonFormatter,
    YamlFormatter,
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
    JsonToPythonConverter,
    CronParser,
    UnitConverter,
    HttpStatusCodeReference,
    CssFormatter,
    JsJsonMinifier,
} from "@/components/tools";

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
        <Switch>
            {routes.map(({ path, component }) => (
                <Route key={path} path={path} component={component} />
            ))}

        </Switch>
    );
}
