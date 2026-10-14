import { useEffect } from 'react';
import { Link } from 'wouter';
import { IconAlertCircle as AlertCircle } from '@tabler/icons-react';
import { buttonVariants } from '@/components/ui/button';
import { SitePage } from '@/app/pages/site-chrome';
import { applySeo } from '@/content/seo/use-seo';
import { POPULAR_TOOL_SLUGS, getToolPage } from '@/content/seo/seo-content.js';

/**
 * The 404.
 *
 * A dead end should still be a way forward, so the two real exits (the
 * workspace and the tool directory) come first and the popular tools follow.
 * It shares the out-of-shell chrome, which means the header and footer offer
 * the same routes as everywhere else on the site.
 */
export default function NotFound() {
  useEffect(() => {
    applySeo({
      title: 'Page not found — Toolbit',
      description: 'That page does not exist. Browse the Toolbit developer tools instead.',
      canonicalPath: '/',
    });
  }, []);

  const popular = POPULAR_TOOL_SLUGS.map((slug) => getToolPage(slug)).filter(
    (tool): tool is NonNullable<typeof tool> => Boolean(tool),
  );

  return (
    <SitePage>
      <div className="mx-auto w-full max-w-xl px-6 py-20 text-center">
        <span className="inline-grid size-11 place-items-center rounded-lg border border-line bg-brand-soft text-brand-ink">
          <AlertCircle size={20} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
        <p className="mt-3 text-base text-ink-muted">
          That URL does not match a Toolbit page. The workspace and the full tool directory are a
          click away.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/" className={buttonVariants()}>
            Open the workspace
          </Link>
          <Link href="/library" className={buttonVariants({ variant: 'secondary' })}>
            Browse all tools
          </Link>
        </div>

        <p className="wb-caps mt-12 mb-3">Popular tools</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {popular.map((tool) => (
            <li key={tool.slug}>
              <a
                href={`/${tool.slug}`}
                className="inline-block rounded-md border border-line px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                {tool.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </SitePage>
  );
}
