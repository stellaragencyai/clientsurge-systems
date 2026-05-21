export const PRODUCTION_APP_URL = "https://clientsurgesystems.com";

const LOCALHOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function readEnvValue(env) {
  try {
    return env?.get?.("APP_URL") || "";
  } catch {
    return "";
  }
}

export function normalizeAppUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return PRODUCTION_APP_URL;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();

    if (LOCALHOSTS.has(host) || host.endsWith(".local")) {
      return PRODUCTION_APP_URL;
    }

    if (url.protocol !== "https:") {
      return PRODUCTION_APP_URL;
    }

    return url.origin;
  } catch {
    return PRODUCTION_APP_URL;
  }
}

export function getAppUrl(env = globalThis.Deno?.env) {
  return normalizeAppUrl(readEnvValue(env));
}

export function buildAppUrl(path = "", env = globalThis.Deno?.env) {
  const suffix = String(path || "");
  if (!suffix) {
    return getAppUrl(env);
  }
  return `${getAppUrl(env)}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}
