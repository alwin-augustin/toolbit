import { Link } from 'wouter';
import type { ReactNode } from 'react';

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
