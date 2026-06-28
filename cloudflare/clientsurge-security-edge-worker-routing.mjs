import baseWorker from "./clientsurge-security-edge-worker.mjs";

const CANONICAL_HOST = "clientsurgesystems.com";

const HOMEPAGE_ALIAS_PATHS = new Set([
  "/home",
  "/homepage",
  "/home-page",
  "/main",
  "/index",
  "/index.html",
  "/landing",
  "/landing-page",
]);

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0];
  const normalized = value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
  return normalized || "/";
}

export function isHomepageAliasPath(pathname = "/") {
  return HOMEPAGE_ALIAS_PATHS.has(normalizePathname(pathname).toLowerCase());
}

export function homepageAliasLocation(url) {
  const target = new URL(url.toString());
  target.protocol = "https:";
  target.hostname = CANONICAL_HOST;
  target.pathname = "/";
  target.search = url.search;
  target.hash = "";
  return target.toString();
}

export function homepageAliasResponse(url) {
  return new Response(null, {
    status: 301,
    headers: {
      Location: homepageAliasLocation(url),
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (isHomepageAliasPath(url.pathname)) {
      return homepageAliasResponse(url);
    }

    return baseWorker.fetch(request, env, ctx);
  },
};
