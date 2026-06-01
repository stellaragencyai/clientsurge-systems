export class AuthGuardError extends Error {
  constructor(message, { status = 401, code = "auth_required" } = {}) {
    super(message);
    this.name = "AuthGuardError";
    this.status = status;
    this.code = code;
  }
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

  if (!["admin", "super_admin"].includes(user.role)) {
    throw new AuthGuardError("Admin access required", {
      status: 403,
      code: "admin_access_required",
    });
  }

  return user;
}
