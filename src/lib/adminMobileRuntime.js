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

function findAdminLogoutButton() {
  return Array.from(document.querySelectorAll('button')).find((button) => {
    const label = `${button.getAttribute('aria-label') || ''} ${button.textContent || ''}`.trim().toLowerCase();
    return label === 'logout' || label === 'sign out' || label === 'signout';
  });
}

function ensureAdminHeaderActions() {
  if (typeof document === 'undefined' || !isAdminRoute()) return;

  const topBar = Array.from(document.querySelectorAll('div')).find((element) => {
    const className = String(element.className || '');
    return className.includes('sticky') && className.includes('top-0') && className.includes('z-10') && className.includes('justify-between');
  });

  if (!topBar || topBar.querySelector('.cs-admin-header-actions')) return;

  const rightSide = topBar.lastElementChild;
  if (!rightSide) return;

  const actions = document.createElement('div');
  actions.className = 'cs-admin-header-actions';
  actions.setAttribute('aria-label', 'Admin account actions');

  const helpLink = document.createElement('a');
  helpLink.href = '/contact';
  helpLink.className = 'cs-admin-header-action cs-admin-header-help';
  helpLink.textContent = 'Need help?';
  helpLink.setAttribute('aria-label', 'Open ClientSurge support');

  const logoutButton = document.createElement('button');
  logoutButton.type = 'button';
  logoutButton.className = 'cs-admin-header-action cs-admin-header-logout';
  logoutButton.textContent = 'Logout';
  logoutButton.setAttribute('aria-label', 'Logout');
  logoutButton.addEventListener('click', () => {
    const existingLogout = findAdminLogoutButton();
    if (existingLogout && existingLogout !== logoutButton) {
      existingLogout.click();
      return;
    }
    window.location.assign('/logout');
  });

  actions.append(helpLink, logoutButton);
  rightSide.prepend(actions);
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

function removeActionBar() {
  if (typeof document === 'undefined') return;
  document.querySelector('.cs-admin-mobile-action-bar')?.remove();
}

function syncActionBar() {
  if (typeof document === 'undefined') return;
  if (!isAdminRoute() || !isMobile()) {
    removeActionBar();
    return;
  }

  const bar = buildActionBar();
  if (!bar) return;
  bar.hidden = false;
}

export function installAdminMobileRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const sync = () => {
    ensureRouteClass();
    ensureAdminHeaderActions();
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
