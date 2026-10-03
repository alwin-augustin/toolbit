import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { IconCheck } from '@tabler/icons-react';
import { Sidebar } from '@/app/shell/Sidebar';
import { Topbar } from '@/app/shell/Topbar';
import { SearchDialog } from '@/app/shell/SearchDialog';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { applyTheme } from '@/shared/theme';
import { Button } from '@/components/ui/button';

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const toast = useWorkbenchMemory((s) => s.toast);
  const clearToast = useWorkbenchMemory((s) => s.clearToast);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 3200);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileNav(false);
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch]);

  // Re-apply the saved theme on mount (theme-init.js already did this
  // pre-paint; this covers environments without it, like tests).
  useLayoutEffect(() => {
    applyTheme();
  }, []);

  useEffect(() => {
    if (mobileNav)
      (document.querySelector('.wb-sidebar nav button') as HTMLElement | null)?.focus();
  }, [mobileNav]);

  return (
    <div className="wb-shell">
      <a className="wb-skip-link" href="#wb-main">
        Skip to workspace
      </a>
      {mobileNav && (
        <Button
          type="button"
          variant="ghost"
          className="wb-nav-backdrop p-0 border-0 rounded-none"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <Sidebar open={mobileNav} onNavigate={() => setMobileNav(false)} />
      <div className="wb-main-shell" inert={mobileNav || undefined}>
        <Topbar onSearch={openSearch} onMenu={() => setMobileNav(true)} />
        {children}
      </div>
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
      <div className={`wb-toast${toast ? ' visible' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <IconCheck size={20} />
            {toast}
          </>
        )}
      </div>
    </div>
  );
}
