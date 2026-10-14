import {
  IconChartDots,
  IconChevronRight,
  IconLayoutSidebar,
  IconMenu2,
  IconSearch,
  IconShieldLock,
} from '@tabler/icons-react';
import { TOOL_BY_PATH, type Section } from '@/app/shell/navigation';
import { RESEARCH_CATEGORIES } from '@/content/tools.config';
import { usePreferences } from '@/core/preferences';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';

const SECTION_LABELS: Record<Section, string> = {
  home: 'Home',
  tools: 'Tools',
  saved: 'Saved',
  history: 'History',
  settings: 'Settings',
};

/**
 * Context strip. It answers two questions and then gets out of the way: where
 * am I, and what global actions exist. Everything tool-specific lives in the
 * tool's own header, so this bar never competes with the work.
 *
 * The strip also carries the two privacy controls, because they are the two
 * facts a developer wants to confirm at a glance from any screen: nothing is
 * uploaded, and analytics can be switched off without leaving the work.
 */
export function Topbar({
  section,
  path,
  panelOpen,
  onSearch,
  onTogglePanel,
  onOpenNavigation,
}: {
  section: Section;
  path: string;
  panelOpen: boolean;
  onSearch: () => void;
  onTogglePanel: () => void;
  onOpenNavigation: () => void;
}) {
  const tool = TOOL_BY_PATH.get(path);
  const category = tool ? RESEARCH_CATEGORIES[tool.researchCategory].name : null;
  const analytics = usePreferences((s) => s.analytics);
  const update = usePreferences((s) => s.update);
  const notify = useWorkbenchMemory((s) => s.notify);

  const toggleAnalytics = () => {
    const next = !analytics;
    update({ analytics: next });
    notify(
      next
        ? 'Analytics on. Anonymous usage events only — never tool input or output.'
        : 'Analytics off. Nothing is collected from this device.',
    );
  };

  return (
    <header className="wb-topbar">
      {/* Below 1024px the navigator is a drawer and the hamburger owns it. */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={onOpenNavigation}
      >
        <IconMenu2 size={16} />
      </Button>

      {/* The panel toggle sits beside the panel it controls, and only while
          that panel is hidden — open, the panel's own header carries the
          collapse button, so there is never a second control doing the same
          job on the other side of the bar. */}
      {!panelOpen && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hidden lg:inline-flex"
          aria-label="Show navigator"
          aria-pressed={false}
          title="Show navigator (⌘B)"
          onClick={onTogglePanel}
        >
          <IconLayoutSidebar size={16} />
        </Button>
      )}

      <nav aria-label="Breadcrumb" className="wb-crumbs">
        <span className="shrink-0">{SECTION_LABELS[section]}</span>
        {tool && category && (
          <>
            <IconChevronRight size={12} aria-hidden="true" className="wb-crumbs-sep" />
            <span className="shrink-0">{category}</span>
            <IconChevronRight size={12} aria-hidden="true" className="wb-crumbs-sep" />
          </>
        )}
        {tool && <span className="wb-crumbs-current truncate">{tool.name}</span>}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <span
          className="hidden items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-2xs text-ink-muted sm:inline-flex"
          title="Every transform runs in this browser tab. Nothing is uploaded."
        >
          <IconShieldLock size={11} aria-hidden="true" />
          Local only
        </span>

        {/* The consent control, one click from anywhere. It writes the same
            preference the Settings switch does, so the two can never disagree.
            Pressed means analytics is collecting. */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={
            analytics
              ? 'gap-1.5 bg-state-selected text-state-selected-ink'
              : 'gap-1.5 text-ink-faint'
          }
          aria-pressed={analytics}
          aria-label={`Product analytics is ${analytics ? 'on' : 'off'}. ${
            analytics ? 'Turn it off' : 'Turn it on'
          }.`}
          title={
            analytics
              ? 'Product analytics is on: anonymous usage events only, never tool input or output. Click to turn it off.'
              : 'Product analytics is off. Nothing is collected from this device.'
          }
          onClick={toggleAnalytics}
        >
          <IconChartDots size={14} />
          <span className="hidden md:inline">Analytics</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 text-ink-muted"
          onClick={onSearch}
          aria-label="Search tools or actions..."
        >
          <IconSearch size={14} />
          <span className="hidden md:inline">Search</span>
          <span className="ml-1 hidden items-center gap-0.5 md:inline-flex">
            <Kbd className="h-4 min-w-4 text-2xs">⌘</Kbd>
            <Kbd className="h-4 min-w-4 text-2xs">K</Kbd>
          </span>
        </Button>
      </div>
    </header>
  );
}
