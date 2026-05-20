import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const automationDir = new URL("../base44/automations/", import.meta.url);
const automationDirPath = fileURLToPath(automationDir);

function readManifest(fileName) {
  return JSON.parse(readFileSync(new URL(fileName, automationDir), "utf8"));
}

test("automation manifests are valid and reference a trigger", () => {
  const files = readdirSync(automationDir).filter((file) => file.endsWith(".json"));

  assert.ok(files.length >= 1);

  for (const file of files) {
    const manifest = readManifest(file);
    assert.equal(typeof manifest.id, "string", `${file} has id`);
    assert.equal(typeof manifest.name, "string", `${file} has name`);
    assert.equal(typeof manifest.task, "string", `${file} has task`);
    assert.equal(typeof manifest.priority, "string", `${file} has priority`);
    assert.equal(typeof manifest.active, "boolean", `${file} has active flag`);
    assert.ok(manifest.trigger?.entity, `${file} has trigger entity`);
    assert.ok(manifest.trigger?.event, `${file} has trigger event`);
  }
});

test("client live automation invokes the 30-day check-in function", () => {
  const manifest = readManifest("client_live_30_day_checkin.json");

  assert.equal(manifest.function, "autoSchedule30DayCheckin");
  assert.equal(manifest.trigger.entity, "Client");
  assert.equal(manifest.trigger.event, "update");
  assert.equal(manifest.trigger.watch_field, "status");
  assert.equal(manifest.trigger.to, "Live");
  assert.ok(manifest.task_refs.includes("#326"));
});

test("win-back control keeps preview mode available before sending", () => {
  const manifest = readManifest("win_back_sequence_control.json");
  const source = readFileSync(
    join(automationDirPath, "../functions/runWinBackSequence/entry.ts"),
    "utf8"
  );

  assert.equal(manifest.function, "runWinBackSequence");
  assert.equal(manifest.trigger.event, "manual");
  assert.match(manifest.task, /dry_run=true/);
  assert.match(source, /dry_run/);
  assert.match(source, /preview/);
  assert.ok(manifest.task_refs.includes("#328"));
});
