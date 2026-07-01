(() => {
  if (window.__clientsurgePublicRouteExposureGuard) return;
  window.__clientsurgePublicRouteExposureGuard = true;

  const INTERNAL_PATH_PATTERN = /^\/(admin|dashboard|client|client-portal|client-dashboard|setup|functions|function|internal|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|$)/i;
  const INTERNAL_TEXT_PATTERN = /\b(Admin Dashboard|Business Setup|Client Portal|Client Dashboard|Function Audit|System Observability|Reconciliation|Onboarding Pipeline|Install Guide|Mission Control|SaaS Admin|AI Status Dashboard|Performance Wars|Admin Settings|Lead Intelligence|Credentials Setup|Website Preview|Automation Health|Opportunity Review Queue)\b/i;
  const GENERATED_COPY_PATTERN = /ClientSurge Systems manages \d+ data types|ClientSurge Systems manages \d+ data types and \d+ pages|organize, track, and share your work in 1 place|including launch gates/i;
  const PUBLIC_PATHS = new Set(['/', '/pricing', '/automations', '/contact', '/privacy', '/terms', '/sms-terms', '/refund-policy']);

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
      (hasInternalRouteLink(node) && (INTERNAL_TEXT_PATTERN.test(text) || GENERATED_COPY_PATTERN.test(text))) ||
      (GENERATED_COPY_PATTERN.test(text) && INTERNAL_TEXT_PATTERN.test(text))
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
      while (cursor && previous.length < 4) {
        const text = normalizedText(cursor);
        const tag = cursor.tagName;
        if (
          (tag === 'H1' && /^ClientSurge Systems$/i.test(text)) ||
          (tag === 'P' && GENERATED_COPY_PATTERN.test(text)) ||
          (tag === 'DIV' && GENERATED_COPY_PATTERN.test(text)) ||
          (tag === 'SECTION' && GENERATED_COPY_PATTERN.test(text))
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

  function removeGeneratedSiblingCluster() {
    const bodyText = normalizedText(document.body);
    if (!GENERATED_COPY_PATTERN.test(bodyText)) return;

    const nodes = Array.from(document.body.querySelectorAll('h1,h2,h3,p,div,section,nav,ul,ol'));
    for (const node of nodes) {
      const text = normalizedText(node);
      if (!text) continue;
      const isGeneratedIntro = GENERATED_COPY_PATTERN.test(text) || /^ClientSurge Systems$/i.test(text);
      const isGeneratedPages = text.toLowerCase() === 'pages' || (INTERNAL_TEXT_PATTERN.test(text) && hasInternalRouteLink(node));
      if (!isGeneratedIntro && !isGeneratedPages) continue;
      const parent = node.parentElement;
      if (parent && looksLikeGeneratedPagesDirectory(parent)) {
        parent.setAttribute('data-clientsurge-route-exposure-removed', 'true');
        parent.remove();
      } else {
        node.setAttribute('data-clientsurge-route-exposure-removed', 'true');
        node.remove();
      }
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

  function markUnexpectedPublicAnchors() {
    for (const anchor of Array.from(document.querySelectorAll('a[href]'))) {
      let url;
      try {
        url = new URL(anchor.getAttribute('href'), window.location.origin);
      } catch {
        continue;
      }
      if (url.origin !== window.location.origin) continue;
      if (PUBLIC_PATHS.has(url.pathname) || INTERNAL_PATH_PATTERN.test(url.pathname)) continue;
      anchor.setAttribute('data-clientsurge-unlisted-public-link', 'true');
    }
  }

  function runGuard() {
    removeGeneratedPagesDirectory();
    removeLooseGeneratedPagesDirectory();
    removeGeneratedSiblingCluster();
    hardenInternalAnchors();
    markUnexpectedPublicAnchors();
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
