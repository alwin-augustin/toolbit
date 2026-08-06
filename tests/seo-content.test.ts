import { describe, it, expect } from 'vitest';

import { TOOLS } from '@/config/tools.config';
import {
    SITE,
    TOOL_PAGES,
    CATEGORY_GROUPS,
    COMPARISON_PAGES,
    GUIDE_PAGES,
    POPULAR_TOOL_SLUGS,
    getToolPage,
} from '@/seo/seo-content.js';
import { seoForLocation } from '@/seo/use-seo';

const slugs = new Set(TOOL_PAGES.map((tool) => tool.slug));

describe('SEO content', () => {
    it('covers every registered tool exactly once', () => {
        const toolIds = TOOLS.map((tool) => tool.id).sort();
        expect([...slugs].sort()).toEqual(toolIds);
        expect(TOOL_PAGES).toHaveLength(TOOLS.length);
    });

    it('uses a category that the directory renders', () => {
        const known = new Set(CATEGORY_GROUPS.map((group) => group.id));
        for (const tool of TOOL_PAGES) {
            expect(known, `${tool.slug} has an unrenderable category`).toContain(tool.category);
        }
    });

    it('only cross-links tools that exist', () => {
        for (const tool of TOOL_PAGES) {
            for (const related of tool.related) {
                expect(slugs, `${tool.slug} links to a missing tool`).toContain(related);
            }
            expect(tool.related).not.toContain(tool.slug);
        }
        for (const slug of POPULAR_TOOL_SLUGS) {
            expect(slugs).toContain(slug);
        }
        for (const guide of GUIDE_PAGES) {
            for (const slug of guide.toolHighlights) {
                expect(slugs, `${guide.slug} highlights a missing tool`).toContain(slug);
            }
        }
    });

    it('gives every page unique, length-appropriate metadata', () => {
        const pages = [...TOOL_PAGES, ...COMPARISON_PAGES, ...GUIDE_PAGES];
        const titles = new Set<string>();
        const descriptions = new Set<string>();

        for (const page of pages) {
            expect(titles, `duplicate title: ${page.title}`).not.toContain(page.title);
            expect(descriptions, `duplicate description on ${page.title}`).not.toContain(page.description);
            titles.add(page.title);
            descriptions.add(page.description);

            expect(page.title.length).toBeLessThanOrEqual(70);
            expect(page.description.length).toBeGreaterThanOrEqual(70);
            expect(page.description.length).toBeLessThanOrEqual(200);
        }
    });

    it('points canonical URLs at the production domain', () => {
        expect(SITE.url).toBe('https://toolbit.app');
        expect(JSON.stringify({ SITE, TOOL_PAGES })).not.toContain('pages.dev');
    });
});

describe('seoForLocation', () => {
    it('canonicalises an app route to its static tool page', () => {
        const seo = seoForLocation('/app/json-formatter');
        expect(seo.canonicalPath).toBe('/tools/json-formatter');
        expect(seo.title).toBe(getToolPage('json-formatter')?.title);
    });

    it('falls back to the site defaults for unknown routes', () => {
        expect(seoForLocation('/app/not-a-tool').canonicalPath).toBe('/');
        expect(seoForLocation('/').title).toBe(SITE.title);
    });
});
