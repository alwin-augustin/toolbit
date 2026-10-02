import { useEffect } from 'react';
import { useLocation } from 'wouter';

import { SITE, absoluteUrl, getToolPage } from '@/seo/seo-content.js';

export interface SeoDescriptor {
  title: string;
  description: string;
  /** Site-relative path the search engine should treat as the indexable URL. */
  canonicalPath: string;
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

/**
 * Applies a page's metadata to the document head.
 *
 * The app is client-rendered, so without this every route would keep the
 * homepage's title and description — which is what stops individual tools from
 * ranking for their own search terms.
 */
export function applySeo({ title, description, canonicalPath }: SeoDescriptor) {
  if (typeof document === 'undefined') return;

  const url = absoluteUrl(canonicalPath);

  document.title = title;
  setMeta('meta[name="title"]', 'name', 'title', title);
  setMeta('meta[name="description"]', 'name', 'description', description);
  setCanonical(url);

  setMeta('meta[property="og:title"]', 'property', 'og:title', title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', description);
  setMeta('meta[property="og:url"]', 'property', 'og:url', url);

  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMeta('meta[name="twitter:url"]', 'name', 'twitter:url', url);
}

/** Resolves the metadata for an in-app route. */
export function seoForLocation(location: string): SeoDescriptor {
  const match = location.match(/^\/([^/?#]+)/);
  const tool = match ? getToolPage(match[1]) : undefined;

  if (tool) {
    return {
      title: tool.title,
      description: tool.description,
      canonicalPath: `/${tool.slug}`,
    };
  }

  return {
    title: SITE.title,
    description: SITE.description,
    canonicalPath: '/',
  };
}

/** Keeps the document head in sync with the active workspace route. */
export function useRouteSeo() {
  const [location] = useLocation();

  useEffect(() => {
    applySeo(seoForLocation(location));
  }, [location]);
}
