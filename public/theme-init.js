/* global document, localStorage */
// Initialize theme before app loads
(function () {
  try {
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'light');
    }
    var theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  } catch {
    document.documentElement.classList.add('light');
  }
})();
