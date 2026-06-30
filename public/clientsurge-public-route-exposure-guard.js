(() => {
  if (window.__clientsurgePublicRouteExposureGuard) return;
  window.__clientsurgePublicRouteExposureGuard = true;

  const INTERNAL_PATH_PATTERN = /^\/(admin|dashboard|client|client-portal|client-dashboard|setup|functions|function|internal|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|$)/i;
  const INTERNAL_TEXT_PATTERN = /\b(Admin Dashboard|Business Setup|Client Portal|Client Dashboard|Function Audit|System Observability|Reconciliation|Onboarding Pipeline|Install Guide|Mission Control|SaaS Admin|AI Status Dashboard|Performance Wars|Admin Settings|Lead Intelligence)\b/i;

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
    const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return false;

    const hasPagesHeading = Array.from(node.querySelectorAll?.('h1,h2,h3,h4,p,span,div') || []).some((child) => {
      return (child.textContent || '').trim().toLowerCase() === 'pages';
    });

    return (
      (hasPagesHeading && (hasInternalRouteLink(node) || INTERNAL_TEXT_PATTERN.test(text))) ||
      (hasInternalRouteLink(node) && INTERNAL_TEXT_PATTERN.test(text))
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
