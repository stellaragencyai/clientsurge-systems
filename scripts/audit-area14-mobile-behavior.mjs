import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function read(path) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function readJson(path) {
  return JSON.parse(read(path));
}

function mustInclude(findings, source, needle, label) {
  if (!source.includes(needle)) findings.push(`missing:${label}`);
}

function mustEqual(findings, actual, expected, label) {
  if (actual !== expected) findings.push(`mismatch:${label}:${String(actual)}!=${String(expected)}`);
}

function mustTruthy(findings, value, label) {
  if (!value) findings.push(`missing:${label}`);
}

export function collectArea14MobileBehaviorAudit() {
  const findings = [];
  const behavior = readJson("mobile/mobile-app-behavior-readiness.json");
  const build = readJson("mobile/ios-build-readiness.json");
  const appStore = readJson("mobile/ios-app-store-readiness.json");
  const serviceWorker = read("public/sw.js");
  const offline = read("public/offline.html");
  const checklist = read("docs/MOBILE_APP_UX_DEVICE_BEHAVIOR_CHECKLIST.md");

  mustEqual(findings, behavior.area, 14, "area_number");
  mustEqual(findings, behavior.status, "mobile_behavior_readiness_gate", "behavior_status");
  mustEqual(findings, behavior.removable_sections_safe, true, "removable_sections_safe");
  mustEqual(findings, behavior.navigation.must_not_depend_on_marketing_sections, true, "section_independent_navigation");
  mustEqual(findings, behavior.session_behavior.requires_login_persistence_after_app_restart, true, "login_persistence");
  mustEqual(findings, behavior.session_behavior.requires_logout_clears_session, true, "logout_clears_session");
  mustEqual(findings, behavior.offline_and_connectivity.offline_fallback_url, "/offline.html", "offline_url");
  mustEqual(findings, behavior.offline_and_connectivity.service_worker_must_cache_offline_fallback, true, "sw_caches_offline");
  mustEqual(findings, behavior.notifications.must_be_opt_in, true, "notifications_opt_in");
  mustEqual(findings, behavior.notifications.must_not_block_core_app_if_denied, true, "notifications_non_blocking");
  mustEqual(findings, behavior.app_links.requires_fallback_to_web_if_app_unavailable, true, "app_link_fallback");
  mustEqual(findings, behavior.forms_and_keyboard.requires_input_zoom_prevention, true, "input_zoom_prevention");
  mustEqual(findings, behavior.release_proof.requires_area_13_build_manifest, true, "area13_dependency");
  mustEqual(findings, behavior.release_proof.requires_area_15_privacy_security_manifest, true, "area15_dependency");
  mustEqual(findings, behavior.release_proof.requires_area_12_base44_publish_proof, true, "area12_dependency");

  mustEqual(findings, build.area, 13, "area13_build_manifest_present");
  mustEqual(findings, appStore.area ?? 15, 15, "area15_readiness_present");

  mustInclude(findings, serviceWorker, "OFFLINE_FALLBACK_URL", "sw_offline_constant");
  mustInclude(findings, serviceWorker, "\"/offline.html\"", "sw_offline_path");
  mustInclude(findings, serviceWorker, "cache.addAll(CORE_ASSETS)", "sw_cache_core_assets");
  mustInclude(findings, serviceWorker, "caches.match(OFFLINE_FALLBACK_URL)", "sw_navigation_fallback");
  mustInclude(findings, serviceWorker, "preview-sandbox", "sw_editor_sandbox_guard");
  mustInclude(findings, serviceWorker, "base44", "sw_base44_guard");

  mustInclude(findings, offline, "You are offline", "offline_heading");
  mustInclude(findings, offline, "window.location.reload()", "offline_retry_action");
  mustInclude(findings, offline, "Contact Support", "offline_support_action");
  mustInclude(findings, offline, "100svh", "offline_mobile_viewport");
  mustInclude(findings, offline, "safe-area-inset-bottom", "offline_safe_area");
  mustInclude(findings, offline, "noindex,nofollow", "offline_noindex");

  for (const phrase of [
    "Removable Section Safety",
    "Mobile Navigation",
    "Session Behavior",
    "Offline and Poor Connection",
    "Notifications",
    "App Links",
    "Forms and Keyboard",
    "Release Proof"
  ]) {
    mustInclude(findings, checklist, phrase, `checklist:${phrase}`);
  }

  return {
    summary: {
      checked_files: 6,
      findings_count: findings.length,
    },
    findings,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = collectArea14MobileBehaviorAudit();
  if (process.argv.includes("--write")) {
    const outDir = join(repoRoot, "tmp");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "area14-mobile-behavior-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}
