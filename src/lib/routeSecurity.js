import {
  ADMIN_ROUTE_PREFIXES,
  APP_SHELL_PUBLIC_PATHS,
  AUTHENTICATED_ROUTE_PREFIXES,
  INTERNAL_ROUTE_PREFIXES,
  NOINDEX_ROUTE_PREFIXES,
  PUBLIC_ROUTE_PATHS,
} from "./publicRouteMetadata.js";

// IMPORTANT: Route classification must remain side-effect free.
// The previous implementation installed publicPageDirectoryGuard during module
// evaluation. That guard repeatedly inspected the document and called
// body.replaceChildren(...) on public routes when Base44 boilerplate was
// detected, which deleted the mounted React application and replaced the live
// website with a static emergency fallback. Raw HTML sanitization belongs at
// the server/edge response layer, never inside this route metadata module.

export const ROUTE_ACCESS = {
  PUBLIC: "public",
  AUTHENTICATED: "authenticated",
  ADMIN: "admin",
  INTERNAL: "internal",
};

export const PUBLIC_ROUTES = PUBLIC_ROUTE_PATHS;
export const APP_SHELL_PUBLIC_ROUTES = APP_SHELL_PUBLIC_PATHS;
export const AUTHENTICATED_ROUTES = AUTHENTICATED_ROUTE_PREFIXES;
export const ADMIN_ROUTES = ADMIN_ROUTE_PREFIXES;
export const INTERNAL_ROUTES = INTERNAL_ROUTE_PREFIXES;
export const NOINDEX_PREFIXES = NOINDEX_ROUTE_PREFIXES;

function normalize(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0].toLowerCase();
  if (value.length > 1 && value.endsWith("/")) {
    return value.slice(0, -1);
  }
  return value || "/";
}

function isNonProductionHost() {
  if (typeof window === "undefined") return false;
  const host = String(window.location?.hostname || "").toLowerCase();
  if (!host) return false;
  if (host === "clientsurgesystems.com" || host === "www.clientsurgesystems.com") return false;
  return host === "beta.clientsurgesystems.com" || host.endsWith(".base44.app") || host.includes("preview-sandbox");
}

export function matchesRoutePrefix(pathname, route) {
  const normalizedPathname = normalize(pathname);
  const normalizedRoute = normalize(route);
  return (
    normalizedPathname === normalizedRoute ||
    (normalizedRoute !== "/" && normalizedPathname.startsWith(`${normalizedRoute}/`))
  );
}

export function classifyRoute(pathname = "/") {
  if (INTERNAL_ROUTES.some((route) => matchesRoutePrefix(pathname, route))) {
    return ROUTE_ACCESS.INTERNAL;
  }

  if (ADMIN_ROUTES.some((route) => matchesRoutePrefix(pathname, route))) {
    return ROUTE_ACCESS.ADMIN;
  }

  if (AUTHENTICATED_ROUTES.some((route) => matchesRoutePrefix(pathname, route))) {
    return ROUTE_ACCESS.AUTHENTICATED;
  }

  return ROUTE_ACCESS.PUBLIC;
}

export function isPublicRoute(pathname = "/") {
  return classifyRoute(pathname) === ROUTE_ACCESS.PUBLIC;
}

export function isAppShellPublicRoute(pathname = "/") {
  return APP_SHELL_PUBLIC_ROUTES.some((route) => matchesRoutePrefix(pathname, route));
}

export function shouldNoindexRoute(pathname = "/") {
  if (isNonProductionHost()) return true;
  return NOINDEX_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix));
}

export const routeSecurityMap = {
  public: PUBLIC_ROUTES,
  appShellPublic: APP_SHELL_PUBLIC_ROUTES,
  authenticated: AUTHENTICATED_ROUTES,
  admin: ADMIN_ROUTES,
  internal: INTERNAL_ROUTES,
};
