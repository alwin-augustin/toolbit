import { useState, useEffect, useMemo } from "react";
import { Button, Tabs } from "@/ds/components";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { FileDropZone } from "@/components/FileDropZone";
import { CodeEditor } from "@/v2/CodeEditor";
import { Panel, PanelHeader, CopyAction, EditorSplit } from "@/v2/EditorPanels";
import { useUrlState } from "@/hooks/use-url-state";

/** Scoped typography for the rendered preview (replaces @tailwindcss/typography). */
const previewStyles = `
.md-dropzone { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.md-preview {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 12px 16px;
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
    color: hsl(var(--text-body));
}
.md-preview h1, .md-preview h2, .md-preview h3, .md-preview h4, .md-preview h5, .md-preview h6 {
    color: hsl(var(--text-strong));
    font-weight: var(--weight-semibold);
    line-height: var(--leading-tight, 1.25);
    margin: 1.2em 0 0.5em;
}
.md-preview h1:first-child, .md-preview h2:first-child, .md-preview h3:first-child { margin-top: 0; }
.md-preview h1 { font-size: var(--text-xl); }
.md-preview h2 { font-size: var(--text-lg); border-bottom: 1px solid hsl(var(--border-faint)); padding-bottom: 0.25em; }
.md-preview h3 { font-size: var(--text-md, 1rem); }
.md-preview p { margin: 0.6em 0; }
.md-preview a { color: hsl(var(--primary)); text-decoration: underline; text-underline-offset: 2px; }
.md-preview strong { color: hsl(var(--text-strong)); font-weight: var(--weight-semibold); }
.md-preview code {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: hsl(var(--surface-2));
    border: 1px solid hsl(var(--border-faint));
    border-radius: var(--radius-sm);
    padding: 0.1em 0.35em;
    color: hsl(var(--text-strong));
}
.md-preview pre {
    background: hsl(var(--surface-1));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius-md);
    padding: 10px 12px;
    overflow-x: auto;
    margin: 0.8em 0;
}
.md-preview pre code { background: none; border: none; padding: 0; color: hsl(var(--text-body)); }
.md-preview ul, .md-preview ol { margin: 0.6em 0; padding-left: 1.5em; }
.md-preview li { margin: 0.25em 0; }
.md-preview blockquote {
    margin: 0.8em 0;
    padding: 0.25em 1em;
    border-left: 3px solid hsl(var(--primary));
    color: hsl(var(--text-muted));
    background: hsl(var(--surface-1));
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.md-preview table { border-collapse: collapse; margin: 0.8em 0; width: 100%; font-size: var(--text-sm); }
.md-preview th, .md-preview td { border: 1px solid hsl(var(--border)); padding: 6px 10px; text-align: left; }
.md-preview th { background: hsl(var(--surface-1)); color: hsl(var(--text-strong)); font-weight: var(--weight-semibold); }
.md-preview hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1.2em 0; }
.md-preview img { max-width: 100%; }
`;

export default function MarkdownPreviewer() {
    const [markdown, setMarkdown] = useState("");
    const [html, setHtml] = useState("");
    const [showPreview, setShowPreview] = useState(true);
    const shareState = useMemo(() => ({ markdown, showPreview }), [markdown, showPreview]);
    useUrlState(shareState, (state) => {
        setMarkdown(typeof state.markdown === "string" ? state.markdown : "");
        setShowPreview(state.showPreview !== false);
    });

    useEffect(() => {
        const renderMarkdown = async () => {
            try {
                const renderedHtml = await marked(markdown);
                setHtml(DOMPurify.sanitize(renderedHtml));
            } catch (error) {
                setHtml(`<p style="color:hsl(var(--danger))">Error rendering markdown: ${error instanceof Error ? error.message : 'Unknown error'}</p>`);
            }
        };
        renderMarkdown();
    }, [markdown]);

    const loadSample = () => {
        setMarkdown(`# Sample Markdown

## Heading 2

This is a **bold** text and this is *italic* text.

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### List Example

- Item 1
- Item 2
  - Nested item
  - Another nested item

### Link Example

[Visit OpenAI](https://openai.com)

### Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | More data|
| Row 2    | Data     | More data|

> This is a blockquote
> It can span multiple lines`);
    };

    return (
        <>
            <style>{previewStyles}</style>
            <EditorSplit>
                <Panel>
                    <PanelHeader
                        title="Markdown"
                        action={
                            <Button variant="ghost" size="sm" onClick={loadSample}>
                                Load sample
                            </Button>
                        }
                    />
                    <FileDropZone
                        onFileContent={setMarkdown}
                        accept={[".md", ".markdown", ".txt", "text/markdown"]}
                        className="md-dropzone"
                    >
                        <CodeEditor
                            value={markdown}
                            onChange={setMarkdown}
                            reportStatus
                            placeholder="# Your markdown here…"
                        />
                    </FileDropZone>
                </Panel>
                <Panel>
                    <PanelHeader
                        title={showPreview ? "Rendered preview" : "Raw HTML"}
                        badge={
                            <Tabs
                                variant="segment"
                                value={showPreview ? "preview" : "html"}
                                onChange={(v) => setShowPreview(v === "preview")}
                                items={[
                                    { value: "preview", label: "Preview" },
                                    { value: "html", label: "HTML" },
                                ]}
                            />
                        }
                        action={<CopyAction text={html} />}
                    />
                    {showPreview ? (
                        <div className="md-preview" dangerouslySetInnerHTML={{ __html: html }} />
                    ) : (
                        <CodeEditor value={html} readOnly placeholder="Rendered HTML will appear here…" />
                    )}
                </Panel>
            </EditorSplit>
        </>
    );
}
