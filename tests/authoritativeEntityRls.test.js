import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readEntity(name) {
  return JSON.parse(
    readFileSync(new URL(`../base44/entities/${name}.jsonc`, import.meta.url), "utf8")
  );
}

function assertAdminOnlyUpdate(entityName) {
  const entity = readEntity(entityName);
  assert.deepEqual(
    entity.rls?.update,
    { user_condition: { role: "admin" } },
    `${entityName} updates must be admin-only because it stores authoritative billing, activation, or provisioning state`
  );
}

test("authoritative payment and activation entities are not customer-updatable", () => {
  for (const entityName of ["Order", "Subscription", "ClientInstallationOS"]) {
    assertAdminOnlyUpdate(entityName);
  }
});
