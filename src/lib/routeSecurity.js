import {
  ADMIN_ROUTE_PREFIXES,
  AUTHENTICATED_ROUTE_PREFIXES,
  INTERNAL_ROUTE_PREFIXES,
  NOINDEX_ROUTE_PREFIXES,
  PUBLIC_ROUTE_PATHS,
} from "./publicRouteMetadata.js";

export const ROUTE_ACCESS = {
  PUBLIC: "public",
  AUTHENTICATED: "authenticated",
  ADMIN: "admin",
  INTERNAL: "internal",
};

export const PUBLIC_ROUTES = PUBLIC_ROUTE_PATHS;
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
