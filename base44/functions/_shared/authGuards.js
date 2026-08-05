export class AuthGuardError extends Error {
  constructor(message, { status = 401, code = "auth_required" } = {}) {
    super(message);
    this.name = "AuthGuardError";
    this.status = status;
    this.code = code;
  }
}

const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const INTERNAL_SECRET_HEADERS = [
  "x-clientsurge-internal-secret",
  "x-internal-function-secret",
  "x-automation-shared-secret",
];
const INTERNAL_SECRET_ENV_NAMES = [
  "CLIENTSURGE_INTERNAL_FUNCTION_SECRET",
  "INTERNAL_FUNCTION_SECRET",
  "AUTOMATION_SHARED_SECRET",
];

function readEnv(name) {
  return globalThis.Deno?.env?.get?.(name) || globalThis.process?.env?.[name] || "";
}

function timingSafeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (!a || !b || a.length !== b.length) return false;

  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

function configuredInternalSecrets() {
  return INTERNAL_SECRET_ENV_NAMES
    .map((name) => readEnv(name))
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function providedInternalSecret(req) {
  for (const header of INTERNAL_SECRET_HEADERS) {
    const value = req.headers?.get?.(header);
    if (value) return value.trim();
  }

  const authorization = req.headers?.get?.("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export function isAdminUser(user) {
  return ADMIN_ROLES.has(user?.role);
}

export async function requireAuthenticatedUser(base44) {
  const user = await base44.auth.me();

  if (!user) {
    throw new AuthGuardError("Authentication required", {
      status: 401,
      code: "auth_required",
    });
  }

  return user;
}

export async function requireAdminUser(base44) {
  const user = await requireAuthenticatedUser(base44);

  if (!isAdminUser(user)) {
    throw new AuthGuardError("Admin access required", {
      status: 403,
      code: "admin_access_required",
    });
  }

  return user;
}

export async function requireOwnerOrAdmin(base44, ownerCheck, {
  message = "Owner or admin access required",
  code = "owner_or_admin_required",
} = {}) {
  const user = await requireAuthenticatedUser(base44);
  if (isAdminUser(user)) return user;

  const allowed = typeof ownerCheck === "function" ? await ownerCheck(user) : Boolean(ownerCheck);
  if (!allowed) {
    throw new AuthGuardError(message, {
      status: 403,
      code,
    });
  }

  return user;
}

export function requireSignedInternalInvocation(req, {
  message = "Signed internal invocation required",
  code = "signed_internal_invocation_required",
} = {}) {
  const secrets = configuredInternalSecrets();
  if (secrets.length === 0) {
    throw new AuthGuardError("Internal invocation secret is not configured", {
      status: 503,
      code: "internal_secret_not_configured",
    });
  }

  const provided = providedInternalSecret(req);
  const valid = secrets.some((secret) => timingSafeEqual(provided, secret));
  if (!valid) {
    throw new AuthGuardError(message, {
      status: 401,
      code,
    });
  }

  return { type: "internal" };
}

export async function requireAdminOrSignedInternalInvocation(base44, req) {
  try {
    return requireSignedInternalInvocation(req);
  } catch (_) {
    const user = await requireAdminUser(base44);
    return { type: "admin", user };
  }
}
