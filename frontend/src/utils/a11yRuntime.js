// App-wide runtime helpers: modal focus management, theme-color sync, service worker.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function topModal() {
  const all = document.querySelectorAll('[aria-modal="true"]');
  return all.length ? all[all.length - 1] : null;
}

// Focus trap + Escape + focus restore for every [aria-modal="true"] dialog
export function installModalA11y() {
  const stack = []; // { el, prevFocus }

  const sync = () => {
    // closed dialogs: restore focus
    while (stack.length && !document.body.contains(stack[stack.length - 1].el)) {
      const { prevFocus } = stack.pop();
      if (prevFocus && document.body.contains(prevFocus)) prevFocus.focus();
    }
    // new dialog: move focus inside
    const el = topModal();
    if (el && (!stack.length || stack[stack.length - 1].el !== el)) {
      stack.push({ el, prevFocus: document.activeElement });
      if (!el.contains(document.activeElement)) {
        // Focus the dialog itself (not an input) so mobile keyboards don't pop up
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.style.outline = el.style.outline || 'none';
        el.focus({ preventScroll: true });
      }
    }
  };

  if (typeof MutationObserver !== 'undefined' && document.body) {
    new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('keydown', (e) => {
    const el = topModal();
    if (!el) return;
    if (e.key === 'Escape') {
      const closer = el.querySelector('[aria-label^="Cerrar"], [aria-label^="Volver"], [data-dialog-close]');
      if (closer) { e.preventDefault(); closer.click(); }
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...el.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

// Keep the browser chrome color in sync with the active theme
export function installThemeColorSync() {
  const apply = () => {
    if (typeof getComputedStyle === 'undefined' || !document?.documentElement) return;
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas')?.trim?.();
    if (!bg) return;
    document.querySelectorAll?.('meta[name="theme-color"]')?.forEach?.(m => {
      m.removeAttribute('media');
      m.setAttribute('content', bg);
    });
  };
  if (typeof MutationObserver !== 'undefined' && document?.documentElement) {
    new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  if (document?.documentElement?.hasAttribute?.('data-theme')) apply();
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
  });
}
