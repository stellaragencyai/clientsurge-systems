import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function read(path) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function mustInclude(findings, source, needle, label) {
  if (!source.includes(needle)) findings.push(`missing:${label}`);
}

function mustMatch(findings, source, pattern, label) {
  if (!pattern.test(source)) findings.push(`missing:${label}`);
}

export function collectArea10MobileA11yAudit() {
  const findings = [];
  const main = read("src/main.jsx");
  const mobileCallBar = read("src/components/landing/MobileCallBar.jsx");
  const areaCss = read("src/area10-mobile-a11y.css");
  const indexHtml = read("index.html");
  const app = read("src/App.jsx");

  mustInclude(findings, main, "@/area10-mobile-a11y.css", "area10_css_imported");
  mustInclude(findings, main, "role', 'alert'", "fatal_load_role_alert");
  mustInclude(findings, main, "aria-live', 'assertive'", "fatal_load_aria_live");
  mustInclude(findings, main, "100svh", "fatal_load_uses_svh");
  mustInclude(findings, main, "env(safe-area-inset-bottom", "fatal_load_safe_area_bottom");
  mustInclude(findings, main, "Refresh Page", "fatal_load_refresh_action");
  mustInclude(findings, main, "Go Home", "fatal_load_home_action");

  mustInclude(findings, mobileCallBar, "aria-label=\"Mobile contact and system actions\"", "mobile_bar_nav_label");
  mustInclude(findings, mobileCallBar, "data-area10-mobile-action-bar", "mobile_bar_area10_marker");
  mustInclude(findings, mobileCallBar, "aria-haspopup=\"dialog\"", "mobile_bar_dialog_semantics");
  mustInclude(findings, mobileCallBar, "aria-expanded", "mobile_bar_expanded_state");
  mustInclude(findings, mobileCallBar, "type=\"button\"", "mobile_bar_button_type");
  mustInclude(findings, mobileCallBar, "aria-hidden=\"true\"", "mobile_bar_decorative_icons_hidden");

  mustInclude(findings, areaCss, ".cs-mobile-action", "mobile_action_css_class");
  mustInclude(findings, areaCss, "min-height: 44px", "touch_target_min_height");
  mustInclude(findings, areaCss, "min-width: 44px", "touch_target_min_width");
  mustInclude(findings, areaCss, "prefers-reduced-motion: reduce", "reduced_motion_query");
  mustInclude(findings, areaCss, "animation: none !important", "reduced_motion_animation_off");
  mustInclude(findings, areaCss, "transition: none !important", "reduced_motion_transition_off");
  mustInclude(findings, areaCss, "env(safe-area-inset-left", "safe_area_left");
  mustInclude(findings, areaCss, "env(safe-area-inset-right", "safe_area_right");

  mustInclude(findings, indexHtml, "viewport-fit=cover", "ios_viewport_fit_cover");
  mustInclude(findings, indexHtml, "preconnect\" href=\"https://fonts.gstatic.com\" crossorigin", "font_preconnect_crossorigin");
  mustInclude(findings, indexHtml, "media=\"print\" onload=\"this.media='all'\"", "non_blocking_font_css");

  mustMatch(findings, app, /const [A-Za-z0-9]+ = lazy\(\(\) => import\(/, "route_level_lazy_loading");
  mustInclude(findings, app, "function RouteLoadingSkeleton", "route_loading_skeleton_exists");
  mustInclude(findings, app, "<Suspense fallback={<RouteLoadingSkeleton />}>", "lazy_route_suspense_fallback");

  return {
    summary: {
      checked_files: 5,
      findings_count: findings.length,
    },
    findings,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = collectArea10MobileA11yAudit();
  if (process.argv.includes("--write")) {
    const outDir = join(repoRoot, "tmp");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "area10-mobile-a11y-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}
