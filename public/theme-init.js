(() => {
  try {
    const stored = localStorage.getItem('mini-shop-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
    document.documentElement.dataset['theme'] = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    /* le service prendra le relais */
  }
})();
