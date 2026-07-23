const DEFAULT_ALLOWED_ORIGINS = [
  "https://clientsurgesystems.com",
  "https://www.clientsurgesystems.com",
];

function readEnv(env, key) {
  try {
    return env?.get?.(key) || "";
  } catch {
    return "";
  }
}

export function normalizeOrigin(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

export function getAllowedPublicFormOrigins(env = globalThis.Deno?.env) {
  const configuredOrigins = [
    readEnv(env, "APP_URL"),
    ...readEnv(env, "PUBLIC_FORM_ALLOWED_ORIGINS").split(","),
  ];

  return new Set(
    [...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]
      .map(normalizeOrigin)
      .filter(Boolean)
  );
}

export function validatePublicFormOrigin(req, { env = globalThis.Deno?.env } = {}) {
  const origin = normalizeOrigin(req?.headers?.get?.("origin"));
  const allowedOrigins = getAllowedPublicFormOrigins(env);

  if (!origin || !allowedOrigins.has(origin)) {
    return {
      ok: false,
      status: 403,
      error: "Invalid request origin",
    };
  }

  return { ok: true, origin };
}
