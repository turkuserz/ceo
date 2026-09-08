(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let navigating = false;
  const prefetched = new Set();

  root.classList.add('page-ready');

  const warm = (url) => {
    if (prefetched.has(url)) return;
    prefetched.add(url);
    fetch(url, { credentials: 'same-origin', cache: 'force-cache' }).catch(() => {});
  };

  document.addEventListener('pointerover', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return;
    try {
      const url = new URL(raw, location.href);
      if (url.origin === location.origin && url.href !== location.href) warm(url.href);
    } catch (_) {}
  }, { passive: true });

  // Replace the document without recreating the YouTube iframe.
  // This is what prevents the music from restarting/stuttering on every page.
  const navigate = async (url, push = true) => {
    if (navigating) return;
    navigating = true;

    try {
      const response = await fetch(url.href, {
        credentials: 'same-origin',
        cache: 'force-cache',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!response.ok) throw new Error('Navigation failed');

      const html = await response.text();
      const parser = new DOMParser();
      const next = parser.parseFromString(html, 'text/html');

      // Keep the current YouTube player nodes alive.
      const dock = document.getElementById('bastienMusicDock');
      const frame = document.getElementById('bastienMusicFrame');

      if (!reduceMotion) {
        root.classList.remove('page-ready');
        root.classList.add('page-leaving');
        await new Promise(r => setTimeout(r, 120));
      }

      // Replace body content while excluding the persistent music nodes.
      const currentKeep = [dock, frame].filter(Boolean);
      document.body.replaceChildren(...Array.from(next.body.children).filter(el =>
        el.id !== 'bastienMusicDock' && el.id !== 'bastienMusicFrame'
      ));

      currentKeep.forEach(el => document.body.appendChild(el));

      // Update title.
      document.title = next.title?.textContent || document.title;

      // Replace page-specific inline styles, while keeping global stylesheet links.
      const oldPageStyles = [...document.head.querySelectorAll('style[data-page-style]')];
      oldPageStyles.forEach(s => s.remove());

      [...next.head.querySelectorAll('style')].forEach((style, i) => {
        const copy = document.createElement('style');
        copy.dataset.pageStyle = '1';
        copy.textContent = style.textContent;
        document.head.appendChild(copy);
      });

      // Re-run the target page's inline scripts. Music/transition scripts are skipped.
      for (const oldScript of [...document.scripts]) {
        if (!oldScript.src && oldScript !== document.currentScript) {
          // Only scripts that belong to the newly loaded page will be inserted below.
        }
      }

      const scripts = [...next.body.querySelectorAll('script')];
      for (const script of scripts) {
        const src = script.getAttribute('src') || '';
        if (src.includes('/js/music.js') || src.includes('/js/transition.js')) continue;

        const s = document.createElement('script');
        [...script.attributes].forEach(attr => s.setAttribute(attr.name, attr.value));
        s.textContent = script.textContent;
        document.body.appendChild(s);
      }

      if (push) history.pushState({ spa: true }, '', url.href);

      window.scrollTo({ top: 0, behavior: 'instant' });
      root.classList.remove('page-leaving');
      requestAnimationFrame(() => root.classList.add('page-ready'));
    } catch (err) {
      console.warn('BASTIEN SPA navigation fallback:', err);
      location.assign(url.href);
      return;
    } finally {
      navigating = false;
    }
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return;

    let url;
    try { url = new URL(raw, location.href); } catch (_) { return; }
    if (url.origin !== location.origin || url.href === location.href) return;

    event.preventDefault();
    navigate(url, true);
  }, { passive: false });

  window.addEventListener('popstate', () => {
    navigate(new URL(location.href), false);
  });

  window.addEventListener('pageshow', () => {
    navigating = false;
    root.classList.remove('page-leaving');
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('page-ready')));
  });
})();
