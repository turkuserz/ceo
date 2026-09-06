(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let navigating = false;

  root.classList.add('page-ready');

  // Warm the next local document while the user is hovering a navigation link.
  const prefetched = new Set();
  const warm = (url) => {
    if (prefetched.has(url) || url.startsWith('#')) return;
    prefetched.add(url);
    fetch(url, { credentials: 'same-origin', cache: 'force-cache' }).catch(() => {});
  };

  document.addEventListener('pointerover', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const raw = link.getAttribute('href');
    if (!raw) return;
    try {
      const url = new URL(raw, location.href);
      if (url.origin === location.origin) warm(url.href);
    } catch {}
  }, { passive: true });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || navigating) return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return;

    let url;
    try { url = new URL(raw, location.href); } catch { return; }
    if (url.origin !== location.origin || url.href === location.href) return;

    event.preventDefault();
    navigating = true;

    if (reduceMotion) {
      location.assign(url.href);
      return;
    }

    root.classList.remove('page-ready');
    root.classList.add('page-leaving');
    window.setTimeout(() => location.assign(url.href), 90);
  }, { passive: false });

  window.addEventListener('pageshow', () => {
    navigating = false;
    root.classList.remove('page-leaving');
    root.classList.add('page-ready');
  });
})();
