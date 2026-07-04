(() => {
  if (window.__clientsurgePublicRouteExposureGuard) return;
  window.__clientsurgePublicRouteExposureGuard = true;

  const pathname = window.location?.pathname || "/";

  // /client-portal is intentionally public at the shell level: unauthenticated users
  // must see the login/access screen instead of a blank page. Treating it as an
  // internal route made the DOM sanitizer too aggressive on the portal entry page.
  const isClientPortalEntry = /^\/client-portal\/?$/i.test(pathname);

  const INTERNAL_PATH_PATTERN = isClientPortalEntry
    ? /^\/(admin|dashboard|client|client-dashboard|setup|functions|function|internal|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|$)/i
    : /^\/(admin|dashboard|client|client-portal|client-dashboard|setup|functions|function|internal|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|$)/i;

  const INTERNAL_TEXT_PATTERN = /\b(Admin Dashboard|Business Setup|Client Dashboard|Function Audit|System Observability|Reconciliation|Onboarding Pipeline|Install Guide|Mission Control|SaaS Admin|AI Status Dashboard|Performance Wars|Admin Settings|Lead Intelligence|Credentials Setup|Website Preview|Automation Health|Opportunity Review Queue)\b/i;
  const GENERATED_COPY_PATTERN = /ClientSurge Systems manages \d+ data types|organize, track, and share your work in 1 place|including launch gates/i;

  function normalizedText(node) {
    return (node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function hasInternalRouteLink(root) {
    return Array.from(root.querySelectorAll?.('a[href]') || []).some((anchor) => {
      try {
        const url = new URL(anchor.getAttribute('href'), window.location.origin);
        return INTERNAL_PATH_PATTERN.test(url.pathname);
      } catch {
        return false;
      }
    });
  }

  function looksLikeGeneratedPagesDirectory(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    const text = normalizedText(node);
    if (!text) return false;

    const hasPagesHeading = Array.from(node.querySelectorAll?.('h1,h2,h3,h4,p,span,div') || []).some((child) => {
      return normalizedText(child).toLowerCase() === 'pages';
    });

    return (
      (hasPagesHeading && (hasInternalRouteLink(node) || INTERNAL_TEXT_PATTERN.test(text) || GENERATED_COPY_PATTERN.test(text))) ||
      (hasInternalRouteLink(node) && (INTERNAL_TEXT_PATTERN.test(text) || GENERATED_COPY_PATTERN.test(text)))
    );
  }

  function removeGeneratedPagesDirectory() {
    const candidates = Array.from(document.querySelectorAll('section,aside,nav,main > div,div'));
    for (const candidate of candidates) {
      if (!looksLikeGeneratedPagesDirectory(candidate)) continue;
      candidate.setAttribute('data-clientsurge-route-exposure-removed', 'true');
      candidate.remove();
    }
  }

  function removeLooseGeneratedPagesDirectory() {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
    for (const heading of headings) {
      if (normalizedText(heading).toLowerCase() !== 'pages') continue;

      const list = heading.nextElementSibling;
      const blockText = normalizedText(list);
      if (!list || !/^(UL|OL|DIV|NAV|SECTION)$/i.test(list.tagName)) continue;
      if (!INTERNAL_TEXT_PATTERN.test(blockText) && !hasInternalRouteLink(list)) continue;

      heading.setAttribute('data-clientsurge-route-exposure-removed', 'true');
      list.setAttribute('data-clientsurge-route-exposure-removed', 'true');

      const previous = [];
      let cursor = heading.previousElementSibling;
      while (cursor && previous.length < 3) {
        const text = normalizedText(cursor);
        const tag = cursor.tagName;
        if (
          (tag === 'H1' && /^ClientSurge Systems$/i.test(text)) ||
          (tag === 'P' && GENERATED_COPY_PATTERN.test(text)) ||
          (tag === 'DIV' && GENERATED_COPY_PATTERN.test(text))
        ) {
          previous.push(cursor);
          cursor = cursor.previousElementSibling;
          continue;
        }
        break;
      }

      for (const node of previous) node.remove();
      list.remove();
      heading.remove();
    }
  }

  function hardenInternalAnchors() {
    for (const anchor of Array.from(document.querySelectorAll('a[href]'))) {
      let url;
      try {
        url = new URL(anchor.getAttribute('href'), window.location.origin);
      } catch {
        continue;
      }
      if (!INTERNAL_PATH_PATTERN.test(url.pathname)) continue;
      anchor.setAttribute('rel', 'nofollow noopener noreferrer');
      anchor.setAttribute('aria-hidden', 'true');
      anchor.tabIndex = -1;
      anchor.style.display = 'none';
    }
  }

  function runGuard() {
    removeGeneratedPagesDirectory();
    removeLooseGeneratedPagesDirectory();
    hardenInternalAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runGuard, { once: true });
  } else {
    runGuard();
  }

  const observer = new MutationObserver(runGuard);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 120000);
})();