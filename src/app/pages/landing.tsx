import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  IconArrowRight,
  IconBolt,
  IconCircleCheck,
  IconKeyboard,
  IconShieldLock,
  IconWifiOff,
} from '@tabler/icons-react';
import { detectContentType } from '@/core/smart-detect';
import { RESEARCH_CATEGORIES, TOOLS } from '@/content/tools.config';
import { CATEGORY_ICONS, CATEGORY_ORDER, TOOLS_BY_CATEGORY } from '@/app/shell/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { InstallApp } from '@/app/components/InstallApp';
import { SitePage } from '@/app/pages/site-chrome';
import { applySeo } from '@/content/seo/use-seo';
import { TOOL_PAGES } from '@/content/seo/seo-content.js';

/**
 * The About page.
 *
 * It is a public page, but the argument it makes is the product's own: the
 * fastest way to understand a tool workbench is to use it, so the hero is a
 * working paste field wired to the same detector the app uses. The taxonomy
 * comes from `content/tools.config` through the navigation model rather than
 * being restated here, so it can never disagree with what the app ships.
 */

const WHY = [
  {
    icon: IconShieldLock,
    title: 'Nothing is uploaded',
    body: 'Formatting, decoding, hashing and conversion run in this tab. There is no analytics and no tracking — nothing you paste leaves the device.',
  },
  {
    icon: IconWifiOff,
    title: 'Works offline',
    body: 'Install it and the local tools keep working from the cache. Only the API Request Builder and WebSocket Tester need a network, and only the endpoint you run.',
  },
  {
    icon: IconKeyboard,
    title: 'Keyboard first',
    body: 'One palette for every tool and action, documents you can jump between, and Settings lists every shortcut the app implements.',
  },
  {
    icon: IconCircleCheck,
    title: 'No account, no sync',
    body: 'There is no sign-up and no cloud history. Workspace structure is remembered on this device; payloads are session-only by design.',
  },
];

const SAMPLES = ['{"name":"toolbit","version":"2.0"}', '1707307200', '*/5 * * * *'] as const;

