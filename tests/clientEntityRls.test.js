import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const clientEntity = JSON.parse(
  readFileSync(new URL("../base44/entities/Client.jsonc", import.meta.url), "utf8")
);

function roleCondition(action) {
  return clientEntity.rls?.[action]?.user_condition;
}

function ownEmailBranches(action) {
  return clientEntity.rls?.[action]?.$or || [];
}

test("Client entity creation and deletion are admin-only", () => {
  assert.deepEqual(roleCondition("create"), { role: "admin" });
  assert.deepEqual(roleCondition("delete"), { role: "admin" });
});

test("Client entity read and update allow admins or the matching client email only", () => {
  for (const action of ["read", "update"]) {
    assert.deepEqual(ownEmailBranches(action), [
      { user_condition: { role: "admin" } },
      { "data.email": "{{user.email}}" },
    ]);
  }
});
