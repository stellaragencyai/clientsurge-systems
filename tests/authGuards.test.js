import test from "node:test";
import assert from "node:assert/strict";

import {
  AuthGuardError,
  requireAdminUser,
  requireAuthenticatedUser,
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
