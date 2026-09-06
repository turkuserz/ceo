(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let navigating = false;

  root.classList.add('page-ready');

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || navigating) return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return;

    let url;
    try { url = new URL(raw, window.location.href); } catch { return; }
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;

    event.preventDefault();
    navigating = true;

    if (reduceMotion) {
      window.location.assign(url.href);
      return;
    }

    root.classList.add('page-leaving');
    window.setTimeout(() => window.location.assign(url.href), 110);
  }, { passive: false });

  window.addEventListener('pageshow', () => {
    navigating = false;
    root.classList.remove('page-leaving');
    root.classList.add('page-ready');
  });
})();