export function LandingPage() {
  const [demoInput, setDemoInput] = useState('');
  const suggestions = useMemo(() => detectContentType(demoInput), [demoInput]);

  useEffect(() => {
    applySeo({
      title: 'About Toolbit — local-first developer tools',
      description:
        'Toolbit is a local-first developer workspace for formatting, transforming, inspecting and generating code and data without sending it to a server.',
      canonicalPath: '/about',
    });
  }, []);

  const openSuggestion = (path: string) => {
    if (demoInput.trim()) sessionStorage.setItem('toolbit:smart-paste', demoInput);
    return path;
  };

  const categories = CATEGORY_ORDER.map((category) => ({
    id: category,
    ...RESEARCH_CATEGORIES[category],
    Icon: CATEGORY_ICONS[category],
    tools: TOOLS_BY_CATEGORY.get(category) ?? [],
  })).filter((category) => category.tools.length > 0);

  return (
    <SitePage>
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* Hero ------------------------------------------------------------ */}
        <section className="grid items-start gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Every small developer task, in one tab.
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink-muted">
              {TOOLS.length} utilities for the work that interrupts the work: a payload that needs
              to make sense, a token to inspect, a cron expression to check. Paste it and Toolbit
              opens the tool that handles it.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Link href="/" className={buttonVariants({ size: 'lg', className: 'gap-2' })}>
                Open the workspace
                <IconArrowRight size={16} aria-hidden="true" />
              </Link>
              <InstallApp />
            </div>
            <p className="mt-5 flex items-center gap-1.5 text-xs text-ink-faint">
              <IconBolt size={13} aria-hidden="true" />
              No sign-up. Nothing you paste leaves this browser.
            </p>
          </div>

          {/* The product's own paste field, wired to the real detector. */}
          <div className="rounded-xl border border-line bg-surface shadow-xs">
            <label className="wb-caps block px-4 pt-3.5" htmlFor="landing-demo">
              Try it here
            </label>
            <textarea
              id="landing-demo"
              aria-label="Paste data to find a tool"
              value={demoInput}
              onChange={(event) => setDemoInput(event.target.value)}
              placeholder="Paste JSON, a JWT, a timestamp, cron, SQL, a diff…"
              rows={5}
              spellCheck={false}
              className="block w-full resize-y bg-transparent px-4 py-3 font-mono text-sm text-ink outline-none placeholder:font-sans placeholder:text-ink-faint"
            />
            <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-3 py-2">
              {demoInput ? (
                suggestions.length > 0 ? (
                  <>
                    <span className="text-xs text-ink-faint">{suggestions[0].reason}:</span>
                    {suggestions.map((suggestion) => (
                      <Link
                        key={suggestion.toolId}
                        href={openSuggestion(suggestion.path)}
                        className={buttonVariants({ size: 'sm', className: 'gap-1.5' })}
                        onClick={() => sessionStorage.setItem('toolbit:smart-paste', demoInput)}
                      >
                        Open {suggestion.toolName}
                        <IconArrowRight size={14} aria-hidden="true" />
                      </Link>
                    ))}
                  </>
                ) : (
                  <span className="text-xs text-ink-faint">
                    Nothing recognised yet. Keep typing, or{' '}
                    <Link href="/" className="text-brand-ink hover:underline">
                      search all {TOOLS.length} tools
                    </Link>
                    .
                  </span>
                )
              ) : (
                <>
                  <span className="text-xs text-ink-faint">Try:</span>
                  {SAMPLES.map((sample, index) => (
                    <Button
                      key={sample}
                      size="sm"
                      variant="outline"
                      onClick={() => setDemoInput(sample)}
                    >
                      {['JSON', 'Timestamp', 'Cron'][index]}
                    </Button>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Why it is built this way --------------------------------------- */}
        <section aria-labelledby="landing-why" className="border-t border-line py-12">
          <h2 id="landing-why" className="text-xl font-semibold tracking-tight text-ink">
            Four commitments
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item) => (
              <div key={item.title}>
                <item.icon size={18} aria-hidden="true" className="text-ink-faint" />
                <h3 className="mt-2.5 text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The catalogue, grouped exactly as the app groups it ------------- */}
        <section aria-labelledby="landing-catalogue" className="border-t border-line py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="landing-catalogue" className="text-xl font-semibold tracking-tight text-ink">
                The {TOOLS.length} tools, by what they work on
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                The same nine categories the workspace uses, so browsing here and browsing there are
                the same mental model.
              </p>
            </div>
            {/* The in-app directory: `/tools` is a prerendered file with no
                route in the SPA, so a client-side link to it would 404. */}
            <Link href="/library" className="text-sm text-brand-ink hover:underline">
              Browse the full directory
            </Link>
          </div>

          <div className="mt-6 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.tools[0]?.path ?? '/'}
                className="rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-state-hover"
              >
                <div className="flex items-center gap-2">
                  <category.Icon size={15} aria-hidden="true" className="shrink-0 text-ink-faint" />
                  <span className="text-sm font-medium text-ink">{category.name}</span>
                  <span className="tb-tnum ml-auto text-2xs text-ink-faint">
                    {category.tools.length}
                  </span>
                </div>
                <p className="mt-2 truncate text-xs text-ink-muted">
                  {category.tools
                    .slice(0, 3)
                    .map((tool) => tool.name)
                    .join(' · ')}
                  {category.tools.length > 3 ? ' …' : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Tool index — plain anchors so crawlers reach the prerendered
            per-tool pages, which is how these pages get found at all. */}
        <section aria-labelledby="landing-index" className="border-t border-line py-12">
          <h2 id="landing-index" className="text-xl font-semibold tracking-tight text-ink">
            One page per tool
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            {TOOL_PAGES.length} utilities, each with its own page explaining what it does and when
            to reach for it.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-2 gap-y-1.5">
            {TOOL_PAGES.map((tool) => (
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
        </section>

        {/* Close ----------------------------------------------------------- */}
        <section className="border-t border-line py-12">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            Start with whatever is in your clipboard
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            The workspace opens on a paste field. Put the payload there and let it decide which tool
            you wanted.
          </p>
          <Link href="/" className={buttonVariants({ size: 'lg', className: 'mt-5 gap-2' })}>
            Open the workspace
            <IconArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </SitePage>
  );
}
