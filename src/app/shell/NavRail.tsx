import { IconMoon, IconSun } from '@tabler/icons-react';
import { useLocation } from 'wouter';
import logoMark from '@/shared/ds/assets/logo-mark.svg';
import { setTheme, useResolvedTheme } from '@/shared/theme';
import { DESTINATIONS, SETTINGS_DESTINATION, type Section } from '@/app/shell/navigation';

/**
 * The rail is the one piece of chrome that never moves. It carries the four
 * destinations plus app-level controls, so the workspace keeps a stable spine
 * at every breakpoint and the context panel can collapse without stranding
 * the user.
 */
export function NavRail({
  section,
  onNavigate,
  onRevealPanel,
}: {
  section: Section;
  onNavigate: () => void;
  /** Called when a rail item belonging to the open panel is activated again. */
  onRevealPanel: () => void;
}) {
  const [, navigate] = useLocation();
  const resolved = useResolvedTheme();

  const go = (href: string, id: Section) => {
    navigate(href);
    // Activating the current destination re-opens the panel: the rail doubles
    // as the panel toggle, which is what people expect from this pattern.
    if (section === id) onRevealPanel();
    onNavigate();
  };

  return (
    <nav className="wb-rail" aria-label="Primary">
      <button
        type="button"
        className="grid size-9 place-items-center rounded-md transition-colors hover:bg-state-hover"
        aria-label="Toolbit home"
        data-tip="Toolbit"
        onClick={() => go('/', 'home')}
      >
        <img src={logoMark} alt="" className="size-6" />
      </button>

      <div className="wb-rail-divider" />

      {DESTINATIONS.map((destination) => {
        const Icon = destination.icon;
        const current = section === destination.id;
        return (
          <button
            key={destination.id}
            type="button"
            className="wb-rail-item"
            aria-current={current ? 'page' : undefined}
            aria-label={destination.label}
            data-tip={destination.label}
            onClick={() => go(destination.href, destination.id)}
          >
            <Icon size={19} />
          </button>
        );
      })}

      <div className="mt-auto" />

      <button
        type="button"
        className="wb-rail-item"
        aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        data-tip={resolved === 'dark' ? 'Light theme' : 'Dark theme'}
        onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
      >
        {resolved === 'dark' ? <IconSun size={19} /> : <IconMoon size={19} />}
      </button>

      <button
        type="button"
        className="wb-rail-item"
        aria-current={section === 'settings' ? 'page' : undefined}
        aria-label={SETTINGS_DESTINATION.label}
        data-tip={SETTINGS_DESTINATION.label}
        onClick={() => go(SETTINGS_DESTINATION.href, 'settings')}
      >
        <SETTINGS_DESTINATION.icon size={19} />
      </button>
    </nav>
  );
}
