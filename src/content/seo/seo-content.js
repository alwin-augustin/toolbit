/**
 * Canonical SEO content for Toolbit.
 *
 * This module is the single source of truth for the marketing surface: the
 * production domain, the per-tool landing copy, the comparison and guide
 * pages, and the site-wide FAQ. It is plain ESM (with a companion .d.ts) so
 * that both the Vite app and the Node build script can import it without a
 * TypeScript loader.
 */

export const SITE = {
  url: 'https://toolbit.app',
  name: 'Toolbit',
  title: 'Toolbit | Local-First Developer Tools, JSON Formatter & API Utilities',
  description:
    'Toolbit is a local-first developer workspace with 40+ offline tools including JSON formatter, JWT decoder, Base64 encoder, Regex tester, SQL formatter, UUID generator and more. Local processing. Optional product analytics.',
  shortDescription:
    'A local-first developer workspace with 40+ offline tools. Local processing. Optional product analytics.',
  ogImage: '/og-image.png',
  logo: '/pwa-512x512.png',
  github: 'https://github.com/alwin-augustin/toolbit',
  locale: 'en_US',
};

/** Ordered category buckets used by the tool directory and the homepage. */
export const CATEGORY_GROUPS = [
  {
    id: 'format',
    heading: 'JSON, YAML & Format Tools',
    blurb: 'Beautify, minify, and validate the structured formats you read all day.',
  },
  {
    id: 'encode',
    heading: 'Encoding & Token Tools',
    blurb: 'Encode, decode, and inspect Base64, URLs, JWTs, certificates, and wire formats.',
  },
  {
    id: 'generate',
    heading: 'Generators',
    blurb: 'Produce identifiers, hashes, passwords, QR codes, and realistic test data.',
  },
  {
    id: 'transform',
    heading: 'Converters',
    blurb: 'Move data between formats, units, colours, timestamps, and cases.',
  },
  {
    id: 'analyze',
    heading: 'Inspect & Compare',
    blurb: 'Test regular expressions, diff text, read git patches, and decode schedules.',
  },
  {
    id: 'build',
    heading: 'API & Command Builders',
    blurb: 'Compose HTTP requests, WebSocket sessions, cron entries, and Docker commands.',
  },
  {
    id: 'text',
    heading: 'Text & Document Tools',
    blurb: 'Clean up text, preview Markdown, work with PDFs, and do date maths.',
  },
];

const privacyAnswer =
  'Local transformations process input in your browser. HTTP and WebSocket tools send user-initiated requests. Optional product analytics excludes tool input and output, and can be disabled in Privacy and storage.';

const offlineAnswer =
  'Toolbit installs as a PWA in supported browsers. Cached local tools can work without a connection; network tools still require their endpoints.';

/**
 * Per-tool landing page copy.
 *
 * `slug` is the tool's URL (/<slug>) and its in-app id, so the prerendered
 * description and the running tool can never drift apart.
 */
