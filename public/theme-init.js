// Initialize theme before app loads. Dependency-free by design: this runs
// before the bundle. Reads the same localStorage key owned by
// src/shared/theme.ts. Unset means "system" (follow the OS scheme).
(function () {
  function systemIsDark() {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }
  function apply(resolved) {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.classList.toggle('light', resolved === 'light');
    try {
      document.documentElement.style.colorScheme = resolved;
    } catch {
      /* ignore */
    }
  }
  try {
    var stored = window.localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'system';
    apply(theme === 'system' ? (systemIsDark() ? 'dark' : 'light') : theme);
  } catch {
    apply('light');
  }
})();
