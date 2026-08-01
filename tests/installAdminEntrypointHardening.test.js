import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

test("retired configureService only writes audit evidence after admin auth", () => {
  const source = read("base44/functions/configureService/main.ts");
  const authIndex = source.indexOf("await requireAdminUser(base44)");
  const eventIndex = source.indexOf("entities.CommunicationEvent.create");

  assert.match(source, /AuthGuardError, requireAdminUser/);
  assert.ok(authIndex > -1, "admin guard is present");
  assert.ok(eventIndex > authIndex, "legacy quarantine event is written after admin guard");
});

test("install configuration updates use the shared admin guard", () => {
  const source = read("base44/functions/updateInstallConfiguration/main.ts");

  assert.match(source, /AuthGuardError, requireAdminUser/);
  assert.match(source, /await requireAdminUser\(base44\)/);
  assert.doesNotMatch(source, /user\.role !== "admin"/);
});

test("legacy install sibling entrypoints are wrappers around main implementations", () => {
  assert.equal(read("base44/functions/configureService/entry.ts").trim(), 'import "./main.ts";');
  assert.equal(read("base44/functions/updateInstallConfiguration/entry.ts").trim(), 'import "./main.ts";');
});
