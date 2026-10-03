import {
  IconBookmark,
  IconClock,
  IconHome,
  IconLayoutGrid,
  IconSettings,
} from '@tabler/icons-react';
import { useLocation } from 'wouter';
import logoMark from '@/shared/ds/assets/logo-mark.svg';
import { useWorkspace } from '@/shared/workspace-store';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { getSpec } from '@/features/tools/specs';
import { Button } from '@/components/ui/button';

const NAV: Array<{ path: string; label: string; icon: typeof IconHome }> = [
  { path: '/', label: 'Start', icon: IconHome },
  { path: '/library', label: 'Tools', icon: IconLayoutGrid },
  { path: '/saved', label: 'Saved', icon: IconBookmark },
  { path: '/history', label: 'History', icon: IconClock },
];

const PINS = ['json-formatter', 'base64-encoder', 'timestamp-converter'];

export function Sidebar({ onNavigate, open }: { onNavigate: () => void; open: boolean }) {
  const [path, navigate] = useLocation();
  const activeTabId = useWorkspace((s) => s.activeTabId);
  const tabs = useWorkspace((s) => s.tabs);
  const { activateExistingOrOpen } = useWorkbenchActions();
  const activeTool = tabs.find((t) => t.id === activeTabId)?.toolId;
  const onToolRoute = path !== '/' && !NAV.some((n) => n.path === path);

  const go = (target: string) => {
    navigate(target);
    onNavigate();
  };

  return (
    <aside className={`wb-sidebar${open ? ' mobile-open' : ''}`}>
      <Button
        type="button"
        variant="ghost"
        className="wb-brand justify-start h-auto"
        onClick={() => go('/')}
      >
        <img src={logoMark} alt="" width={36} height={36} />
        <span>
          tool<span>bit</span>
        </span>
      </Button>
      <nav aria-label="Main navigation">
        {NAV.map(({ path: target, label, icon: Icon }) => (
          <Button
            key={target}
            type="button"
            variant="ghost"
            className={`wb-nav-item justify-start h-auto${path === target ? ' selected' : ''}`}
            aria-current={path === target ? 'page' : undefined}
            onClick={() => go(target)}
          >
            <Icon size={25} stroke={1.7} />
            {label}
          </Button>
        ))}
      </nav>
      <section className="wb-pins" aria-label="Pinned tools">
        <p>Pinned tools</p>
        {PINS.map((id) => {
          const tool = getSpec(id);
          if (!tool) return null;
          const ToolIcon = tool.icon;
          const selected = onToolRoute && activeTool === id;
          return (
            <Button
              key={id}
              type="button"
              variant="ghost"
              className={`wb-nav-item justify-start h-auto${selected ? ' selected' : ''}`}
              onClick={() => {
                activateExistingOrOpen(id);
                onNavigate();
              }}
            >
              <ToolIcon size={26} stroke={1.7} />
              {tool.title}
            </Button>
          );
        })}
      </section>
      <Button
        type="button"
        variant="ghost"
        className={`wb-nav-item wb-settings-nav justify-start h-auto${path === '/settings' ? ' selected' : ''}`}
        onClick={() => go('/settings')}
      >
        <IconSettings size={25} stroke={1.7} />
        Settings
      </Button>
    </aside>
  );
}
