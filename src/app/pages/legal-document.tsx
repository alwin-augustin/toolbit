import { useEffect, type ReactNode } from 'react';
import { Link } from 'wouter';
import { SitePage } from '@/app/pages/site-chrome';
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
          <Link key={`${i}-${href}`} href={href} className="text-brand-ink hover:underline">
            {label}
          </Link>
        ) : (
          <a key={`${i}-${href}`} href={href} className="text-brand-ink hover:underline">
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

/**
 * Privacy and terms.
 *
 * The only long-form reading surface in the product, so it is the one place
 * that prefers prose to density: a single column, body text at the base step
 * and one callout that states the promise before the detail. It shares the
 * out-of-shell chrome with the other standalone pages, which is also the way
 * back into the workspace — no second back button competing with the header.
 */
export function LegalPageView({ slug, canonicalPath, icon }: LegalPageViewProps) {
  const page = getLegalPage(slug)!;

  useEffect(() => {
    applySeo({ title: page.title, description: page.description, canonicalPath });
  }, [canonicalPath, page]);

  return (
    <SitePage>
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-brand-soft text-brand-ink">
            {icon}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{page.h1}</h1>
        </div>

        <div className="wb-prose prose max-w-none space-y-6 text-ink-muted">
          <p className="text-xs text-ink-faint">Last updated: {formatLegalDate(page.updated)}</p>

          <p className="rounded-lg border border-line bg-brand-soft p-4 text-ink">
            <strong>The short version:</strong> {page.lede.replace(/^The short version:\s*/, '')}
          </p>

          {page.sections.map((section) => (
            <section key={section.h2} className="space-y-4">
              <h2 className="text-lg font-semibold text-ink">{section.h2}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{renderInlineLinks(paragraph)}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc space-y-2 pl-6">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{renderInlineLinks(bullet)}</li>
                  ))}
                </ul>
              )}
              {section.h2 === 'Contact Us' && page.contactEmail && (
                <p>
                  <a
                    href={`mailto:${page.contactEmail}`}
                    className="text-brand-ink hover:underline"
                  >
                    {page.contactEmail}
                  </a>
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </SitePage>
  );
}
