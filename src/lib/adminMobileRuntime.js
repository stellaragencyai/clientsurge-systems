const ADMIN_ROUTE_PATTERN = /^\/(admin|dashboard|admin-settings)(\/|$)/i;
const MOBILE_QUERY = '(max-width: 640px)';

function isAdminRoute() {
  return typeof window !== 'undefined' && ADMIN_ROUTE_PATTERN.test(window.location.pathname);
}

function isMobile() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia(MOBILE_QUERY).matches;
}

function ensureRouteClass() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('cs-admin-route', isAdminRoute());
}

function findAdminMenuButton() {
  return Array.from(document.querySelectorAll('button')).find((button) => {
    const label = `${button.getAttribute('aria-label') || ''} ${button.textContent || ''}`.toLowerCase();
    return label.includes('menu') || label.includes('admin navigation');
  });
}

function buildActionBar() {
  if (typeof document === 'undefined') return null;
  let bar = document.querySelector('.cs-admin-mobile-action-bar');
  if (bar) return bar;

  bar = document.createElement('nav');
  bar.className = 'cs-admin-mobile-action-bar';
  bar.setAttribute('aria-label', 'Admin mobile quick actions');
  bar.innerHTML = `
    <a href="/admin" data-primary="true">Home</a>
    <a href="/admin?tab=leads">Leads</a>
    <a href="/admin?tab=inbox">Inbox</a>
    <a href="/admin?tab=settings">Settings</a>
    <button type="button" data-admin-mobile-menu>Menu</button>
  `;
  bar.querySelector('[data-admin-mobile-menu]')?.addEventListener('click', () => {
    findAdminMenuButton()?.click();
  });
  document.body.appendChild(bar);
  return bar;
}

function syncActionBar() {
  if (typeof document === 'undefined') return;
  const bar = buildActionBar();
  if (!bar) return;
  bar.hidden = !(isAdminRoute() && isMobile());
}

export function installAdminMobileRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const sync = () => {
    ensureRouteClass();
    syncActionBar();
  };

  sync();
  window.addEventListener('resize', sync);
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function pushStateWithAdminMobileRuntime(...args) {
    const result = originalPushState.apply(this, args);
    window.setTimeout(sync, 0);
    return result;
  };

  window.history.replaceState = function replaceStateWithAdminMobileRuntime(...args) {
    const result = originalReplaceState.apply(this, args);
    window.setTimeout(sync, 0);
    return result;
  };

  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true });
}
