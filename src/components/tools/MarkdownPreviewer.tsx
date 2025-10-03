import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Code, FileText } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";

export default function MarkdownPreviewer() {
    const [markdown, setMarkdown] = useState("");
    const [html, setHtml] = useState("");
    const [showPreview, setShowPreview] = useState(true);

    useEffect(() => {
        const renderMarkdown = async () => {
            try {
                const renderedHtml = await marked(markdown);
                setHtml(DOMPurify.sanitize(renderedHtml));
            } catch (error) {
                setHtml(`<p class="text-red-500">Error rendering markdown: ${error instanceof Error ? error.message : 'Unknown error'}</p>`);
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
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Markdown Previewer
                </CardTitle>
                <CardDescription>
                    Write Markdown and see the rendered preview
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowPreview(false)}
                        variant={!showPreview ? "default" : "outline"}
                        data-testid="button-editor"
                    >
                        <Code className="h-4 w-4 mr-2" />
                        Editor
                    </Button>
                    <Button
                        onClick={() => setShowPreview(true)}
                        variant={showPreview ? "default" : "outline"}
                        data-testid="button-preview"
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                    <Button onClick={loadSample} variant="outline" data-testid="button-sample">
                        Load Sample
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="markdown-input" className="text-sm font-medium">
                            Markdown Input
                        </label>
                        <Textarea
                            id="markdown-input"
                            placeholder="# Your markdown here..."
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            className="h-80 font-mono text-sm"
                            data-testid="input-markdown"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {showPreview ? "Rendered Preview" : "Raw HTML"}
                        </label>
                        {showPreview ? (
                            <div
                                className="h-80 p-4 border rounded-md bg-background overflow-auto prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: html }}
                                data-testid="preview-markdown"
                            />
                        ) : (
                            <Textarea
                                value={html}
                                readOnly
                                className="h-80 font-mono text-sm"
                                data-testid="html-output"
                            />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}