export const TOOL_PAGES = [
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    category: 'format',
    title: 'JSON Formatter & Beautifier — Free, Offline | Toolbit',
    description:
      'Format, validate and beautify JSON instantly. Pretty-print, minify, sort keys, and pinpoint parse errors. Runs locally inside your browser — nothing is uploaded.',
    h1: 'JSON Formatter and Beautifier',
    lede: 'Paste messy JSON and get readable, correctly indented output in one keystroke. Toolbit parses and formats the document in your browser, so API responses, access tokens, and customer records never leave your machine.',
    bullets: [
      'Pretty-print with 2-space, 4-space, or tab indentation.',
      'Minify to the smallest valid payload for config files and fixtures.',
      'Precise parse errors with the line and column that broke the document.',
      'Syntax-highlighted output for reading deeply nested responses.',
    ],
    howTo: [
      'Paste or drop your JSON into the input panel.',
      'Pick pretty-print or minify and set the indentation you prefer.',
      'Copy the formatted result, or pipe it straight into the JSON validator.',
    ],
    faq: [
      {
        q: 'Is this JSON formatter free?',
        a: 'Yes. Every tool in Toolbit is free, has no sign-up, and shows no ads.',
      },
      {
        q: 'Does my JSON get uploaded to a server?',
        a: privacyAnswer,
      },
      {
        q: 'How large a JSON document can it handle?',
        a: 'Documents of several megabytes format comfortably. The limit is your browser tab memory, not a server-side upload cap.',
      },
    ],
    keywords: [
      'json formatter',
      'json beautifier',
      'json pretty print',
      'json minifier',
      'format json online',
    ],
    related: ['json-validator', 'csv-to-json', 'yaml-formatter'],
  },
  {
    slug: 'json-validator',
    name: 'JSON Validator',
    category: 'format',
    title: 'JSON Schema Validator — Validate JSON Offline | Toolbit',
    description:
      'Validate JSON against a JSON Schema and get every error with its exact path. Draft 2020-12 support, running locally in your browser.',
    h1: 'JSON Schema Validator',
    lede: 'Check a document against a JSON Schema and see exactly which properties failed and why. Toolbit uses Ajv in the browser, so contract testing a payload takes seconds and reveals nothing to anyone.',
    bullets: [
      'Full JSON Schema validation, including format assertions such as date-time and email.',
      'Every violation reported with its JSON pointer path, not just the first failure.',
      'Syntax checking for both the document and the schema itself.',
      'Works on API contracts, config files, and event payloads alike.',
    ],
    howTo: [
      'Paste the JSON document you want to check.',
      'Paste the JSON Schema it is supposed to satisfy.',
      'Read the error list and fix each reported path.',
    ],
    faq: [
      {
        q: 'Which JSON Schema drafts are supported?',
        a: 'Toolbit validates with Ajv, which covers draft-07 through draft 2020-12 along with the common format keywords.',
      },
      {
        q: 'Can I validate without a schema?',
        a: 'Yes. With the schema panel empty the tool still reports JSON syntax errors with line and column numbers.',
      },
      { q: 'Does the schema leave my browser?', a: privacyAnswer },
    ],
    keywords: [
      'json validator',
      'json schema validator',
      'validate json',
      'ajv online',
      'json lint',
    ],
    related: ['json-formatter', 'yaml-formatter', 'xml-formatter'],
  },
  {
    slug: 'csv-to-json',
    name: 'CSV to JSON Converter',
    category: 'transform',
    title: 'CSV to JSON Converter — Offline & Private | Toolbit',
    description:
      'Convert CSV and TSV data into clean JSON arrays or objects. Handles quoted fields, custom delimiters, and headers. Runs locally in your browser.',
    h1: 'CSV to JSON Converter',
    lede: 'Turn a spreadsheet export into JSON your code can consume. Toolbit parses the file in the browser, so exports full of customer or billing data never travel to a conversion service.',
    bullets: [
      'Header row detection with typed values for numbers and booleans.',
      'Custom delimiters for TSV, semicolon, and pipe-separated files.',
      'Correct handling of quoted fields, escaped quotes, and embedded newlines.',
      'Output as an array of objects or as raw row arrays.',
    ],
    howTo: [
      'Paste your CSV or drop the file onto the input panel.',
      'Confirm the delimiter and whether the first row is a header.',
      'Copy the JSON, or send it to the JSON formatter for a final tidy-up.',
    ],
    faq: [
      { q: 'Are my spreadsheet exports uploaded anywhere?', a: privacyAnswer },
      {
        q: 'Does it handle commas inside quoted values?',
        a: 'Yes. Parsing follows RFC 4180, so quoted fields containing commas, quotes, and line breaks convert correctly.',
      },
      {
        q: 'Can it convert TSV files?',
        a: 'Yes — set the delimiter to tab and TSV, semicolon, or pipe-delimited files all work.',
      },
    ],
    keywords: [
      'csv to json',
      'convert csv to json',
      'tsv to json',
      'csv parser online',
      'csv converter',
    ],
    related: ['json-formatter', 'fake-data-generator', 'yaml-formatter'],
  },
  {
    slug: 'base64-encoder',
    name: 'Base64 Encoder & Decoder',
    category: 'encode',
    title: 'Base64 Encoder & Decoder — Offline Base64 Tool | Toolbit',
    description:
      'Encode text to Base64 and decode Base64 back to text, with URL-safe and UTF-8 support. Runs locally inside your browser — nothing is uploaded.',
    h1: 'Base64 Encoder and Decoder',
    lede: 'Encode a string to Base64 or decode one back, including URL-safe variants and full Unicode. Because everything runs locally, decoding a credential or signed payload is safe to do at your desk.',
    bullets: [
      'Two-way conversion with instant results as you type.',
      'URL-safe alphabet for JWT segments and query parameters.',
      'Correct UTF-8 handling for emoji and non-Latin scripts.',
      'Clear errors when the input is not valid Base64.',
    ],
    howTo: [
      'Paste text or a Base64 string into the input panel.',
      'Choose encode or decode, and toggle URL-safe if you need it.',
      'Copy the result, or pipe it into the JWT decoder or hash generator.',
    ],
    faq: [
      { q: 'Is it safe to decode secrets here?', a: privacyAnswer },
      {
        q: 'What is URL-safe Base64?',
        a: 'It replaces + and / with - and _ so the value survives inside URLs and JWT segments. Toolbit encodes and decodes both alphabets.',
      },
      {
        q: 'Does it support Unicode?',
        a: 'Yes. Text is encoded as UTF-8 first, so emoji and non-Latin characters round-trip correctly.',
      },
    ],
    keywords: [
      'base64 encoder',
      'base64 decoder',
      'base64 online',
      'decode base64',
      'url safe base64',
    ],
    related: ['url-encoder', 'jwt-decoder', 'hash-generator'],
  },
  {
    slug: 'url-encoder',
    name: 'URL Encoder & Decoder',
    category: 'encode',
    title: 'URL Encoder & Decoder — Percent Encoding Tool | Toolbit',
    description:
      'Percent-encode and decode URLs and query strings, with component and full-URI modes. Runs locally in your browser, no uploads.',
    h1: 'URL Encoder and Decoder',
    lede: 'Escape a query parameter or read back a percent-encoded redirect URL. Toolbit offers both component and full-URI encoding so you get the right escaping for the right position in the URL.',
    bullets: [
      'Component mode escapes &, =, ?, and / for query parameter values.',
      'Full-URI mode preserves reserved characters that structure the URL.',
      'Decodes nested and double-encoded values one layer at a time.',
      'Handles UTF-8 characters and the + versus %20 space convention.',
    ],
    howTo: [
      'Paste the URL or parameter value to convert.',
      'Pick component or full-URI encoding.',
      'Copy the escaped or decoded result.',
    ],
    faq: [
      {
        q: 'What is the difference between the two modes?',
        a: 'Component mode (encodeURIComponent) escapes reserved characters so a value can sit safely inside a query string. Full-URI mode (encodeURI) leaves the characters that give a URL its structure intact.',
      },
      {
        q: 'Can it decode double-encoded URLs?',
        a: 'Yes. Run the decode step twice — each pass peels off one layer of percent encoding.',
      },
      { q: 'Is my URL sent anywhere?', a: privacyAnswer },
    ],
    keywords: [
      'url encoder',
      'url decoder',
      'percent encoding',
      'uri encode online',
      'query string encoder',
    ],
    related: ['base64-encoder', 'html-escape', 'api-request-builder'],
  },
  {
    slug: 'html-escape',
    name: 'HTML Escape & Unescape',
    category: 'encode',
    title: 'HTML Entity Encoder & Decoder — Escape HTML | Toolbit',
    description:
      'Escape HTML special characters to entities and unescape them back. Useful for templates, docs, and XSS-safe output. Runs locally in your browser.',
    h1: 'HTML Escape and Unescape',
    lede: 'Convert angle brackets, ampersands, and quotes into HTML entities so markup renders as text instead of executing. Handy when writing documentation, email templates, or CMS content.',
    bullets: [
      'Escapes &, <, >, ", and \' to their named entities.',
      'Unescapes both named and numeric entity references.',
      'Round-trips code samples you want to display literally in a page.',
      'Useful when auditing output for XSS-safe rendering.',
    ],
    howTo: [
      'Paste the markup or text you want to convert.',
      'Choose escape or unescape.',
      'Copy the result into your template or document.',
    ],
    faq: [
      {
        q: 'Does escaping HTML here make my app XSS-safe?',
        a: 'It shows what correctly escaped output looks like, but real protection comes from escaping in your template layer. Use this to inspect and verify, not as a runtime defence.',
      },
      {
        q: 'Are numeric entities supported?',
        a: 'Yes. Unescaping resolves named entities such as &amp;amp; as well as numeric ones such as &amp;#38;.',
      },
      { q: 'Is my content uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'html escape',
      'html entity encoder',
      'unescape html',
      'html entities online',
      'escape html characters',
    ],
    related: ['url-encoder', 'markdown-previewer', 'xml-formatter'],
  },
  {
    slug: 'protobuf-decoder',
    name: 'Protobuf Decoder',
    category: 'encode',
    title: 'Protobuf Decoder — Decode Protocol Buffers Online | Toolbit',
    description:
      'Decode raw Protocol Buffer wire-format bytes into readable fields without a .proto file. Runs locally in your browser, nothing uploaded.',
    h1: 'Protobuf Wire Format Decoder',
    lede: "Paste hex or Base64 protobuf bytes and see the field numbers, wire types, and values inside. Perfect for debugging a gRPC call when the schema is on someone else's laptop.",
    bullets: [
      'Schema-less decoding straight from the wire format.',
      'Shows field number, wire type, and the decoded value for each entry.',
      'Recursively expands nested length-delimited messages.',
      'Accepts hex, Base64, and escaped byte-string input.',
    ],
    howTo: [
      'Copy the raw protobuf payload as hex or Base64.',
      'Paste it into the input panel.',
      'Walk the decoded field list to identify each value.',
    ],
    faq: [
      {
        q: 'Do I need the .proto file?',
        a: 'No. The decoder reads the wire format directly, so you get field numbers and values even without the schema. With the schema in hand you can then map numbers to names.',
      },
      {
        q: 'Can it decode gRPC frames?',
        a: 'Yes, once you strip the 5-byte gRPC length prefix from the frame and paste the message bytes.',
      },
      { q: 'Is the payload uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'protobuf decoder',
      'protocol buffers decode',
      'grpc debug',
      'protobuf wire format',
      'decode protobuf online',
    ],
    related: ['base64-encoder', 'jwt-decoder', 'hash-generator'],
  },
  {
    slug: 'case-converter',
    name: 'Case Converter',
    category: 'transform',
    title: 'Case Converter — camelCase, snake_case, kebab-case | Toolbit',
    description:
      'Convert text between camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and Title Case. Runs locally in your browser.',
    h1: 'Case Converter for Identifiers',
    lede: 'Rename a batch of identifiers to match the convention of the codebase you are moving into. Paste a list, pick a target case, and copy the converted names back out.',
    bullets: [
      'camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and Title Case.',
      'Converts whole lists line by line, not just a single word.',
      'Splits acronyms and digits the way linters expect.',
      'Round-trips cleanly between any two conventions.',
    ],
    howTo: [
      'Paste the identifiers, one per line.',
      'Choose the target naming convention.',
      'Copy the converted list into your editor.',
    ],
    faq: [
      {
        q: 'Can it convert a whole file of names at once?',
        a: 'Yes. Each line is converted independently, so you can paste an entire column of field names.',
      },
      {
        q: 'How are acronyms handled?',
        a: 'Runs of capitals such as HTTPResponse are split at the boundary so you get httpResponse rather than hTTPResponse.',
      },
      { q: 'Is my text uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'case converter',
      'camelcase converter',
      'snake case converter',
      'kebab case',
      'convert text case',
    ],
    related: ['strip-whitespace', 'word-counter', 'regex-tester'],
  },
  {
    slug: 'word-counter',
    name: 'Word Counter',
    category: 'analyze',
    title: 'Word & Character Counter — Offline Text Stats | Toolbit',
    description:
      'Count words, characters, sentences, paragraphs, and reading time as you type. Runs locally in your browser with no uploads.',
    h1: 'Word and Character Counter',
    lede: 'Check whether a meta description fits, whether a commit message is too long, or how long a draft takes to read. Statistics update live as you type.',
    bullets: [
      'Words, characters with and without spaces, sentences, and paragraphs.',
      'Estimated reading time for drafts and documentation.',
      'Live updates so you can trim to a character budget in place.',
      'Useful for meta descriptions, tweets, and commit messages.',
    ],
    howTo: [
      'Paste or type your text into the panel.',
      'Watch the counters update as you edit.',
      'Trim until you are inside the limit you care about.',
    ],
    faq: [
      {
        q: 'Does it count characters with or without spaces?',
        a: 'Both are shown side by side, since different platforms count differently.',
      },
      {
        q: 'How is reading time calculated?',
        a: 'From an average of roughly 200 words per minute, which is the usual convention for prose.',
      },
      { q: 'Is my draft uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'word counter',
      'character counter',
      'text statistics',
      'reading time calculator',
      'count words online',
    ],
    related: ['strip-whitespace', 'case-converter', 'markdown-previewer'],
  },
  {
    slug: 'strip-whitespace',
    name: 'Whitespace Remover',
    category: 'text',
    title: 'Whitespace Remover — Trim & Clean Text | Toolbit',
    description:
      'Trim trailing spaces, collapse blank lines, normalise indentation, and strip invisible characters. Runs locally in your browser.',
    h1: 'Whitespace Remover and Text Cleaner',
    lede: 'Clean up text pasted out of a PDF, a chat client, or a word processor. Toolbit trims trailing spaces, collapses repeated blank lines, and removes the invisible characters that break diffs.',
    bullets: [
      'Trim leading and trailing whitespace on every line.',
      'Collapse runs of blank lines down to one.',
      'Convert tabs to spaces or spaces to tabs.',
      'Strip zero-width and non-breaking characters that hide in pasted text.',
    ],
    howTo: [
      'Paste the text you want to clean.',
      'Select the cleanup rules to apply.',
      'Copy the cleaned output.',
    ],
    faq: [
      {
        q: 'Why does my text contain invisible characters?',
        a: 'Copying from PDFs, word processors, and chat apps often brings along non-breaking spaces and zero-width joiners. They look identical but break string comparisons and diffs.',
      },
      {
        q: 'Can it convert tabs to spaces?',
        a: 'Yes, in both directions, with a configurable tab width.',
      },
      { q: 'Is my text uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'whitespace remover',
      'trim whitespace online',
      'remove blank lines',
      'text cleaner',
      'strip spaces',
    ],
    related: ['case-converter', 'word-counter', 'diff-tool'],
  },
  {
    slug: 'diff-tool',
    name: 'Text Diff Tool',
    category: 'analyze',
    title: 'Text Diff Tool — Compare Two Files Online | Toolbit',
    description:
      'Compare two blocks of text side by side and see every addition, deletion, and change highlighted. Runs locally in your browser.',
    h1: 'Text Diff and Compare Tool',
    lede: 'Put two versions of a config file, a response body, or a document next to each other and see exactly what changed. Nothing is uploaded, so comparing production config is safe.',
    bullets: [
      'Side-by-side and inline diff views.',
      'Line-level and word-level highlighting of changes.',
      'Optional whitespace-insensitive comparison.',
      'Works on config files, API responses, logs, and prose.',
    ],
    howTo: [
      'Paste the original text on the left.',
      'Paste the changed text on the right.',
      'Read the highlighted additions and deletions.',
    ],
    faq: [
      {
        q: 'Can I ignore whitespace differences?',
        a: 'Yes. Whitespace-insensitive mode hides reindentation so you only see substantive changes.',
      },
      { q: 'Is it safe to diff production config?', a: privacyAnswer },
      {
        q: 'Does it show word-level changes?',
        a: 'Yes. Changed lines are highlighted down to the individual words that differ.',
      },
    ],
    keywords: [
      'diff tool',
      'text compare',
      'compare two files online',
      'diff checker',
      'text difference',
    ],
    related: ['git-diff-viewer', 'strip-whitespace', 'json-formatter'],
  },
  {
    slug: 'git-diff-viewer',
    name: 'Git Diff Viewer',
    category: 'analyze',
    title: 'Git Diff & Patch Viewer — Read Unified Diffs | Toolbit',
    description:
      'Paste unified diff or git patch output and read it with syntax highlighting and per-file navigation. Runs locally in your browser.',
    h1: 'Git Diff and Patch Viewer',
    lede: 'Turn a wall of unified diff text into something readable. Paste the output of git diff or a .patch file and get highlighted hunks with per-file navigation.',
    bullets: [
      'Parses unified diff and git-format patches, including multi-file sets.',
      'Syntax-highlighted additions, deletions, and context lines.',
      'Per-file summary with added and removed line counts.',
      'Ideal for reviewing a patch pasted into a ticket or an email.',
    ],
    howTo: [
      'Run git diff, or open the .patch file you received.',
      'Paste the whole output into the viewer.',
      'Navigate file by file through the highlighted hunks.',
    ],
    faq: [
      {
        q: 'Which diff formats are supported?',
        a: 'Unified diffs from git diff, git format-patch output, and standard diff -u files.',
      },
      {
        q: 'Can it show renames and binary files?',
        a: 'Yes. Rename headers and binary-file markers are surfaced in the per-file summary.',
      },
      { q: 'Is the patch uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'git diff viewer',
      'patch viewer',
      'unified diff online',
      'read git patch',
      'diff highlighter',
    ],
    related: ['diff-tool', 'strip-whitespace', 'markdown-previewer'],
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    category: 'analyze',
    title: 'Regex Tester — Test Regular Expressions Live | Toolbit',
    description:
      'Test regular expressions with live match highlighting, capture groups, and replace preview. Runs locally in your browser with no uploads.',
    h1: 'Regex Tester and Debugger',
    lede: 'Write a pattern and watch it match as you type. Toolbit highlights every match, breaks out capture groups, and previews the result of a replacement before you commit it to code.',
    bullets: [
      'Live match highlighting over your sample text.',
      'Named and numbered capture groups listed per match.',
      'Replace preview with $1 and named group references.',
      'All JavaScript flags: global, ignore case, multiline, dot-all, unicode, sticky.',
    ],
    howTo: [
      'Enter your regular expression and pick the flags.',
      'Paste sample text into the test panel.',
      'Inspect the highlighted matches and capture groups, then copy the pattern.',
    ],
    faq: [
      {
        q: 'Which regex flavour does it use?',
        a: 'JavaScript (ECMAScript) regular expressions, which cover most of what PCRE users expect apart from lookbehind quirks and recursion.',
      },
      {
        q: 'Can I preview a replacement?',
        a: 'Yes. The replace field supports $1, $<name>, and $& references and shows the result live.',
      },
      { q: 'Is my sample text uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'regex tester',
      'regular expression tester',
      'regex online',
      'test regex',
      'regex debugger',
    ],
    related: ['case-converter', 'diff-tool', 'word-counter'],
  },
  {
    slug: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    category: 'generate',
    title: 'Lorem Ipsum Generator — Placeholder Text | Toolbit',
    description:
      'Generate lorem ipsum paragraphs, sentences, words, or list items for mockups and layout tests. Runs locally in your browser.',
    h1: 'Lorem Ipsum Placeholder Generator',
    lede: 'Fill a design with realistic-looking body copy. Choose how many paragraphs, sentences, or words you need and copy the result straight into your mockup.',
    bullets: [
      'Generate by paragraph, sentence, word, or list item count.',
      'Optional classic "Lorem ipsum dolor sit amet" opening.',
      'Plain text or HTML output with paragraph tags.',
      'Deterministic length control for testing text overflow.',
    ],
    howTo: [
      'Choose the unit — paragraphs, sentences, or words.',
      'Set the amount you need.',
      'Copy the generated text into your design or template.',
    ],
    faq: [
      {
        q: 'Can I get HTML-wrapped output?',
        a: 'Yes. Switch to HTML output and each paragraph comes wrapped in a p tag, ready to paste into a template.',
      },
      {
        q: 'Is the text always the same?',
        a: 'The classic opening is optional; the rest of the copy is shuffled so consecutive blocks do not look identical.',
      },
      { q: 'Does it need an internet connection?', a: offlineAnswer },
    ],
    keywords: [
      'lorem ipsum generator',
      'placeholder text',
      'dummy text generator',
      'filler text',
      'lorem ipsum online',
    ],
    related: ['fake-data-generator', 'word-counter', 'markdown-previewer'],
  },
  {
    slug: 'css-formatter',
    name: 'CSS Formatter',
    category: 'format',
    title: 'CSS Formatter & Minifier — Beautify CSS | Toolbit',
    description:
      'Beautify or minify CSS with consistent indentation and sorted declarations. Runs locally in your browser, no uploads.',
    h1: 'CSS Formatter and Minifier',
    lede: 'Make a compiled or hand-edited stylesheet readable again, or squeeze it down for production. Both directions run locally on your machine.',
    bullets: [
      'Beautify minified stylesheets back into readable rules.',
      'Minify with whitespace, comment, and duplicate-rule removal.',
      'Consistent indentation and brace placement.',
      'Handles media queries, nesting, and custom properties.',
    ],
    howTo: [
      'Paste the CSS you want to reformat.',
      'Choose beautify or minify.',
      'Copy the result back into your stylesheet.',
    ],
    faq: [
      {
        q: 'Does minifying change how my CSS behaves?',
        a: 'No. Minification only removes whitespace, comments, and redundant syntax — the cascade and specificity are untouched.',
      },
      {
        q: 'Does it support CSS custom properties?',
        a: 'Yes, along with media queries, supports queries, and nested rules.',
      },
      { q: 'Is my stylesheet uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'css formatter',
      'css beautifier',
      'css minifier',
      'format css online',
      'minify css',
    ],
    related: ['js-json-minifier', 'html-escape', 'json-formatter'],
  },
  {
    slug: 'js-json-minifier',
    name: 'JavaScript & JSON Minifier',
    category: 'transform',
    title: 'JavaScript & JSON Minifier — Compress Code | Toolbit',
    description:
      'Minify JavaScript and JSON to the smallest safe output, with a size comparison. Runs locally in your browser with no uploads.',
    h1: 'JavaScript and JSON Minifier',
    lede: 'Shrink a snippet before pasting it into a bookmarklet, an inline script tag, or a size-constrained config field — and see exactly how many bytes you saved.',
    bullets: [
      'Minifies JavaScript by removing whitespace, comments, and dead syntax.',
      'Compacts JSON to a single line for fixtures and env values.',
      'Before-and-after byte count with the percentage saved.',
      'Safe defaults that never rename your public API.',
    ],
    howTo: [
      'Paste the JavaScript or JSON you want to compress.',
      'Run the minifier and check the size comparison.',
      'Copy the compact output.',
    ],
    faq: [
      {
        q: 'Does it mangle variable names?',
        a: 'No. The default settings keep identifiers intact so the output stays debuggable and safe to paste into an existing page.',
      },
      {
        q: 'Can it minify JSON too?',
        a: 'Yes. JSON is compacted to a single line, which is handy for environment variables and one-line fixtures.',
      },
      { q: 'Is my source uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'javascript minifier',
      'json minifier',
      'minify js online',
      'compress javascript',
      'js compressor',
    ],
    related: ['css-formatter', 'json-formatter', 'base64-encoder'],
  },
  {
    slug: 'markdown-previewer',
    name: 'Markdown Previewer',
    category: 'text',
    title: 'Markdown Previewer & Editor — Live Preview | Toolbit',
    description:
      'Write Markdown and see the rendered result live, with GitHub-flavoured tables, code blocks, and task lists. Runs locally in your browser.',
    h1: 'Markdown Previewer with Live Rendering',
    lede: 'Draft a README, a changelog, or a design doc and watch it render as you type. Output is sanitised before display, so pasted content cannot run scripts in your tab.',
    bullets: [
      'GitHub-flavoured Markdown: tables, fenced code, task lists, strikethrough.',
      'Live side-by-side preview that scrolls with your cursor.',
      'Sanitised HTML rendering — pasted markup cannot execute.',
      'Copy the rendered HTML when you need it for a CMS.',
    ],
    howTo: [
      'Type or paste Markdown into the editor pane.',
      'Watch the rendered preview update alongside it.',
      'Copy either the Markdown or the generated HTML.',
    ],
    faq: [
      {
        q: 'Which Markdown flavour is used?',
        a: 'GitHub-flavoured Markdown, so tables, fenced code blocks, task lists, and autolinks all behave the way they do in a repository README.',
      },
      {
        q: 'Is raw HTML in my Markdown safe?',
        a: 'Rendered output is passed through DOMPurify before it is displayed, so scripts and event handlers in pasted content are stripped.',
      },
      { q: 'Is my document uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'markdown previewer',
      'markdown editor online',
      'markdown to html',
      'live markdown preview',
      'readme editor',
    ],
    related: ['html-escape', 'word-counter', 'git-diff-viewer'],
  },
  {
    slug: 'yaml-formatter',
    name: 'YAML Formatter',
    category: 'format',
    title: 'YAML Formatter & YAML to JSON Converter | Toolbit',
    description:
      'Format and validate YAML, and convert between YAML and JSON in both directions. Runs locally in your browser with no uploads.',
    h1: 'YAML Formatter and JSON Converter',
    lede: 'Normalise the indentation of a Kubernetes manifest or a CI pipeline, catch a syntax error before the deploy does, and convert between YAML and JSON without leaving the tab.',
    bullets: [
      'Reformat with consistent indentation and key ordering.',
      'Convert YAML to JSON and JSON to YAML in one click.',
      'Parse errors reported with line numbers.',
      'Multi-document YAML support for Kubernetes manifests.',
    ],
    howTo: [
      'Paste your YAML — a manifest, a workflow, or a config file.',
      'Format it, or convert it to JSON.',
      'Copy the cleaned-up output back into your repository.',
    ],
    faq: [
      {
        q: 'Does it handle multi-document YAML?',
        a: 'Yes. Documents separated by --- are parsed individually, which is what Kubernetes manifests usually need.',
      },
      { q: 'Can I convert JSON back to YAML?', a: 'Yes, the conversion works in both directions.' },
      { q: 'Are my manifests uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'yaml formatter',
      'yaml to json',
      'json to yaml',
      'yaml validator',
      'format yaml online',
    ],
    related: ['json-formatter', 'json-validator', 'nginx-config-validator'],
  },
  {
    slug: 'api-request-builder',
    name: 'API Request Builder',
    category: 'build',
    title: 'API Request Builder — Lightweight Postman Alternative | Toolbit',
    description:
      'Send HTTP requests and inspect status, headers, timing, and body. A fast, local Postman alternative that runs in your browser.',
    h1: 'API Request Builder and HTTP Client',
    lede: 'Fire a GET, POST, PUT, PATCH, or DELETE, set headers and a body, and read the response with formatting and timing. No account, no workspace sync, optional minimized analytics.',
    bullets: [
      'All common HTTP verbs with custom headers and request bodies.',
      'Response viewer with status, headers, timing, and pretty-printed JSON.',
      'Request history so you can replay the call you made a minute ago.',
      'Nothing syncs to a cloud workspace — requests stay on your machine.',
    ],
    howTo: [
      'Enter the URL and pick the HTTP method.',
      'Add headers and a request body if the endpoint needs them.',
      'Send, then read the formatted response and timing breakdown.',
    ],
    faq: [
      {
        q: 'Why do some requests fail with a CORS error?',
        a: 'The request runs from your browser, so it obeys the same-origin policy. Endpoints that do not send permissive CORS headers need a proxy or a desktop HTTP client.',
      },
      {
        q: 'Is this a Postman replacement?',
        a: 'For everyday endpoint checks, yes — and without an account or cloud sync. For team collaboration, mock servers, and shared collections, Postman still does more.',
      },
      {
        q: 'Are my tokens sent anywhere but the target API?',
        a: 'No. Headers and bodies go only to the endpoint you type. Toolbit has no backend of its own.',
      },
    ],
    keywords: [
      'api request builder',
      'postman alternative',
      'http client online',
      'rest client',
      'test api endpoint',
    ],
    related: ['websocket-tester', 'jwt-decoder', 'json-formatter'],
  },
  {
    slug: 'xml-formatter',
    name: 'XML Formatter',
    category: 'format',
    title: 'XML Formatter, Validator & XPath Tester | Toolbit',
    description:
      'Format, minify, and validate XML, convert it to JSON, and run XPath queries. Runs locally in your browser with no uploads.',
    h1: 'XML Formatter, Validator and XPath Tester',
    lede: 'Make a SOAP envelope or an RSS feed readable, check that it is well-formed, pull values out with XPath, or convert the whole thing into JSON.',
    bullets: [
      'Pretty-print and minify with configurable indentation.',
      'Well-formedness checking with line-accurate error messages.',
      'XPath query panel for extracting nodes and attributes.',
      'XML to JSON conversion for feeding legacy data into modern code.',
    ],
    howTo: [
      'Paste your XML document.',
      'Format it, or switch to the XPath panel to query it.',
      'Copy the formatted XML or the converted JSON.',
    ],
    faq: [
      {
        q: 'Can it validate against an XSD?',
        a: 'It checks well-formedness and structure. Full XSD schema validation needs a dedicated validator; for JSON Schema equivalents, use the JSON validator.',
      },
      {
        q: 'Does XPath support namespaces?',
        a: 'Yes. Namespace-prefixed queries resolve against the declarations in the document.',
      },
      { q: 'Is my document uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'xml formatter',
      'xml validator',
      'xpath tester',
      'xml to json',
      'format xml online',
    ],
    related: ['json-formatter', 'yaml-formatter', 'html-escape'],
  },
  {
    slug: 'sql-formatter',
    name: 'SQL Formatter',
    category: 'format',
    title: 'SQL Formatter & Beautifier — Format SQL Queries | Toolbit',
    description:
      'Format and beautify SQL queries with proper indentation and keyword casing. Supports MySQL, PostgreSQL, and standard SQL. Runs locally.',
    h1: 'SQL Formatter and Query Beautifier',
    lede: 'Take a query that arrived as one long line and turn it into something you can review. Toolbit indents clauses, aligns joins, and normalises keyword casing locally.',
    bullets: [
      'Clause-aware indentation for SELECT, JOIN, WHERE, and CTEs.',
      'Uppercase or lowercase keyword normalisation.',
      'Minify back to a single line for embedding in code.',
      'Works with MySQL, PostgreSQL, SQLite, and standard SQL dialects.',
    ],
    howTo: [
      'Paste the query, however mangled it arrived.',
      'Choose your indentation and keyword casing.',
      'Copy the formatted query into your editor or ticket.',
    ],
    faq: [
      {
        q: 'Which SQL dialects are supported?',
        a: 'The formatter handles standard SQL along with MySQL, PostgreSQL, and SQLite syntax, including common table expressions and window functions.',
      },
      { q: 'Is it safe to paste a production query?', a: privacyAnswer },
      {
        q: 'Can it minify a query back to one line?',
        a: 'Yes — useful when embedding SQL in a string literal or a config value.',
      },
    ],
    keywords: [
      'sql formatter',
      'sql beautifier',
      'format sql online',
      'sql pretty print',
      'mysql formatter',
    ],
    related: ['json-formatter', 'graphql-formatter', 'fake-data-generator'],
  },
  {
    slug: 'graphql-formatter',
    name: 'GraphQL Formatter',
    category: 'format',
    title: 'GraphQL Formatter & Validator — Format Queries | Toolbit',
    description:
      'Format, validate, and minify GraphQL queries, mutations, and SDL schemas. Runs locally in your browser with no uploads.',
    h1: 'GraphQL Formatter and Validator',
    lede: 'Normalise a query copied out of a network tab, or tidy a schema definition file. Syntax errors are reported against the official GraphQL parser.',
    bullets: [
      'Formats queries, mutations, subscriptions, and SDL schemas.',
      'Syntax validation using the reference GraphQL parser.',
      'Minify a document for embedding in a client request.',
      'Consistent field indentation and argument layout.',
    ],
    howTo: [
      'Paste a GraphQL operation or schema definition.',
      'Format or minify it.',
      'Copy the result into your client or schema file.',
    ],
    faq: [
      {
        q: 'Can it validate against my schema?',
        a: 'It validates syntax with the official parser. Validating an operation against a specific schema requires that schema to be loaded into a GraphQL client.',
      },
      {
        q: 'Does it handle SDL schema files?',
        a: 'Yes. Type definitions, interfaces, unions, and directives all format correctly.',
      },
      { q: 'Is my query uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'graphql formatter',
      'graphql validator',
      'format graphql query',
      'gql beautifier',
      'graphql schema formatter',
    ],
    related: ['json-formatter', 'api-request-builder', 'sql-formatter'],
  },
  {
    slug: 'websocket-tester',
    name: 'WebSocket Tester',
    category: 'build',
    title: 'WebSocket Tester — Connect, Send & Inspect Frames | Toolbit',
    description:
      'Open a WebSocket connection, send messages, and watch frames arrive in real time with timestamps. Runs in your browser.',
    h1: 'WebSocket Tester and Client',
    lede: 'Connect to a ws:// or wss:// endpoint, send test frames, and see everything that comes back with timestamps — without wiring up a scratch client first.',
    bullets: [
      'Connects to both ws:// and wss:// endpoints.',
      'Timestamped log of every frame sent and received.',
      'Send plain text or JSON payloads with formatting.',
      'Connection state, close codes, and error reasons surfaced clearly.',
    ],
    howTo: [
      'Enter the WebSocket URL and connect.',
      'Send a message and watch the frame log.',
      'Read close codes and errors when the connection drops.',
    ],
    faq: [
      {
        q: 'Can I connect to a ws:// endpoint from an https page?',
        a: 'Browsers block insecure WebSocket connections from secure pages. Use wss://, or run a local build for plain ws:// testing.',
      },
      {
        q: 'Are my messages logged anywhere?',
        a: 'No. The frame log lives in your tab and disappears when you close it.',
      },
      {
        q: 'Does it support custom headers?',
        a: 'The browser WebSocket API does not allow custom headers on the handshake; pass authentication via the URL or the first message instead.',
      },
    ],
    keywords: [
      'websocket tester',
      'websocket client online',
      'test websocket',
      'ws debug tool',
      'websocket console',
    ],
    related: ['api-request-builder', 'json-formatter', 'jwt-decoder'],
  },
  {
    slug: 'nginx-config-validator',
    name: 'Nginx Config Validator',
    category: 'format',
    title: 'Nginx Config Validator & Formatter | Toolbit',
    description:
      'Validate, format, and analyse nginx configuration files. Catch unbalanced braces and missing semicolons before you reload. Runs locally.',
    h1: 'Nginx Configuration Validator and Formatter',
    lede: 'Check an nginx config for the structural mistakes that make a reload fail — unbalanced braces, missing semicolons, malformed directives — before you touch the server.',
    bullets: [
      'Brace balance and missing-semicolon detection with line numbers.',
      'Consistent reindentation of nested blocks.',
      'Directive summary for server, location, and upstream blocks.',
      'Flags common misconfigurations in proxy_pass and try_files.',
    ],
    howTo: [
      'Paste your nginx.conf or site config.',
      'Review the reported issues and directive summary.',
      'Copy the formatted config back to the server.',
    ],
    faq: [
      {
        q: 'Does this replace nginx -t?',
        a: 'No. It catches structural and syntax problems early, but only nginx -t on the real server knows about your modules, paths, and certificates.',
      },
      { q: 'Can I paste a config containing secrets?', a: privacyAnswer },
      {
        q: 'Does it understand included files?',
        a: 'It analyses the file you paste. Includes are listed but their contents are not fetched.',
      },
    ],
    keywords: [
      'nginx config validator',
      'nginx formatter',
      'nginx conf checker',
      'validate nginx config',
      'nginx syntax check',
    ],
    related: ['yaml-formatter', 'docker-command-builder', 'certificate-decoder'],
  },
  {
    slug: 'hash-generator',
    name: 'Hash Generator',
    category: 'generate',
    title: 'Hash Generator — MD5, SHA-1, SHA-256, SHA-512 | Toolbit',
    description:
      'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files. Computed in your browser — nothing is uploaded.',
    h1: 'Hash Generator for MD5 and SHA',
    lede: 'Produce a checksum for a string or a file and compare it against the one you were given. Hashing happens with the Web Crypto API in your tab, so the file never leaves your disk.',
    bullets: [
      'MD5, SHA-1, SHA-256, and SHA-512 in one pass.',
      'Hash text input or drop a file to checksum it.',
      'Compare against an expected value with a match indicator.',
      'Uppercase and lowercase hex output.',
    ],
    howTo: [
      'Paste text or drop a file onto the input panel.',
      'Read the digest for each algorithm.',
      'Paste the expected checksum to confirm a match.',
    ],
    faq: [
      {
        q: 'Is MD5 still safe to use?',
        a: 'Not for security. MD5 and SHA-1 are broken for collision resistance and should only be used for non-adversarial integrity checks. Use SHA-256 or better for anything that matters.',
      },
      {
        q: 'Are my files uploaded to hash them?',
        a: "No. Files are read locally and hashed with the browser's Web Crypto API. Nothing is transmitted.",
      },
      {
        q: 'Can I hash a large file?',
        a: 'Yes. Files are streamed in chunks, so multi-hundred-megabyte files hash without exhausting memory.',
      },
    ],
    keywords: [
      'hash generator',
      'md5 generator',
      'sha256 generator',
      'checksum calculator',
      'sha512 hash online',
    ],
    related: ['password-generator', 'base64-encoder', 'certificate-decoder'],
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    category: 'encode',
    title: 'JWT Decoder — Decode & Inspect JSON Web Tokens | Toolbit',
    description:
      'Decode a JWT and inspect its header, payload, and expiry. Tokens are decoded in your browser and never uploaded to a server.',
    h1: 'JWT Decoder and Token Inspector',
    lede: 'Paste a JSON Web Token and read its header and claims immediately, with issued-at and expiry timestamps rendered as human dates. Because decoding is local, you can safely inspect a real access token.',
    bullets: [
      'Header and payload decoded and pretty-printed side by side.',
      'iat, nbf, and exp shown as readable dates with an expiry warning.',
      'Algorithm and key id surfaced from the header.',
      'Signature segment displayed without ever being transmitted.',
    ],
    howTo: [
      'Paste the JWT — all three dot-separated segments.',
      'Read the decoded header and claims.',
      'Check the expiry banner to see whether the token is still valid.',
    ],
    faq: [
      {
        q: 'Is it safe to paste a real access token?',
        a: 'Yes, safer than most alternatives: decoding happens entirely in your browser and the token is never sent anywhere. It is still good practice to use a short-lived or test token where you can.',
      },
      {
        q: 'Can it verify the signature?',
        a: "The decoder reads the token; verifying the signature requires the issuer's secret or public key, which should stay in your backend.",
      },
      {
        q: 'Why is my payload not readable?',
        a: 'Encrypted tokens (JWE) have five segments rather than three and cannot be read without the decryption key. Signed tokens (JWS) decode fine.',
      },
    ],
    keywords: [
      'jwt decoder',
      'decode jwt',
      'json web token decoder',
      'jwt debugger',
      'inspect jwt token',
    ],
    related: ['base64-encoder', 'certificate-decoder', 'api-request-builder'],
  },
  {
    slug: 'password-generator',
    name: 'Password Generator',
    category: 'generate',
    title: 'Secure Password Generator — Offline & Private | Toolbit',
    description:
      'Generate strong random passwords with configurable length and character sets, plus a strength meter. Generated locally, never transmitted.',
    h1: 'Secure Password Generator',
    lede: "Create a password using the browser's cryptographic random number generator. Nothing is sent over the network, and nothing is stored — close the tab and it is gone.",
    bullets: [
      'Cryptographically secure randomness via crypto.getRandomValues.',
      'Configurable length and character sets, with ambiguous characters excluded.',
      'Entropy-based strength meter, not a naive rule checker.',
      'Passphrase mode for something you can actually type.',
    ],
    howTo: [
      'Set the length and choose which character classes to include.',
      'Generate, and check the entropy estimate.',
      'Copy it straight into your password manager.',
    ],
    faq: [
      {
        q: 'Is a browser-generated password safe?',
        a: 'Yes when it uses crypto.getRandomValues, which Toolbit does. That is the same CSPRNG your browser uses for TLS, not Math.random.',
      },
      {
        q: 'Is the password ever transmitted or stored?',
        a: 'No. It is generated in your tab, never sent anywhere, and never written to storage.',
      },
      {
        q: 'How long should a password be?',
        a: 'For a random password with mixed character classes, 16 characters or more is a sensible floor; for a passphrase, four or more random words.',
      },
    ],
    keywords: [
      'password generator',
      'strong password generator',
      'random password',
      'secure password tool',
      'passphrase generator',
    ],
    related: ['hash-generator', 'totp-generator', 'uuid-generator'],
  },
  {
    slug: 'totp-generator',
    name: 'TOTP Generator',
    category: 'generate',
    title: 'TOTP / 2FA Code Generator — Offline Authenticator | Toolbit',
    description:
      'Generate time-based one-time passwords from a TOTP secret, entirely offline. Compatible with Google Authenticator and Authy secrets.',
    h1: 'TOTP and 2FA Code Generator',
    lede: 'Turn a shared secret into the six-digit code your login is asking for, without installing an authenticator app. Useful for testing a 2FA integration you are building.',
    bullets: [
      'RFC 6238 TOTP with configurable period and digit count.',
      'SHA-1, SHA-256, and SHA-512 algorithm support.',
      'Live countdown showing when the current code rotates.',
      'Accepts Base32 secrets and otpauth:// URIs.',
    ],
    howTo: [
      'Paste your Base32 secret or otpauth:// URI.',
      'Adjust the period and digits if the service is non-standard.',
      'Copy the current code before the countdown runs out.',
    ],
    faq: [
      {
        q: 'Is this a safe replacement for an authenticator app?',
        a: 'For testing an integration, yes. For your own production accounts, a dedicated authenticator app or hardware key keeps the secret in secure storage rather than in a browser tab.',
      },
      {
        q: 'Is my secret uploaded?',
        a: 'No. Codes are computed locally, and the secret is never transmitted or persisted.',
      },
      {
        q: 'Why does my code not match the server?',
        a: "Almost always clock skew. TOTP depends on system time — check that your machine's clock is synchronised.",
      },
    ],
    keywords: [
      'totp generator',
      '2fa code generator',
      'authenticator online',
      'otp generator',
      'time based one time password',
    ],
    related: ['password-generator', 'hash-generator', 'qr-code-generator'],
  },
  {
    slug: 'certificate-decoder',
    name: 'Certificate Decoder',
    category: 'encode',
    title: 'SSL Certificate Decoder — Inspect X.509 PEM | Toolbit',
    description:
      'Decode PEM-encoded X.509 certificates and read subject, issuer, validity dates, SANs, and fingerprints. Runs locally in your browser.',
    h1: 'SSL/TLS Certificate Decoder',
    lede: 'Paste a PEM certificate and read what is actually inside it: who issued it, what names it covers, when it expires, and its fingerprint — without shelling out to openssl.',
    bullets: [
      'Subject, issuer, serial number, and signature algorithm.',
      'Not-before and not-after dates with an expiry countdown.',
      'Subject Alternative Names listed in full.',
      'SHA-1 and SHA-256 fingerprints for pinning checks.',
    ],
    howTo: [
      'Copy the certificate block including the BEGIN and END lines.',
      'Paste it into the decoder.',
      'Read the parsed fields and check the expiry date.',
    ],
    faq: [
      {
        q: 'Does it validate the certificate chain?',
        a: "It decodes and displays the certificate you paste. Chain validation against a trust store needs openssl or your browser's own verification.",
      },
      {
        q: 'Can I paste a private key?',
        a: 'Do not. This tool only needs the public certificate. Private keys should never be pasted into any web tool, including this one.',
      },
      { q: 'Is the certificate uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'certificate decoder',
      'ssl certificate decoder',
      'x509 decoder',
      'pem decoder',
      'inspect ssl certificate',
    ],
    related: ['jwt-decoder', 'hash-generator', 'nginx-config-validator'],
  },
  {
    slug: 'timestamp-converter',
    name: 'Timestamp Converter',
    category: 'transform',
    title: 'Unix Timestamp Converter — Epoch to Date | Toolbit',
    description:
      'Convert Unix timestamps to human-readable dates and back, in seconds or milliseconds, across time zones. Runs locally in your browser.',
    h1: 'Unix Timestamp and Epoch Converter',
    lede: 'Turn 1707307200 into a date you can reason about — or go the other way. Seconds and milliseconds are detected automatically, and both UTC and local time are shown.',
    bullets: [
      'Automatic detection of second and millisecond precision.',
      'UTC, local time, and ISO 8601 output side by side.',
      'Convert a date back into an epoch value.',
      'Live "now" timestamp for quick copying.',
    ],
    howTo: [
      'Paste a timestamp, or pick a date.',
      'Read the converted value in UTC, local time, and ISO 8601.',
      'Copy whichever representation your code needs.',
    ],
    faq: [
      {
        q: 'Seconds or milliseconds?',
        a: 'Detected automatically from the magnitude — a 13-digit value is treated as milliseconds, a 10-digit value as seconds. You can override it.',
      },
      {
        q: 'Which time zone is used?',
        a: "Both UTC and your machine's local time zone are shown, so you can compare them without doing the arithmetic yourself.",
      },
      { q: 'Does it need a network connection?', a: offlineAnswer },
    ],
    keywords: [
      'timestamp converter',
      'unix timestamp',
      'epoch converter',
      'epoch to date',
      'convert timestamp online',
    ],
    related: ['date-calculator', 'cron-parser', 'json-formatter'],
  },
  {
    slug: 'color-converter',
    name: 'Color Converter',
    category: 'transform',
    title: 'Color Converter — HEX, RGB, HSL & HSV | Toolbit',
    description:
      'Convert colours between HEX, RGB, HSL, and HSV with a live preview and contrast check. Runs locally in your browser.',
    h1: 'Color Converter for HEX, RGB and HSL',
    lede: 'Move a colour between the notations your design tool, your CSS, and your code each prefer, with a live swatch and a WCAG contrast reading alongside.',
    bullets: [
      'HEX, RGB, RGBA, HSL, HSLA, and HSV conversion.',
      'Live swatch preview as you edit any representation.',
      'Alpha channel support across all formats.',
      'WCAG contrast ratio against white and black.',
    ],
    howTo: [
      'Enter a colour in any supported notation.',
      'Read the equivalent value in every other format.',
      'Copy the one your stylesheet needs.',
    ],
    faq: [
      {
        q: 'Does it support alpha transparency?',
        a: 'Yes. RGBA, HSLA, and 8-digit HEX all round-trip with the alpha channel preserved.',
      },
      {
        q: 'What does the contrast ratio tell me?',
        a: 'It is the WCAG 2.1 contrast figure against white and black. Body text generally needs 4.5:1, large text 3:1.',
      },
      { q: 'Is it available offline?', a: offlineAnswer },
    ],
    keywords: ['color converter', 'hex to rgb', 'rgb to hsl', 'hex to hsl', 'color picker online'],
    related: ['unit-converter', 'css-formatter', 'image-converter'],
  },
  {
    slug: 'unit-converter',
    name: 'Unit Converter',
    category: 'transform',
    title: 'Unit Converter — Length, Mass, Data & Temperature | Toolbit',
    description:
      'Convert between units of length, mass, volume, temperature, digital storage, and more. Runs locally in your browser.',
    h1: 'Unit Converter for Developers',
    lede: 'Convert bytes to gibibytes, milliseconds to hours, or millimetres to points without opening a search engine and trusting whatever the first result says.',
    bullets: [
      'Digital storage with correct binary and decimal prefixes.',
      'Time, length, mass, volume, area, and temperature.',
      'Precise conversion without floating-point surprises.',
      'Instant results as you type.',
    ],
    howTo: [
      'Pick the category you are converting within.',
      'Enter the source value and choose both units.',
      'Copy the converted result.',
    ],
    faq: [
      {
        q: 'Does it distinguish GB from GiB?',
        a: 'Yes. Decimal (GB, 1000-based) and binary (GiB, 1024-based) prefixes are separate units, which is exactly where most conversion mistakes come from.',
      },
      {
        q: 'How many categories are supported?',
        a: 'Length, mass, volume, area, temperature, time, speed, pressure, energy, and digital storage.',
      },
      { q: 'Does it work offline?', a: offlineAnswer },
    ],
    keywords: [
      'unit converter',
      'byte converter',
      'gb to gib',
      'measurement converter',
      'convert units online',
    ],
    related: ['color-converter', 'timestamp-converter', 'date-calculator'],
  },
  {
    slug: 'image-converter',
    name: 'Image Converter',
    category: 'transform',
    title: 'Image Converter — PNG, JPEG & WebP, Offline | Toolbit',
    description:
      'Convert, resize, and compress images between PNG, JPEG, and WebP entirely in your browser. Images are never uploaded.',
    h1: 'Image Converter and Compressor',
    lede: 'Convert a screenshot to WebP, resize an asset, or squeeze a JPEG down before committing it. Everything runs on a canvas in your tab, so the image never leaves your machine.',
    bullets: [
      'Convert between PNG, JPEG, and WebP.',
      'Resize by pixel dimensions or by percentage with aspect ratio locked.',
      'Adjustable quality with a live before-and-after file size.',
      'Batch several images in one pass.',
    ],
    howTo: [
      'Drop one or more images onto the panel.',
      'Choose the output format, dimensions, and quality.',
      'Download the converted files.',
    ],
    faq: [
      {
        q: 'Are my images uploaded to a server?',
        a: "No. Conversion uses the browser's canvas and codec support. The image bytes never leave your device — which is the whole point compared to a typical online converter.",
      },
      {
        q: 'Does converting strip EXIF data?',
        a: 'Yes. Re-encoding through canvas drops EXIF metadata, including GPS coordinates — usually a privacy win.',
      },
      {
        q: 'Is there a file size limit?',
        a: "Only your browser's memory. There is no upload cap because there is no upload.",
      },
    ],
    keywords: [
      'image converter',
      'png to webp',
      'jpeg to png',
      'compress image online',
      'resize image offline',
    ],
    related: ['pdf-tools', 'color-converter', 'qr-code-generator'],
  },
  {
    slug: 'pdf-tools',
    name: 'PDF Tools',
    category: 'text',
    title: 'PDF Tools — Merge, Split & Rotate Offline | Toolbit',
    description:
      'Merge, split, rotate, and reorder PDF pages entirely in your browser. Documents are never uploaded to a server.',
    h1: 'PDF Merge, Split and Rotate Tools',
    lede: 'Combine invoices, pull a single page out of a contract, or fix a scan that came in sideways. Every operation runs locally, which matters when the document is confidential.',
    bullets: [
      'Merge multiple PDFs in the order you choose.',
      'Split by page range or extract individual pages.',
      'Rotate pages in 90-degree steps.',
      'Reorder and delete pages before exporting.',
    ],
    howTo: [
      'Drop your PDF files onto the panel.',
      'Choose merge, split, or rotate and set the pages involved.',
      'Download the resulting document.',
    ],
    faq: [
      {
        q: 'Are my documents uploaded?',
        a: 'No. PDFs are processed with pdf-lib inside your browser. Nothing is transmitted, which is the difference between this and most free online PDF sites.',
      },
      {
        q: 'Can it handle password-protected PDFs?',
        a: 'Encrypted PDFs need to be unlocked first — the tool works with unprotected documents.',
      },
      {
        q: 'Does merging degrade quality?',
        a: 'No. Pages are copied at full fidelity rather than re-rendered.',
      },
    ],
    keywords: [
      'merge pdf offline',
      'split pdf',
      'rotate pdf',
      'pdf tools private',
      'combine pdf in browser',
    ],
    related: ['image-converter', 'markdown-previewer', 'word-counter'],
  },
  {
    slug: 'date-calculator',
    name: 'Date Calculator',
    category: 'text',
    title: 'Date Calculator — Add, Subtract & Diff Dates | Toolbit',
    description:
      'Calculate the difference between two dates, or add and subtract days, weeks, and months. Runs locally in your browser.',
    h1: 'Date Difference and Duration Calculator',
    lede: 'Work out how many days are left on a certificate, what date a 90-day retention window ends on, or how far apart two log entries are.',
    bullets: [
      'Difference between two dates in days, weeks, months, and years.',
      'Add or subtract any duration from a starting date.',
      'Business-day counting that skips weekends.',
      'Handles leap years and month-end rollovers correctly.',
    ],
    howTo: [
      'Pick your start date.',
      'Enter a second date, or a duration to add or subtract.',
      'Read the result in the units you need.',
    ],
    faq: [
      {
        q: 'Can it count business days only?',
        a: 'Yes. Weekend-excluding mode gives the working-day count between two dates.',
      },
      {
        q: 'How are month boundaries handled?',
        a: 'Adding a month to 31 January lands on the last day of February rather than overflowing into March.',
      },
      { q: 'Does it work offline?', a: offlineAnswer },
    ],
    keywords: [
      'date calculator',
      'date difference calculator',
      'add days to date',
      'business days calculator',
      'duration between dates',
    ],
    related: ['timestamp-converter', 'cron-parser', 'unit-converter'],
  },
  {
    slug: 'cron-parser',
    name: 'Cron Expression Parser',
    category: 'analyze',
    title: 'Cron Expression Parser — Explain Cron Schedules | Toolbit',
    description:
      'Translate a cron expression into plain English and preview the next run times. Runs locally in your browser with no uploads.',
    h1: 'Cron Expression Parser and Explainer',
    lede: 'Paste */15 9-17 * * 1-5 and find out what it actually means, plus the next handful of times it will fire. Far quicker than deploying and waiting to see.',
    bullets: [
      'Plain-English description of any standard cron expression.',
      'Preview of the next several execution times.',
      'Support for ranges, steps, lists, and named days and months.',
      'Clear errors for expressions with the wrong field count.',
    ],
    howTo: [
      'Paste your cron expression.',
      'Read the plain-English description.',
      'Check the upcoming run times to confirm it does what you expect.',
    ],
    faq: [
      {
        q: 'Which cron dialect does it use?',
        a: 'Standard five-field Unix cron, plus the optional seconds field used by Quartz-style schedulers.',
      },
      {
        q: 'Which time zone are the run times in?',
        a: 'Your local time zone, which is usually what you want when sanity-checking a schedule.',
      },
      {
        q: 'Can it build an expression for me?',
        a: 'Yes — the crontab generator does the reverse, letting you pick a schedule visually and get the expression out.',
      },
    ],
    keywords: [
      'cron parser',
      'cron expression explained',
      'crontab decoder',
      'cron schedule preview',
      'understand cron',
    ],
    related: ['crontab-generator', 'timestamp-converter', 'date-calculator'],
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    category: 'generate',
    title: 'UUID Generator — Bulk v4 UUIDs, Offline | Toolbit',
    description:
      'Generate cryptographically random v4 UUIDs one at a time or in bulk, with formatting options. Runs locally in your browser.',
    h1: 'UUID Generator (Version 4)',
    lede: "Generate one identifier or ten thousand, using the browser's cryptographic random source. Handy for seeding fixtures, filling test databases, and naming resources.",
    bullets: [
      'Cryptographically random v4 UUIDs via crypto.getRandomValues.',
      'Bulk generation with a configurable count.',
      'Uppercase, hyphen-free, and braced formatting options.',
      'One-click copy of the entire generated list.',
    ],
    howTo: [
      'Set how many UUIDs you need.',
      'Choose the output formatting.',
      'Copy the list into your fixture or migration.',
    ],
    faq: [
      {
        q: 'Are these UUIDs actually random?',
        a: "Yes. They come from crypto.getRandomValues, the browser's CSPRNG, not from Math.random.",
      },
      {
        q: 'Can two generated UUIDs collide?',
        a: 'With 122 random bits the probability is negligible — you would need to generate billions before a collision became plausible.',
      },
      {
        q: 'Does it support UUID v7?',
        a: 'The generator produces v4. For time-ordered identifiers, v7 is best generated in your database or application layer where the clock source is authoritative.',
      },
    ],
    keywords: [
      'uuid generator',
      'guid generator',
      'uuid v4 online',
      'bulk uuid generator',
      'random uuid',
    ],
    related: ['password-generator', 'hash-generator', 'fake-data-generator'],
  },
  {
    slug: 'http-status-codes',
    name: 'HTTP Status Code Reference',
    category: 'analyze',
    title: 'HTTP Status Code Reference — Searchable List | Toolbit',
    description:
      'A searchable reference for every HTTP status code, with meaning, typical causes, and when to use each one. Works offline.',
    h1: 'HTTP Status Code Reference',
    lede: 'Look up what a 409 means, when a 422 is more appropriate than a 400, or why your proxy returned a 502 — with the practical explanation, not just the RFC sentence.',
    bullets: [
      'Every status code from 1xx through 5xx, searchable by number or name.',
      'Practical guidance on when each code is the right choice.',
      'Common causes for the errors you actually hit in production.',
      'Available offline once the app is installed.',
    ],
    howTo: [
      'Type the status code or part of its name.',
      'Read the meaning and typical causes.',
      'Pick the right code for your own API response.',
    ],
    faq: [
      {
        q: 'When should I use 422 instead of 400?',
        a: 'Use 400 when the request is malformed and cannot be parsed; use 422 when it parses fine but fails validation rules.',
      },
      {
        q: 'What causes a 502 versus a 504?',
        a: 'A 502 means an upstream server returned an invalid response; a 504 means it did not respond in time. Both point at the layer behind your proxy.',
      },
      { q: 'Does the reference work offline?', a: offlineAnswer },
    ],
    keywords: [
      'http status codes',
      'status code reference',
      'http error codes',
      '422 vs 400',
      'http response codes list',
    ],
    related: ['api-request-builder', 'websocket-tester', 'json-formatter'],
  },
  {
    slug: 'fake-data-generator',
    name: 'Fake Data Generator',
    category: 'generate',
    title: 'Fake Data Generator — Test Data as JSON, CSV & SQL | Toolbit',
    description:
      'Generate realistic names, emails, addresses, and IDs as JSON, CSV, or SQL inserts. Runs locally in your browser.',
    h1: 'Fake Test Data Generator',
    lede: 'Seed a database or fill a table component without borrowing real customer records. Pick your fields, choose a row count, and export as JSON, CSV, or SQL inserts.',
    bullets: [
      'Names, emails, addresses, phone numbers, companies, dates, and IDs.',
      'Export as JSON, CSV, or ready-to-run SQL INSERT statements.',
      'Configurable row count and per-column field types.',
      'Realistic-looking values that are entirely synthetic.',
    ],
    howTo: [
      'Choose the fields your schema needs.',
      'Set the number of rows and the export format.',
      'Copy or download the generated data set.',
    ],
    faq: [
      {
        q: 'Is the data based on real people?',
        a: 'No. Values are assembled from generic name and place lists, so nothing corresponds to a real individual.',
      },
      {
        q: 'Can it produce SQL inserts?',
        a: 'Yes — pick the SQL output format, give it a table name, and paste the statements straight into your seed script.',
      },
      {
        q: 'Can I use it for GDPR-safe test fixtures?',
        a: 'That is the intended use. Generating synthetic data locally avoids copying production personal data into a test environment.',
      },
    ],
    keywords: [
      'fake data generator',
      'test data generator',
      'mock data json',
      'sample csv generator',
      'seed database test data',
    ],
    related: ['uuid-generator', 'csv-to-json', 'lorem-ipsum-generator'],
  },
  {
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    category: 'generate',
    title: 'QR Code Generator — URLs, WiFi & vCards, Offline | Toolbit',
    description:
      'Generate QR codes for URLs, plain text, WiFi credentials, and contact cards. Rendered in your browser and never uploaded.',
    h1: 'QR Code Generator',
    lede: "Create a scannable code for a link, a WiFi network, or a contact card, and download it as PNG or SVG. Generated locally, so WiFi passwords stay off other people's servers.",
    bullets: [
      'URL, plain text, WiFi credential, and vCard presets.',
      'PNG and SVG download at any resolution.',
      'Adjustable error correction level and quiet zone.',
      'Live preview that updates as you type.',
    ],
    howTo: [
      'Pick the content type and fill in the fields.',
      'Adjust size and error correction if needed.',
      'Download the QR code as PNG or SVG.',
    ],
    faq: [
      {
        q: 'Is my WiFi password sent anywhere?',
        a: 'No. The code is rendered in your browser from the values you type. Nothing is transmitted, which matters a great deal for credential QR codes.',
      },
      {
        q: 'Which error correction level should I pick?',
        a: 'Level M is a good default. Use Q or H if the code will be printed small, placed on a curved surface, or partly covered by a logo.',
      },
      { q: 'Can I get a vector file?', a: 'Yes. SVG export scales cleanly for print.' },
    ],
    keywords: [
      'qr code generator',
      'wifi qr code',
      'vcard qr code',
      'generate qr code offline',
      'qr code svg',
    ],
    related: ['totp-generator', 'image-converter', 'url-encoder'],
  },
  {
    slug: 'crontab-generator',
    name: 'Crontab Generator',
    category: 'build',
    title: 'Crontab Generator — Build Cron Expressions Visually | Toolbit',
    description:
      'Build a cron expression visually with a live plain-English preview and upcoming run times. Runs locally in your browser.',
    h1: 'Visual Crontab Expression Generator',
    lede: 'Choose the minutes, hours, and days you want and let Toolbit assemble the expression. The plain-English description and next run times update as you click.',
    bullets: [
      'Point-and-click builder for every cron field.',
      'Live expression output with a plain-English description.',
      'Preview of the next several execution times.',
      'Common presets for hourly, nightly, and weekday schedules.',
    ],
    howTo: [
      'Pick the schedule you want field by field.',
      'Check the description and the upcoming run times.',
      'Copy the expression into your crontab or scheduler config.',
    ],
    faq: [
      {
        q: 'Does it produce standard cron syntax?',
        a: 'Yes — standard five-field Unix cron, which works with crontab, Kubernetes CronJobs, and most CI schedulers.',
      },
      {
        q: 'Can I go the other way?',
        a: 'Yes. The cron expression parser takes an existing expression and explains it.',
      },
      {
        q: 'What time zone do the previews use?',
        a: 'Your local time zone. Remember that servers usually run cron in UTC.',
      },
    ],
    keywords: [
      'crontab generator',
      'cron expression generator',
      'build cron schedule',
      'cron builder',
      'cronjob generator',
    ],
    related: ['cron-parser', 'date-calculator', 'docker-command-builder'],
  },
  {
    slug: 'docker-command-builder',
    name: 'Docker Command Builder',
    category: 'build',
    title: 'Docker Run Command Builder & Compose Generator | Toolbit',
    description:
      'Build docker run commands and docker-compose files visually, with ports, volumes, and environment variables. Runs locally.',
    h1: 'Docker Run and Compose Command Builder',
    lede: 'Assemble a docker run command without hunting through the flag reference, then export the same configuration as a docker-compose service definition.',
    bullets: [
      'Port mappings, volume mounts, environment variables, and networks.',
      'Restart policies, resource limits, and health checks.',
      'One-click conversion between docker run and docker-compose YAML.',
      'Copy-ready output with correct quoting and escaping.',
    ],
    howTo: [
      'Enter the image and fill in ports, volumes, and environment variables.',
      'Set restart policy and resource limits if you need them.',
      'Copy the docker run command or the compose service block.',
    ],
    faq: [
      {
        q: 'Can it generate docker-compose YAML?',
        a: 'Yes. The same configuration exports as a compose service definition, so you can move from a throwaway command to a checked-in file.',
      },
      {
        q: 'Does it handle quoting correctly?',
        a: 'Yes. Values containing spaces or shell metacharacters are quoted so the command survives a copy-paste.',
      },
      { q: 'Are my environment variables uploaded?', a: privacyAnswer },
    ],
    keywords: [
      'docker command generator',
      'docker run builder',
      'docker compose generator',
      'docker flags helper',
      'generate docker command',
    ],
    related: ['crontab-generator', 'yaml-formatter', 'nginx-config-validator'],
  },
];

/** Site-wide FAQ, rendered as FAQPage structured data on the homepage. */
export const SITE_FAQ = [
  { q: 'Does Toolbit upload my files?', a: privacyAnswer },
  { q: 'Can I use Toolbit offline?', a: offlineAnswer },
  {
    q: 'Is Toolbit free?',
    a: 'Yes. Every tool is free to use, there is no sign-up, no account, no paid tier, and no advertising. The project is open source under the MIT licence.',
  },
  {
    q: 'Does Toolbit support JSON?',
    a: 'Yes. Toolbit includes a JSON formatter, a JSON Schema validator, a CSV to JSON converter, and YAML and XML converters that read and write JSON.',
  },
  {
    q: 'Does Toolbit track me?',
    a: 'Toolbit uses privacy-preserving product analytics to understand aggregate feature use and errors. Tool inputs and outputs are never collected. Apart from analytics and requests you explicitly send with the API and WebSocket tools, processing happens locally in your browser.',
  },
  {
    q: 'Is there a desktop version?',
    a: 'Toolbit installs as a PWA from supported browsers on computers and mobile devices. Cached local tools are available offline.',
  },
];

/** Reasons-to-use bullets, reused by the homepage fallback and guide pages. */
export const WHY_TOOLBIT = [
  {
    title: 'Runs locally',
    body: 'Every transformation happens in your browser with standard Web APIs. There is no backend to send your data to.',
  },
  {
    title: 'No uploads',
    body: 'Files you drop in are read from disk and processed in the tab. They are never transmitted, so confidential documents stay confidential.',
  },
  {
    title: 'Works offline',
    body: 'Install it once and the whole toolbox keeps working on a plane, on a locked-down network, or on an air-gapped machine.',
  },
  {
    title: '40+ developer utilities',
    body: 'Formatters, encoders, generators, converters, and inspectors for the tasks that interrupt real work.',
  },
  {
    title: 'Workspace mode',
    body: 'Open several tools as tabs, pipe output from one into the next, and keep your working set in view.',
  },
  {
    title: 'Keyboard shortcuts',
    body: 'A command palette and shortcuts for everything, so you never reach for the mouse mid-thought.',
  },
];

/** Comparison landing pages. */
export const COMPARISON_PAGES = [
  {
    slug: 'toolbit-vs-devtoys',
    title: 'Toolbit vs DevToys — Offline Developer Tools Compared | Toolbit',
    description:
      'How Toolbit and DevToys compare for offline developer utilities: platform support, tool coverage, privacy, and installation. Both keep your data local.',
    h1: 'Toolbit vs DevToys',
    competitor: 'DevToys',
    lede: 'DevToys is a well-liked offline toolbox for Windows, later joined by a macOS and Linux build. Toolbit covers similar ground but runs anywhere a browser does, including as an installable PWA. Both are built on the same principle: your data should not need to travel to a server to be reformatted.',
    sections: [
      {
        h2: 'Where they overlap',
        body: 'Both give you JSON, XML, and YAML formatting, Base64 and URL encoding, JWT decoding, hash generation, UUID generation, regex testing, and a Markdown preview. Both process everything locally, and neither asks you to sign in.',
      },
      {
        h2: 'Where Toolbit differs',
        body: 'Toolbit runs in any browser, so a colleague can use it from a locked-down machine without installing anything, and it installs as a PWA or a native app when you want it on the dock. It adds an API request builder, a WebSocket tester, a Docker command builder, a certificate decoder, and PDF tools. Tools also chain: output from the Base64 decoder can be piped straight into the JWT decoder.',
      },
      {
        h2: 'Where DevToys differs',
        body: 'DevToys is a native application first, with tight OS integration and a smart-detection clipboard flow that feels natural on the desktop. If you work exclusively on one machine and prefer a native binary over a browser tab, that is a real advantage.',
      },
      {
        h2: 'Which should you use?',
        body: 'If you move between machines, work in a browser most of the day, or want to share a link to a specific tool with a teammate, Toolbit fits better. If you live on a single desktop and want a native app in your taskbar, DevToys is an excellent choice. Neither uploads your data, which is the part that matters most.',
      },
    ],
    faq: [
      {
        q: 'Is Toolbit a DevToys clone?',
        a: 'No. The two projects share a philosophy — local-first developer utilities — but Toolbit is browser-first with a workspace model, tool chaining, and networking tools that DevToys does not include.',
      },
      {
        q: 'Do both work offline?',
        a: 'Yes. DevToys is a native app, and Toolbit installs as a PWA whose cached local tools work without a connection.',
      },
      { q: 'Is either one free?', a: 'Both are free and open source.' },
    ],
  },
  {
    slug: 'toolbit-vs-cyberchef',
    title: 'Toolbit vs CyberChef — Which Local Tool to Use | Toolbit',
    description:
      'Toolbit and CyberChef both run entirely in the browser. Compare their recipe model, tool coverage, and which fits everyday development work.',
    h1: 'Toolbit vs CyberChef',
    competitor: 'CyberChef',
    lede: 'CyberChef is GCHQ\'s "cyber swiss army knife" — a browser-based tool for chaining data operations into recipes. Toolbit targets a different day: the small formatting, decoding, and generation tasks that interrupt ordinary development work. Both run entirely client-side.',
    sections: [
      {
        h2: 'The recipe model versus the workspace model',
        body: "CyberChef's strength is its recipe pipeline: stack dozens of operations, feed data through, and save the recipe for later. It is unmatched for forensics, malware analysis, and multi-stage decoding. Toolbit instead gives each task a focused screen with sensible defaults, plus tabs and a pipe for the two- or three-step chains that come up in practice.",
      },
      {
        h2: 'Tool coverage',
        body: "CyberChef has far more esoteric operations — historic ciphers, compression formats, binary analysis, data carving. Toolbit is broader on everyday development: an API request builder, a WebSocket tester, a Docker command builder, SQL and GraphQL formatters, PDF tools, and an image converter, none of which are CyberChef's remit.",
      },
      {
        h2: 'Learning curve',
        body: 'CyberChef expects you to know which operation you want and how to order it. Toolbit gives each tool its own URL and page, so "format this JSON" is one click rather than a recipe to assemble. If you are handing a link to a colleague who is not a security analyst, that difference matters.',
      },
      {
        h2: 'Which should you use?',
        body: 'For forensic work, deep binary analysis, or long multi-stage decoding pipelines, use CyberChef. For everyday formatting, decoding, generation, and API poking, Toolbit is faster to reach for. Many people keep both bookmarked.',
      },
    ],
    faq: [
      {
        q: 'Does CyberChef upload my data?',
        a: 'No, and neither does Toolbit. Both are client-side, which is why both are safe for sensitive input.',
      },
      {
        q: 'Can Toolbit chain operations like a CyberChef recipe?',
        a: "Toolbit supports piping output from one tool into a compatible next tool, which covers common two- and three-step chains. It does not aim to replicate CyberChef's arbitrary-length recipes.",
      },
      {
        q: 'Which is better for JWTs and JSON?',
        a: 'Toolbit — the JWT decoder and JSON tools are purpose-built screens rather than generic operations.',
      },
    ],
  },
  {
    slug: 'toolbit-vs-postman',
    title: 'Toolbit vs Postman — Lightweight API Testing | Toolbit',
    description:
      "Compare Toolbit's built-in API request builder with Postman. No account, no cloud sync, optional minimized analytics — plus 40+ other developer tools.",
    h1: 'Toolbit vs Postman',
    competitor: 'Postman',
    lede: "Postman is a full API development platform: collections, environments, mock servers, monitors, and team collaboration. Toolbit's API request builder covers the part most developers use most days — send a request, read the response — without an account or a cloud workspace.",
    sections: [
      {
        h2: 'What Toolbit does well',
        body: 'Open a tab, type a URL, add headers, send, read the formatted response with status and timing. Nothing syncs anywhere, nothing phones home, and there is no sign-in wall between you and a GET request. The response drops straight into the JSON formatter or the JWT decoder when you need to look closer.',
      },
      {
        h2: 'What Postman does that Toolbit does not',
        body: 'Shared collections, environment and variable management, scripted pre-request and test assertions, mock servers, contract testing, monitors, and team workflows. If your API testing is a collaborative, versioned artefact, Postman is the right tool and Toolbit is not trying to replace it.',
      },
      {
        h2: 'Privacy and account requirements',
        body: 'Postman is a cloud product; collections sync to its servers unless you configure otherwise, and it requires an account. Toolbit has no backend at all — requests go from your browser to the endpoint you typed and nowhere else, and there is nothing to sign up for.',
      },
      {
        h2: 'The browser trade-off',
        body: "Because Toolbit's client runs in the page, it obeys CORS. Endpoints that do not send permissive CORS headers cannot be called from the browser build; Postman, as a native app, has no such restriction. That is the main practical limitation to be aware of.",
      },
    ],
    faq: [
      {
        q: 'Can Toolbit replace Postman?',
        a: "For quick endpoint checks and debugging, comfortably. For shared collections, scripted test suites, and mock servers, no — those are Postman's core and Toolbit does not implement them.",
      },
      {
        q: 'Why does my request fail with a CORS error in Toolbit?',
        a: 'The request runs from the browser and obeys the same-origin policy. Endpoints without permissive CORS headers need a native client or a proxy.',
      },
      {
        q: 'Does Toolbit require an account?',
        a: 'No. There is no account, no sign-in, and no cloud sync — the tool has no backend.',
      },
    ],
  },
];

/** Long-form keyword landing pages. */
export const GUIDE_PAGES = [
  {
    slug: 'offline-developer-tools',
    title: 'Offline Developer Tools — 40+ Utilities, No Internet | Toolbit',
    description:
      'A complete set of offline developer tools: JSON formatter, JWT decoder, Base64 encoder, regex tester and more, all working with no connection and no uploads.',
    h1: 'Offline Developer Tools That Work Without an Internet Connection',
    lede: 'Most developer utilities on the web stop being useful the moment the connection does — and several of them were never safe to paste a token into in the first place. Toolbit is a complete toolbox that installs once and then works with the network unplugged.',
    sections: [
      {
        h2: 'Why offline matters more than it sounds',
        body: 'Offline is not only about aeroplanes. It is about the locked-down corporate network that blocks unknown domains, the air-gapped environment where regulated data lives, the customer site with hostile WiFi, and the simple fact that a tool which never makes a request cannot leak anything. When the formatter runs in your tab, "did that JSON contain a customer record?" stops being a question you need to answer.',
      },
      {
        h2: 'How Toolbit works without a connection',
        body: 'Toolbit is a progressive web app. The first visit caches the application shell and every tool; after that the service worker serves them from disk. There is no API to call because every transformation — parsing, formatting, hashing, encoding — is implemented with standard browser APIs. Install the PWA to launch Toolbit from your device.',
      },
      {
        h2: 'What is in the offline toolbox',
        body: 'Formatters for JSON, YAML, XML, SQL, CSS, and GraphQL. Encoders and decoders for Base64, URLs, HTML entities, JWTs, X.509 certificates, and protobuf wire format. Generators for UUIDs, hashes, passwords, TOTP codes, QR codes, and realistic test data. Converters for timestamps, colours, units, images, and CSV. Inspectors for regular expressions, diffs, git patches, and cron expressions. Plus an HTTP client and a WebSocket tester for the moments the network is back.',
      },
      {
        h2: 'Installing for offline use',
        body: 'In a Chromium or Edge browser, use the install icon in the address bar. On iOS, use Share then Add to Home Screen. Cached local tools can then work without a connection. Network tools and analytics require a connection.',
      },
    ],
    faq: [
      {
        q: 'Do offline tools still get updates?',
        a: 'Yes. When you are next online the service worker fetches the new version in the background and applies it on the following load.',
      },
      {
        q: 'Is an offline web app as private as a native one?',
        a: 'In this case yes — local transformations do not upload input. Network tools send requested traffic, and optional analytics sends minimized usage events.',
      },
      {
        q: 'Which tools need a connection?',
        a: 'Only the API request builder and the WebSocket tester, which by definition talk to a remote endpoint. Everything else is pure computation.',
      },
    ],
    toolHighlights: [
      'json-formatter',
      'jwt-decoder',
      'base64-encoder',
      'regex-tester',
      'hash-generator',
      'uuid-generator',
    ],
  },
  {
    slug: 'local-first-developer-tools',
    title: 'Local-First Developer Tools — Nothing Leaves Your Browser | Toolbit',
    description:
      'What local-first means for developer utilities, why pasting tokens into online formatters is risky, and a full toolbox that processes everything in your browser.',
    h1: 'Local-First Developer Tools',
    lede: 'Local-first means the computation happens on your machine and the data stays there. For developer utilities that is not an architectural nicety — it is the difference between a tool you can paste a production access token into and one you cannot.',
    sections: [
      {
        h2: 'The problem with "online" formatters',
        body: "A large share of free formatting and decoding sites post your input to a backend. That input is routinely an access token, a customer record, an internal API response, or a config file with credentials in it. Even with good intentions on the operator's side, the data now exists in someone else's logs, and in a regulated environment that is a reportable event. The safest architecture is the one where the data never moves.",
      },
      {
        h2: 'What local-first looks like in practice',
        body: 'Toolbit has no backend. Parsing, formatting, hashing, encoding, and image and PDF processing all run in the browser using standard Web APIs: TextEncoder, Web Crypto, Canvas, and the DOM parser. You can verify it — open the network tab, paste a token into the JWT decoder, and watch nothing happen. State such as history and workspaces lives in IndexedDB on your device, not in an account.',
      },
      {
        h2: 'Local-first is also faster',
        body: "A round trip to a server costs a hundred milliseconds or more before any work begins. Local processing is bounded only by the parse itself, which is why formatting updates as you type rather than after you press a button. There is also no rate limit, no queue, and no upload size cap — a fifty-megabyte JSON file is limited only by your tab's memory.",
      },
      {
        h2: 'What you give up, honestly',
        body: 'No server means no shared team workspaces, no cross-device sync without exporting a file, and no server-side processing for formats that genuinely need it. Browser-based HTTP requests also obey CORS. For most everyday tasks these are acceptable trade-offs; where they are not, use the right tool for the job.',
      },
    ],
    faq: [
      {
        q: 'How can I verify nothing is uploaded?',
        a: "Open your browser's network tab, paste sensitive input, and run the tool. You will see no outbound requests. The source is also open on GitHub.",
      },
      {
        q: 'Where is my history stored?',
        a: 'In IndexedDB in your browser profile, on your device. Clearing site data removes it, and it is never synced anywhere.',
      },
      {
        q: 'Is local-first the same as open source?',
        a: 'No, they are separate properties — but Toolbit is both, which means you can audit the claim rather than take it on trust.',
      },
    ],
    toolHighlights: [
      'jwt-decoder',
      'certificate-decoder',
      'pdf-tools',
      'image-converter',
      'hash-generator',
      'password-generator',
    ],
  },
  {
    slug: 'developer-toolbox',
    title: 'The Developer Toolbox — 40+ Everyday Utilities in One Place | Toolbit',
    description:
      'One developer toolbox with formatters, encoders, generators, converters, and inspectors. Browser-based, offline-capable, and free.',
    h1: 'A Developer Toolbox for the Work Around the Code',
    lede: 'Every developer accumulates a bookmark folder of single-purpose sites: one for formatting JSON, one for decoding a token, one for generating a UUID, one for explaining a cron expression. Toolbit collects that folder into one workspace that works offline and never uploads anything.',
    sections: [
      {
        h2: 'One workspace instead of fifteen tabs',
        body: 'Tools open as tabs inside a single workspace. Output from one can be piped into a compatible next tool, so a Base64 blob becomes a decoded JWT becomes formatted JSON without any copy-pasting between sites. A command palette reaches any tool in two keystrokes, and recent work stays in your history.',
      },
      {
        h2: 'What is in the box',
        body: 'Format and validate: JSON, YAML, XML, SQL, CSS, GraphQL, and nginx configs. Encode and decode: Base64, URLs, HTML entities, JWTs, certificates, protobuf. Generate: UUIDs, hashes, passwords, TOTP codes, QR codes, lorem ipsum, and fake test data. Transform: CSV to JSON, timestamps, colours, units, images, and text case. Inspect: regular expressions, text and git diffs, cron expressions, and HTTP status codes. Build: HTTP requests, WebSocket sessions, cron entries, and Docker commands.',
      },
      {
        h2: 'Built for the way the work actually arrives',
        body: 'These tasks interrupt something else, so the toolbox is built for speed: paste-and-see-the-answer rather than fill-in-a-form-and-submit, keyboard shortcuts everywhere, smart detection that guesses what you pasted, and a URL per tool so you can bookmark or share the exact one you need.',
      },
      {
        h2: 'Free, open source, and private',
        body: 'No account, no paid tier, and no advertising. Toolbit uses privacy-preserving analytics for product improvement, while all tool processing remains client-side and tool content is never collected.',
      },
    ],
    faq: [
      {
        q: 'How many tools are included?',
        a: 'Over forty, spanning formatters, encoders, generators, converters, inspectors, and builders.',
      },
      {
        q: 'Can I install it as an app?',
        a: 'Yes. It installs as a PWA from the browser, and native builds are available for macOS, Windows, and Linux.',
      },
      {
        q: 'Is it really free?',
        a: 'Yes — free, open source under the MIT licence, with no paid tier and no ads.',
      },
    ],
    toolHighlights: [
      'json-formatter',
      'yaml-formatter',
      'regex-tester',
      'api-request-builder',
      'docker-command-builder',
      'cron-parser',
    ],
  },
];

/**
 * Blog posts.
 *
 * Kept deliberately short and only added when there is something worth saying —
 * a thin blog index costs more in crawl quality than it earns.
 */
export const BLOG_POSTS = [
  {
    slug: 'never-paste-secrets-into-online-tools',
    title: 'Pasting a JWT Into an Online Decoder Is a Security Incident | Toolbit',
    description:
      'Most online JWT decoders, JSON formatters and Base64 tools post your input to a server. Here is what that means for a real access token, and how to check.',
    h1: 'Pasting a JWT into an online decoder is a security incident',
    date: '2026-08-06',
    readingTime: '5 min read',
    lede: 'It takes four seconds and feels harmless. You copy a token out of a failing request, paste it into the first decoder Google offers, and read the claims. In a lot of organisations you have just created a reportable event.',
    sections: [
      {
        h2: 'What actually happens when you paste',
        paragraphs: [
          'A JWT is three Base64url segments. Decoding it is a handful of lines of JavaScript — there is no technical reason for the work to happen anywhere but your browser. Yet a large share of the popular decoders POST the token to a backend and render the response.',
          'You can check any tool in about ten seconds. Open your browser devtools, switch to the Network tab, paste the token, and watch. If a request goes out carrying your input, the tool has your token. Do the same on the JSON formatters and Base64 decoders you have bookmarked; the results are often surprising.',
        ],
      },
      {
        h2: 'Why a decoded token still matters',
        paragraphs: [
          "The usual defence is that a JWT payload is not encrypted, so nothing was disclosed by decoding it. That misses the point twice over. First, the signature travelled with it — whoever received that token can replay it against your API until it expires, with whatever scopes it carries. Second, the payload routinely contains a user id, an email address, a tenant identifier, and role claims. Under GDPR that is personal data, and it now sits in a third party's logs.",
          'The window is often longer than people assume. Access tokens with an hour of life are common; refresh tokens last far longer. "It expires soon" is a hope, not a control.',
        ],
      },
      {
        h2: 'The same problem, everywhere else',
        paragraphs: [
          'Tokens are the sharpest example, not the only one. The config file you pasted into an online YAML validator had a database password in it. The API response you formatted contained customer records. The CSV you converted to JSON was an export of your user table. The PDF you merged was a signed contract.',
          'None of these feel like data exfiltration in the moment, because the mental model is "I used a tool", not "I uploaded a file to a stranger". The architecture is what decides, not the intent.',
        ],
      },
      {
        h2: 'What to do instead',
        paragraphs: [
          'Prefer tools that do the work in the browser and can prove it. Toolbit performs transformations locally. Network tools contact chosen endpoints and optional minimized analytics can be disabled. The source is open so this behavior can be reviewed.',
          'Where you cannot verify a tool, use a throwaway token or redact the payload first. And if a token has already been through a service you do not control, treat it as compromised: revoke it, rotate the signing key if the token was signed with a shared secret, and move on. Rotation is cheap. Explaining an incident is not.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is it safe to decode a JWT in Toolbit?',
        a: 'Yes. The JWT decoder runs entirely in your browser and does not send your token over the network. Optional usage analytics can be disabled in settings. It is still good practice to use a test token where one will do.',
      },
      {
        q: 'Does decoding a JWT reveal the signing key?',
        a: 'No. The signature is included in the token but the key that produced it is not. That is why decoding is safe and verifying is not something a client-side tool should be doing with your production secret.',
      },
      {
        q: 'How do I check whether a tool uploads my input?',
        a: 'Open devtools, go to the Network tab, clear it, then paste your input and run the tool. Any outbound request carrying your data is your answer.',
      },
    ],
    tools: ['jwt-decoder', 'base64-encoder', 'certificate-decoder'],
  },
  {
    slug: 'cron-expression-guide',
    title: 'Cron Expressions Explained, Field by Field | Toolbit',
    description:
      'A practical guide to reading and writing cron expressions: all five fields, ranges, steps and lists, the day-of-week trap, and how to verify a schedule before you deploy it.',
    h1: 'Cron expressions explained, field by field',
    date: '2026-08-06',
    readingTime: '6 min read',
    lede: 'Cron syntax is five numbers and some punctuation, and almost everyone reaches for a reference every single time. Here is the whole thing in one page, including the two rules that cause most of the surprises.',
    sections: [
      {
        h2: 'The five fields',
        paragraphs: [
          'A standard cron entry is minute, hour, day-of-month, month, day-of-week — in that order. So 30 2 * * * is "02:30 every day", and 0 9 1 * * is "09:00 on the first of the month".',
          'The ranges are: minute 0-59, hour 0-23, day-of-month 1-31, month 1-12 (or JAN-DEC), day-of-week 0-7 where both 0 and 7 mean Sunday (or SUN-SAT). An asterisk means "every value".',
        ],
      },
      {
        h2: 'Ranges, steps and lists',
        paragraphs: [
          'Three operators cover nearly everything you will write. A range uses a hyphen: 9-17 in the hour field means every hour from nine to five. A list uses commas: 1,15 in day-of-month means the first and the fifteenth. A step uses a slash: */15 in the minute field means every fifteenth minute — 0, 15, 30, 45.',
          'They combine. 0 9-17/2 * * 1-5 reads as "at minute zero, every second hour between 09:00 and 17:00, Monday to Friday". Steps apply to whatever precedes them, so 9-17/2 steps within the range rather than across the whole field.',
        ],
      },
      {
        h2: 'The day-of-month and day-of-week trap',
        paragraphs: [
          'This is the rule that catches everyone. When both day-of-month and day-of-week are restricted — neither is an asterisk — cron treats them as OR, not AND.',
          'So 0 0 13 * 5 does not mean "Friday the 13th". It means "every 13th of the month, and also every Friday". If you want the intersection you have to test for it inside the job itself, because cron cannot express it. When only one of the two fields is restricted, it behaves the way you would expect.',
        ],
      },
      {
        h2: 'Time zones will bite you',
        paragraphs: [
          'Cron runs in the time zone of whatever is running it. Your laptop is probably local time; your server is probably UTC; a Kubernetes CronJob is UTC unless you set spec.timeZone. A schedule that reads "9am" on your machine may fire at 4am in production.',
          'Daylight saving is the follow-on problem. A job scheduled at 02:30 local time will run twice on the day the clocks go back and not at all on the day they go forward. If the job is not idempotent, schedule it in UTC or outside the 01:00-03:00 window.',
        ],
      },
      {
        h2: 'Verify before you deploy',
        paragraphs: [
          'The slowest way to check a cron expression is to deploy it and wait. Paste it into a parser instead: a good one turns the expression into a sentence and lists the next several fire times, which catches an off-by-one field almost immediately.',
          'Toolbit has both directions — a parser that explains an existing expression, and a visual builder that assembles one from the schedule you actually want. Both run in the browser, so a schedule containing internal job names stays private.',
        ],
      },
    ],
    faq: [
      {
        q: 'What does */5 * * * * mean?',
        a: 'Every five minutes, at minutes 0, 5, 10 and so on through 55, every hour of every day.',
      },
      {
        q: 'How do I schedule a job for the last day of the month?',
        a: 'Standard cron cannot express it. Some implementations add an L character; otherwise the usual approach is to run daily and exit early unless tomorrow is the first.',
      },
      {
        q: 'What is the sixth field I sometimes see?',
        a: 'A leading seconds field, used by Quartz and several application-level schedulers. Unix crontab itself only has five fields.',
      },
    ],
    tools: ['cron-parser', 'crontab-generator', 'timestamp-converter'],
  },
  {
    slug: 'base64-is-not-encryption',
    title: 'Base64 Is Not Encryption — What It Is For | Toolbit',
    description:
      'Base64 is an encoding, not a cipher. What it actually solves, why it appears in JWTs, data URIs and email, and what to reach for when you need real confidentiality.',
    h1: 'Base64 is not encryption',
    date: '2026-08-06',
    readingTime: '4 min read',
    lede: 'Base64 output looks scrambled, which is exactly the problem: it looks like it is hiding something. It is not. It is a transport format, and treating it as a security control is a recurring source of real vulnerabilities.',
    sections: [
      {
        h2: 'What Base64 actually does',
        paragraphs: [
          'Base64 maps arbitrary bytes onto 64 characters that survive systems which only handle text. It takes three bytes at a time, splits those 24 bits into four six-bit groups, and looks each one up in a fixed alphabet. That is the entire algorithm.',
          'There is no key. Anyone can reverse it, and the transformation costs about 33% more bytes than the input. Encoding is a format conversion; encryption requires a secret. Confusing the two is how "we obfuscated the credentials" ends up in a code review.',
        ],
      },
      {
        h2: 'Where it earns its place',
        paragraphs: [
          'Base64 exists because plenty of channels are not binary-safe. Email attachments are the original case: SMTP was specified for 7-bit text, so MIME encodes binary parts. Data URIs embed an image directly in a stylesheet or an HTML document. HTTP Basic authentication encodes the credential pair so a colon in a password does not break parsing.',
          'JWTs use the URL-safe variant, which swaps + and / for - and _ so the value survives inside a URL. Every one of these is a transport concern. None of them is a confidentiality claim — Basic auth in particular is secure only because TLS wraps it, not because of the encoding.',
        ],
      },
      {
        h2: 'Padding, alphabets, and the bits people trip over',
        paragraphs: [
          'Because the algorithm works in three-byte groups, an input whose length is not a multiple of three has to be padded. That is what the trailing = signs are: one for a remainder of two bytes, two for a remainder of one. Some parsers accept unpadded input and some reject it, which is a common source of "it works in curl but not in the client".',
          'There is also more than one alphabet. Standard Base64 uses + and /, which both have meaning inside a URL, so the URL-safe variant substitutes - and _. Mixing them up produces a string that decodes without error but yields the wrong bytes — a particularly annoying bug because nothing throws. If you are decoding a JWT segment, you want the URL-safe alphabet.',
          'And Base64 is not Base64url is not Base32 is not hex. They are different alphabets for the same job, with different size overheads: hex doubles the input, Base32 adds 60%, Base64 adds 33%. Pick based on what the channel tolerates, not on which looks most scrambled.',
        ],
      },
      {
        h2: 'The failure modes',
        paragraphs: [
          'Three keep recurring. Storing a Base64-encoded password in a config file and calling it protected — it is plaintext with extra steps, and any reviewer with a decoder can read it in seconds. Base64-encoding a payload to get it past a filter, which is why naive input validation is bypassed so easily; if your WAF rule matches on a literal string, encoding defeats it without any cleverness. And encoding large binaries into JSON, paying the 33% overhead plus the parse cost, when a separate binary channel would do.',
          'The tell for all three is the same: someone reached for Base64 to change who could read something. It cannot do that. It changes what can carry something.',
        ],
      },
      {
        h2: 'What to use when you need real protection',
        paragraphs: [
          'For data at rest, use authenticated encryption: AES-GCM or ChaCha20-Poly1305, with the key held somewhere that is not the repository. For passwords specifically, do not encrypt at all — hash with Argon2id or bcrypt, which are designed to be slow. For data in transit, TLS. For integrity without confidentiality, an HMAC or a signature.',
          'Base64 often still appears alongside these, wrapping the ciphertext or the signature so it can travel as text. That is the correct relationship: encode after you encrypt, never instead.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is Base64 reversible?',
        a: 'Completely, by anyone, with no key. That is what makes it an encoding rather than a cipher.',
      },
      {
        q: 'Why does Base64 make data bigger?',
        a: 'Every three bytes become four characters, so output is about 33% larger than input, plus padding.',
      },
      {
        q: 'What is URL-safe Base64?',
        a: 'A variant that replaces + and / with - and _ so the value can sit in a URL or a JWT segment without being escaped.',
      },
    ],
    tools: ['base64-encoder', 'jwt-decoder', 'hash-generator'],
  },
];

/** Tools surfaced as "popular" on the homepage and in the crawlable fallback. */
export const POPULAR_TOOL_SLUGS = [
  'json-formatter',
  'jwt-decoder',
  'base64-encoder',
  'regex-tester',
  'uuid-generator',
  'yaml-formatter',
  'sql-formatter',
  'hash-generator',
];

/** @param {string} slug */
export function getToolPage(slug) {
  return TOOL_PAGES.find((tool) => tool.slug === slug);
}

/** @param {string} categoryId */
export function getToolPagesByCategory(categoryId) {
  return TOOL_PAGES.filter((tool) => tool.category === categoryId);
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(pathname = '/') {
  return `${SITE.url}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

/**
 * Canonical URL for a tool. Tools live at the root of the site — the same URL
 * serves the prerendered description and boots the interactive tool.
 */
export function toolUrl(slug) {
  return `/${slug}`;
}

/**
 * Legal pages. Single source of truth: the React routes
 * (`src/app/pages/privacy-policy.tsx`, `terms-of-service.tsx`) render from
 * this data, and the static generator emits crawlable `/privacy` + `/terms`
 * files from it — so the copy can never drift between the two.
 */
export const LEGAL_PAGES = [
  {
    slug: 'privacy',
    title: 'Privacy Policy — Toolbit',
    description:
      'Toolbit processes your content locally in your browser and uses optional pseudonymous analytics to improve the app. No account required. Read the full privacy policy.',
    updated: '2026-10-01',
    h1: 'Privacy Policy',
    lede: 'The short version: Toolbit processes transformations locally in your browser. Network tools send requests only when you choose to run them. Optional product analytics collects minimized usage events; tool input and output are excluded.',
    contactEmail: 'alwinaugustin@gmail.com',
    sections: [
      {
        h2: 'Overview',
        paragraphs: [
          'Toolbit ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our developer utilities application.',
        ],
      },
      {
        h2: 'Data Processing',
        paragraphs: [
          'All tools in Toolbit (JSON formatter, Base64 encoder, hash generator, etc.) process data entirely within your browser using JavaScript. This means:',
        ],
        bullets: [
          'Local transformations do not upload input. HTTP and WebSocket tools contact the endpoints you select.',
          'Toolbit has no accounts or cloud workspace storage.',
          'Processing happens instantly on your device.',
          'Cached local tools work offline. Network tools require connectivity.',
        ],
      },
      {
        h2: 'Local Storage',
        paragraphs: [
          "Toolbit uses your browser's local storage and IndexedDB to save preferences and convenience data:",
          'This data is stored only on your device and is never transmitted anywhere. You can clear this data through the Privacy and storage settings or browser settings. History retention defaults to 30 days; applying retention removes expired entries only when you request it. Workspace payloads require an explicit Include data choice. Recipe files contain settings only.',
        ],
        bullets: [
          'Theme preference: Whether you prefer light or dark mode',
          'Sidebar state: Whether the sidebar is open or closed',
          'Favorites and recents: Your pinned tools and recent activity',
          'History, workspaces, snippets: Normal tool history and explicitly saved documents; secret tools are excluded by default.',
        ],
      },
      {
        h2: 'Cookies',
        paragraphs: ['Toolbit does not use cookies.'],
      },
      {
        h2: 'Third-Party Services',
        paragraphs: ['Toolbit uses the following external resources:'],
        bullets: [
          'Cloudflare Pages: The web application is hosted on Cloudflare Pages, which may collect standard web server logs.',
        ],
      },
      {
        h2: 'Analytics',
        paragraphs: [
          'Toolbit uses PostHog to measure pseudonymous product usage, diagnose errors, and improve the application. When enabled and configured, we collect a random device identifier, known route/tool identifiers, bounded counts, and error codes. You can disable analytics before collection using Privacy and storage; this also removes the stored device identity. We do not send the text, files, tokens, snippets, or other content you process with Toolbit.',
        ],
      },
      {
        h2: "Children's Privacy",
        paragraphs: [
          'Toolbit is a general-purpose developer tool and does not knowingly collect any personal information from anyone, including children under 13 years of age.',
        ],
      },
      {
        h2: 'Changes to This Policy',
        paragraphs: [
          'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
        ],
      },
      {
        h2: 'Contact Us',
        paragraphs: ['If you have any questions about this Privacy Policy, please contact us at:'],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service — Toolbit',
    description:
      "The terms that apply when you use Toolbit's local-first developer tools. Free to use, no account required, provided as-is under the MIT licence.",
    updated: '2026-10-01',
    h1: 'Terms of Service',
    lede: 'The short version: Toolbit is free for personal and commercial use, processes everything locally in your browser, and is provided as-is under the MIT licence.',
    contactEmail: 'alwinaugustin@gmail.com',
    sections: [
      {
        h2: 'Agreement to Terms',
        paragraphs: [
          'By accessing or using Toolbit ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.',
        ],
      },
      {
        h2: 'Description of Service',
        paragraphs: [
          'Toolbit is a collection of free developer utilities including JSON formatters, encoders/decoders, converters, and other tools. The Service is provided as-is, free of charge, for personal and commercial use.',
        ],
      },
      {
        h2: 'Use License',
        paragraphs: [
          'Toolbit is open-source software licensed under the MIT License. You are granted permission to:',
          'The full license text is available in the project repository on GitHub.',
        ],
        bullets: [
          'Use the Service for any purpose, personal or commercial',
          'Copy, modify, and distribute the source code',
          'Create derivative works based on the software',
        ],
      },
      {
        h2: 'User Responsibilities',
        paragraphs: ['When using Toolbit, you agree to:'],
        bullets: [
          'Use the Service in compliance with all applicable laws and regulations',
          'Not attempt to compromise the security or availability of the Service',
          'Not use the Service to process data you are not authorized to process',
          'Accept responsibility for all data you input into the tools',
        ],
      },
      {
        h2: 'Data and Privacy',
        paragraphs: [
          'All data processing in Toolbit occurs locally in your browser. We do not have access to any data you input into the tools. You are solely responsible for the data you choose to process using our Service.',
          'For more information, please review our [Privacy Policy](/privacy).',
        ],
      },
      {
        h2: 'Disclaimer of Warranties',
        paragraphs: [
          'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:',
          'We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.',
        ],
        bullets: [
          'WARRANTIES OF MERCHANTABILITY',
          'FITNESS FOR A PARTICULAR PURPOSE',
          'NON-INFRINGEMENT',
          'ACCURACY OR RELIABILITY OF RESULTS',
        ],
      },
      {
        h2: 'Limitation of Liability',
        paragraphs: [
          'TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL TOOLBIT, ITS AUTHORS, OR CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:',
        ],
        bullets: [
          'Loss of profits, data, or goodwill',
          'Service interruption or computer damage',
          'Cost of substitute services',
          'Any damages arising from use of the Service',
        ],
      },
      {
        h2: 'Indemnification',
        paragraphs: [
          'You agree to defend, indemnify, and hold harmless Toolbit and its contributors from and against any claims, damages, obligations, losses, or expenses arising from your use of the Service or violation of these Terms.',
        ],
      },
      {
        h2: 'Changes to Terms',
        paragraphs: [
          'We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.',
        ],
      },
      {
        h2: 'Governing Law',
        paragraphs: [
          'These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.',
        ],
      },
      {
        h2: 'Contact Us',
        paragraphs: ['If you have any questions about these Terms, please contact us at:'],
      },
    ],
  },
];

/** @param {string} slug */
export function getLegalPage(slug) {
  return LEGAL_PAGES.find((page) => page.slug === slug);
}
