import test from "node:test";
import assert from "node:assert/strict";

import {
  AuthGuardError,
  requireAdminOrSignedInternalInvocation,
  requireAdminUser,
  requireAuthenticatedUser,
  requireOwnerOrAdmin,
  requireSignedInternalInvocation,
} from "../base44/functions/_shared/authGuards.js";

function createBase44WithUser(user) {
  return {
    auth: {
      async me() {
        return user;
      },
    },
  };
}

test("requireAuthenticatedUser returns the current user", async () => {
  const user = await requireAuthenticatedUser(
    createBase44WithUser({ id: "user_1", role: "user", email: "owner@example.com" })
  );

  assert.equal(user.email, "owner@example.com");
});

test("requireAuthenticatedUser fails clearly when no user is present", async () => {
  await assert.rejects(
    requireAuthenticatedUser(createBase44WithUser(null)),
    (error) => {
      assert.ok(error instanceof AuthGuardError);
      assert.equal(error.status, 401);
      assert.equal(error.code, "auth_required");
      return true;
    }
  );
});

test("requireAdminUser rejects authenticated non-admin users", async () => {
  await assert.rejects(
    requireAdminUser(createBase44WithUser({ id: "user_1", role: "user" })),
    (error) => {
      assert.ok(error instanceof AuthGuardError);
      assert.equal(error.status, 403);
      assert.equal(error.code, "admin_access_required");
      return true;
    }
  );
});

test("requireAdminUser accepts super admins for admin-only functions", async () => {
  const user = await requireAdminUser(
    createBase44WithUser({ id: "user_2", role: "super_admin", email: "owner@example.com" })
  );

  assert.equal(user.role, "super_admin");
});

test("requireOwnerOrAdmin accepts matching owner predicate", async () => {
  const user = await requireOwnerOrAdmin(
    createBase44WithUser({ id: "user_1", role: "user", email: "owner@example.com" }),
    (currentUser) => currentUser.email === "owner@example.com"
  );

  assert.equal(user.email, "owner@example.com");
});

test("requireOwnerOrAdmin rejects non-owner users", async () => {
  await assert.rejects(
    requireOwnerOrAdmin(
      createBase44WithUser({ id: "user_1", role: "user", email: "other@example.com" }),
      false
    ),
    (error) => {
      assert.ok(error instanceof AuthGuardError);
      assert.equal(error.status, 403);
      assert.equal(error.code, "owner_or_admin_required");
      return true;
    }
  );
});

test("requireSignedInternalInvocation accepts configured bearer secret", () => {
  process.env.INTERNAL_FUNCTION_SECRET = "test-secret";
  try {
    const req = new Request("https://example.test", {
      headers: { authorization: "Bearer test-secret" },
    });

    assert.deepEqual(requireSignedInternalInvocation(req), { type: "internal" });
  } finally {
    delete process.env.INTERNAL_FUNCTION_SECRET;
  }
});

test("requireSignedInternalInvocation rejects missing or bad secret", () => {
  process.env.INTERNAL_FUNCTION_SECRET = "test-secret";
  try {
    const req = new Request("https://example.test", {
      headers: { authorization: "Bearer wrong-secret" },
    });

    assert.throws(
      () => requireSignedInternalInvocation(req),
      (error) => {
        assert.ok(error instanceof AuthGuardError);
        assert.equal(error.status, 401);
        assert.equal(error.code, "signed_internal_invocation_required");
        return true;
      }
    );
  } finally {
    delete process.env.INTERNAL_FUNCTION_SECRET;
  }
});

test("requireAdminOrSignedInternalInvocation accepts admins when no internal secret is provided", async () => {
  const principal = await requireAdminOrSignedInternalInvocation(
    createBase44WithUser({ id: "user_2", role: "admin", email: "admin@example.com" }),
    new Request("https://example.test")
  );

  assert.equal(principal.type, "admin");
  assert.equal(principal.user.email, "admin@example.com");
});
