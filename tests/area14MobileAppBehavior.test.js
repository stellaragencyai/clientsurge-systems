import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { collectArea14MobileBehaviorAudit } from "../scripts/audit-area14-mobile-behavior.mjs";

const behavior = JSON.parse(readFileSync(new URL("../mobile/mobile-app-behavior-readiness.json", import.meta.url), "utf8"));
const serviceWorker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const offline = readFileSync(new URL("../public/offline.html", import.meta.url), "utf8");
const checklist = readFileSync(new URL("../docs/MOBILE_APP_UX_DEVICE_BEHAVIOR_CHECKLIST.md", import.meta.url), "utf8");
const report = collectArea14MobileBehaviorAudit();

test("Area 14 behavior manifest is section-removal safe", () => {
  assert.equal(behavior.area, 14);
  assert.equal(behavior.status, "mobile_behavior_readiness_gate");
  assert.equal(behavior.removable_sections_safe, true);
  assert.equal(behavior.navigation.must_not_depend_on_marketing_sections, true);
});

test("Area 14 behavior manifest covers session offline notification link and keyboard behavior", () => {
  assert.equal(behavior.session_behavior.requires_login_persistence_after_app_restart, true);
  assert.equal(behavior.session_behavior.requires_logout_clears_session, true);
  assert.equal(behavior.offline_and_connectivity.offline_fallback_url, "/offline.html");
  assert.equal(behavior.offline_and_connectivity.service_worker_must_cache_offline_fallback, true);
  assert.equal(behavior.notifications.must_be_opt_in, true);
  assert.equal(behavior.notifications.must_not_block_core_app_if_denied, true);
  assert.equal(behavior.app_links.requires_fallback_to_web_if_app_unavailable, true);
  assert.equal(behavior.forms_and_keyboard.requires_input_zoom_prevention, true);
});

test("Area 14 service worker caches and serves the offline fallback", () => {
  assert.match(serviceWorker, /OFFLINE_FALLBACK_URL/);
  assert.match(serviceWorker, /"\/offline\.html"/);
  assert.match(serviceWorker, /cache\.addAll\(CORE_ASSETS\)/);
  assert.match(serviceWorker, /caches\.match\(OFFLINE_FALLBACK_URL\)/);
  assert.match(serviceWorker, /preview-sandbox/);
  assert.match(serviceWorker, /base44/);
});

test("Area 14 offline page is mobile-safe and actionable", () => {
  assert.match(offline, /You are offline/);
  assert.match(offline, /window\.location\.reload\(\)/);
  assert.match(offline, /Contact Support/);
  assert.match(offline, /100svh/);
  assert.match(offline, /safe-area-inset-bottom/);
  assert.match(offline, /noindex,nofollow/);
});

test("Area 14 checklist covers the required mobile behavior domains", () => {
  for (const phrase of ["Removable Section Safety", "Mobile Navigation", "Session Behavior", "Offline and Poor Connection", "Notifications", "App Links", "Forms and Keyboard", "Release Proof"]) {
    assert.match(checklist, new RegExp(phrase));
  }
});

test("Area 14 audit reports no findings", () => {
  assert.deepEqual(report.findings, []);
});
