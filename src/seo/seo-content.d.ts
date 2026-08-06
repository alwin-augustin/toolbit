/** Type declarations for the plain-ESM SEO content module. */

export interface FaqEntry {
    q: string;
    a: string;
}

export interface ContentSection {
    h2: string;
    body: string;
}

export interface SiteConfig {
    url: string;
    name: string;
    title: string;
    description: string;
    shortDescription: string;
    ogImage: string;
    logo: string;
    github: string;
    downloads: string;
    locale: string;
}

export interface CategoryGroup {
    id: string;
    heading: string;
    blurb: string;
}

export interface ToolPage {
    slug: string;
    name: string;
    category: string;
    title: string;
    description: string;
    h1: string;
    lede: string;
    bullets: string[];
    howTo: string[];
    faq: FaqEntry[];
    keywords: string[];
    related: string[];
}

export interface ComparisonPage {
    slug: string;
    title: string;
    description: string;
    h1: string;
    competitor: string;
    lede: string;
    sections: ContentSection[];
    faq: FaqEntry[];
}

export interface GuidePage {
    slug: string;
    title: string;
    description: string;
    h1: string;
    lede: string;
    sections: ContentSection[];
    faq: FaqEntry[];
    toolHighlights: string[];
}

export interface WhyEntry {
    title: string;
    body: string;
}

export declare const SITE: SiteConfig;
export declare const CATEGORY_GROUPS: CategoryGroup[];
export declare const TOOL_PAGES: ToolPage[];
export declare const SITE_FAQ: FaqEntry[];
export declare const WHY_TOOLBIT: WhyEntry[];
export declare const COMPARISON_PAGES: ComparisonPage[];
export declare const GUIDE_PAGES: GuidePage[];
export declare const POPULAR_TOOL_SLUGS: string[];

export declare function getToolPage(slug: string): ToolPage | undefined;
export declare function getToolPagesByCategory(categoryId: string): ToolPage[];
export declare function absoluteUrl(pathname?: string): string;
export declare function toolPageUrl(slug: string): string;
export declare function toolAppUrl(slug: string): string;
