const routePath = (...segments) => `/${segments.join("/")}`;

export const ROUTE_ACCESS = {
  PUBLIC: "public",
  AUTHENTICATED: "authenticated",
  ADMIN: "admin",
  INTERNAL: "internal",
};

export const PUBLIC_ROUTES = [
  "/",
  "/store",
  "/order-success",
  "/med-spa",
  "/dental",
  "/hvac",
  "/roofing",
  "/contractors",
  "/chiropractic",
  "/lead-capture-automation",
  "/missed-call-text-back",
  "/ai-lead-follow-up",
  "/appointment-booking-automation",
  "/review-automation",
  "/customer-reactivation",
  "/start",
  "/book",
  "/book-demo",
  "/industries",
  "/pricing",
  "/faq",
  "/our-system",
  "/testimonials",
  "/privacy-policy",
  "/terms",
  "/login",
  "/success",
  "/legal",
  "/contact",
  "/blog",
  "/about",
  "/automations",
  "/leads/capture",
  "/thank-you",
];

export const AUTHENTICATED_ROUTES = [
  "/client-portal",
  "/client-dashboard",
  "/onboarding",
  "/setup",
  "/setup/credentials",
  "/setup/status",
];

export const ADMIN_ROUTES = [
  "/admin",
  "/admin/leads",
  "/admin/automations",
  "/admin/onboarding",
  "/admin/install-guide",
  "/admin/ai-sales",
  "/admin/performance-wars",
  "/dashboard",
  "/admin-settings",
  "/lead-intelligence",
  "/sam",
  "/medspa-dashboard",
];

export const INTERNAL_ROUTES = [
  "/motion-lab",
  "/setup/preview",
  "/admin/AIStatusDashboard",
];

export const NOINDEX_PREFIXES = [
  ...AUTHENTICATED_ROUTES,
  ...ADMIN_ROUTES,
  ...INTERNAL_ROUTES,
  "/order-success",
  "/success",
  "/thank-you",
  "/login",
];

function normalize(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0].toLowerCase();
  if (value.length > 1 && value.endsWith("/")) {
    return value.slice(0, -1);
  }
  return value || "/";
}

function matchesPath(pathname, route) {
  const normalizedPathname = normalize(pathname);
  const normalizedRoute = normalize(route);
  return (
    normalizedPathname === normalizedRoute ||
    (normalizedRoute !== "/" && normalizedPathname.startsWith(`${normalizedRoute}/`))
  );
}

export function classifyRoute(pathname = "/") {
  if (INTERNAL_ROUTES.some((route) => matchesPath(pathname, route))) {
    return ROUTE_ACCESS.INTERNAL;
  }

  if (ADMIN_ROUTES.some((route) => matchesPath(pathname, route))) {
    return ROUTE_ACCESS.ADMIN;
  }

  if (AUTHENTICATED_ROUTES.some((route) => matchesPath(pathname, route))) {
    return ROUTE_ACCESS.AUTHENTICATED;
  }

  return ROUTE_ACCESS.PUBLIC;
}

export function isPublicRoute(pathname = "/") {
  return classifyRoute(pathname) === ROUTE_ACCESS.PUBLIC;
}

export function shouldNoindexRoute(pathname = "/") {
  return NOINDEX_PREFIXES.some((prefix) => matchesPath(pathname, prefix));
}

export const routeSecurityMap = {
  public: PUBLIC_ROUTES,
  authenticated: AUTHENTICATED_ROUTES,
  admin: ADMIN_ROUTES,
  internal: INTERNAL_ROUTES,
};

export { routePath };
