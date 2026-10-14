import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { IconBrandGithub, IconShieldLock } from '@tabler/icons-react';
import { buttonVariants } from '@/components/ui/button';
import logoMark from '@/shared/ds/assets/logo-mark.svg';

/**
 * Chrome for the pages that live outside the workbench shell.
 *
 * The marketing, legal and not-found pages are the only surfaces that do not
 * sit inside the rail-and-navigator frame, so they carry their own header and
 * footer. This module is the single definition of both — three pages used to
 * hand-roll their own, which is how they drifted apart.
 *
 * Rules: hairlines instead of shadows, tokens instead of palette colours, one
 * primary action, and no decoration that does not carry information.
 */

/* `/library` is the app's own tool directory, so it is also the destination
   that works from a client-side navigation. The crawlable `/tools` page is a
   prerendered file with no route in the SPA; linking to it here would land on
   the 404. */
const NAV = [
  { href: '/library', label: 'All tools' },
  { href: '/about', label: 'About' },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-sticky border-b border-line bg-canvas">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-5 px-6 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <img src={logoMark} alt="" className="size-6" />
          <span className="text-base font-semibold tracking-tight text-ink">Toolbit</span>
        </Link>

        <nav aria-label="Site" className="ml-auto flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-state-hover hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://github.com/alwin-augustin/toolbit"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-state-hover hover:text-ink"
          >
            <IconBrandGithub
              size={16}
              aria-hidden="true"
              className="inline-block align-text-bottom"
            />
            <span className="sr-only">Toolbit on GitHub (opens in a new tab)</span>
          </a>
          {/* A link that navigates stays a link and borrows the button's look,
              rather than becoming a button that lies about its role. */}
          <Link href="/" className={buttonVariants({ size: 'sm', className: 'ml-1.5' })}>
            Open workspace
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-xs text-ink-faint">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/library" className="hover:text-ink">
            All tools
          </Link>
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <a
            href="https://github.com/alwin-augustin/toolbit"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink"
          >
            GitHub
          </a>
          <a
            href="https://github.com/alwin-augustin/toolbit/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink"
          >
            Feedback
          </a>
        </div>
        <p className="flex items-center gap-1.5">
          <IconShieldLock size={12} aria-hidden="true" />
          Every transform runs in this browser tab. Your inputs are never uploaded.
        </p>
      </div>
    </footer>
  );
}

/** Page frame for an out-of-shell page: header, one column of content, footer. */
export function SitePage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteHeader />
      <main id="wb-main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
