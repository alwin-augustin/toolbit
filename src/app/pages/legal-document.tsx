import { useEffect, type ReactNode } from 'react';
import { Link } from 'wouter';
import { IconArrowLeft as ArrowLeft } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { applySeo } from '@/content/seo/use-seo';
import { getLegalPage } from '@/content/seo/seo-content.js';

/** ISO date → "1 October 2026", matching the static generator's formatDate. */
export function formatLegalDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Renders `[label](href)` spans as links; everything else as plain text. */
export function renderInlineLinks(text: string): ReactNode[] {
  const parts = text.split(/\[([^\]]+)\]\(([^)]+)\)/g);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) nodes.push(parts[i]);
    const label = parts[i + 1];
    const href = parts[i + 2];
    if (label && href) {
      nodes.push(
        href.startsWith('/') ? (
          <Link key={`${i}-${href}`} href={href} className="text-primary hover:underline">
            {label}
          </Link>
        ) : (
          <a key={`${i}-${href}`} href={href} className="text-primary hover:underline">
            {label}
          </a>
        ),
      );
    }
  }
  return nodes;
}

export interface LegalPageViewProps {
  slug: 'privacy' | 'terms';
  canonicalPath: string;
  icon: ReactNode;
}

export function LegalPageView({ slug, canonicalPath, icon }: LegalPageViewProps) {
  const page = getLegalPage(slug)!;

  useEffect(() => {
    applySeo({ title: page.title, description: page.description, canonicalPath });
  }, [canonicalPath, page]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          {icon}
          <h1 className="text-3xl font-bold">{page.h1}</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: {formatLegalDate(page.updated)}</p>

          <p className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-foreground">
            <strong>The short version:</strong> {page.lede.replace(/^The short version:\s*/, '')}
          </p>

          {page.sections.map((section) => (
            <section key={section.h2} className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">{section.h2}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{renderInlineLinks(paragraph)}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc pl-6 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{renderInlineLinks(bullet)}</li>
                  ))}
                </ul>
              )}
              {section.h2 === 'Contact Us' && page.contactEmail && (
                <p>
                  <a href={`mailto:${page.contactEmail}`} className="text-primary hover:underline">
                    {page.contactEmail}
                  </a>
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
