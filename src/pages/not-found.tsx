import { useEffect } from "react";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applySeo } from "@/seo/use-seo";
import { POPULAR_TOOL_SLUGS, getToolPage } from "@/seo/seo-content.js";

export default function NotFound() {
    useEffect(() => {
        applySeo({
            title: "Page not found — Toolbit",
            description: "That page does not exist. Browse the Toolbit developer tools instead.",
            canonicalPath: "/",
        });
    }, []);

    const popular = POPULAR_TOOL_SLUGS.map((slug) => getToolPage(slug)).filter(
        (tool): tool is NonNullable<typeof tool> => Boolean(tool),
    );

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-lg text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-6">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold mb-3">Page not found</h1>
                <p className="text-muted-foreground mb-8">
                    That URL does not match a Toolbit page. The workspace and the full tool directory are a click away.
                </p>

                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    <Link href="/">
                        <Button>Open the workspace</Button>
                    </Link>
                    <a href="/tools">
                        <Button variant="secondary">Browse all tools</Button>
                    </a>
                </div>

                <p className="text-sm text-muted-foreground mb-3">Popular tools</p>
                <ul className="flex flex-wrap justify-center gap-2">
                    {popular.map((tool) => (
                        <li key={tool.slug}>
                            <a
                                href={`/tools/${tool.slug}`}
                                className="inline-block rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                            >
                                {tool.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
