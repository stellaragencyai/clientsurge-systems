import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  PHASE_E_ACCESSIBILITY_REQUIREMENTS,
  PHASE_E_COMPONENTS,
  PHASE_E_LAUNCH_VALIDATION_SYSTEMS,
  PHASE_E_REVIEW_STATES,
  PHASE_E_ROUTES,
  PHASE_E_SECTIONS,
  PHASE_E_SOURCE,
  PHASE_E_SOURCE_ISSUES,
  PHASE_E_TRUTH_RULES,
  PHASE_E_VIEWPORTS,
} from "../src/lib/phaseELifecycleFoundation.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../src/pages/review/PhaseEReviewPage.jsx", import.meta.url), "utf8");
const componentSource = readFileSync(
  new URL("../src/components/review/phase-e/PhaseEReviewComponents.jsx", import.meta.url),
  "utf8",
);
const validatorSource = readFileSync(new URL("../scripts/validate-phase-e-browser.mjs", import.meta.url), "utf8");

test("Phase E mounts all ten review routes under the public review guard", () => {
  assert.match(appSource, /lazy\(\(\) => import\("\.\/pages\/review\/PhaseEReviewPage"\)\)/);
  assert.match(appSource, /\/review\/phase-e" element={<Navigate to="\/review\/phase-e\/onboarding"/);

  for (const route of PHASE_E_ROUTES) {
    assert.match(
      appSource,
      new RegExp(`${route.path.replaceAll("/", "\\/")}.*sectionId="${route.id}"`),
      `${route.path} should be explicitly mounted with sectionId ${route.id}`,
    );
  }
});

test("Phase E route inventory covers the requested lifecycle and launch systems", () => {
  assert.equal(PHASE_E_SOURCE.issue, 1383);
  assert.deepEqual(PHASE_E_ROUTES.map((route) => route.id), [
    "onboarding",
    "home-entry",
    "trial",
    "subscription",
    "search",
    "command-menu",
    "notifications",
    "help",
    "incidents",
    "launch-readiness",
  ]);
  assert.deepEqual(PHASE_E_ROUTES.map((route) => route.system), PHASE_E_LAUNCH_VALIDATION_SYSTEMS);
  assert.deepEqual(PHASE_E_SOURCE_ISSUES.map((issue) => issue.number), [1383, 1371, 1372, 1373, 1359]);
});

test("Phase E components and fixture sections cover every route", () => {
  for (const route of PHASE_E_ROUTES) {
    const section = PHASE_E_SECTIONS[route.id];
    assert.ok(section, `${route.id} should have a section fixture`);
    assert.ok(PHASE_E_COMPONENTS[route.id]?.length >= 5, `${route.id} should define components`);
    assert.ok(section.lifecycle.length >= 6, `${route.id} should define lifecycle states`);
    assert.ok(section.interruptions.length >= 2, `${route.id} should define interruption states`);
    assert.ok(section.actions.length >= 3, `${route.id} should define actions`);
    assert.ok(section.acceptance.length >= 3, `${route.id} should define acceptance checks`);

    for (const key of ["source", "freshness", "scope", "verification"]) {
      assert.ok(section.sourceSemantics[key], `${route.id} should define ${key} source semantics`);
    }
  }

  assert.deepEqual(PHASE_E_COMPONENTS.onboarding, [
    "WelcomeExperience",
    "ActivationProgress",
    "BusinessSetupSummary",
    "ConnectionChecklist",
    "AIActivationStatus",
    "FirstSuccessCard",
  ]);
  assert.ok(PHASE_E_COMPONENTS.search.includes("SearchOverlay"));
  assert.ok(PHASE_E_COMPONENTS.search.includes("SearchInput"));
  assert.ok(PHASE_E_COMPONENTS.notifications.includes("NotificationInbox"));
  assert.ok(PHASE_E_COMPONENTS.help.includes("ContextualHelp"));
  assert.ok(PHASE_E_COMPONENTS.incidents.includes("IncidentStatusBanner"));
});

test("Phase E required states and truth rules remain explicit", () => {
  for (const state of ["Loading", "Current", "Incomplete", "Blocked", "Waiting", "Complete", "Error", "Unavailable"]) {
    assert.ok(PHASE_E_REVIEW_STATES.includes(state), `${state} should be a Phase E review state`);
  }

  assert.deepEqual(PHASE_E_SECTIONS.trial.states, [
    "Trial Started",
    "Activation In Progress",
    "Trial Active",
    "Trial Ending Soon",
    "Trial Expired",
    "Converted",
    "Cancelled",
  ]);

  assert.deepEqual(PHASE_E_SECTIONS.incidents.states, [
    "Operational",
    "Degraded",
    "Partial Impact",
    "Major Incident",
    "Maintenance",
    "Resolved",
  ]);

  assert.deepEqual(PHASE_E_TRUTH_RULES, [
    "Unknown is not healthy",
    "Estimated is not verified",
    "Sent is not delivered",
    "No data is not zero",
    "Configured is not working",
    "Connected is not healthy",
  ]);
});

test("Phase E validation covers the requested browser and accessibility matrix", () => {
  assert.deepEqual(PHASE_E_VIEWPORTS.map((viewport) => viewport.width), [1440, 1280, 1024, 768, 390, 375]);

  for (const requirement of [
    "Keyboard reachable route navigation, overlays, search results, command actions, and recovery links",
    "Screen-reader labels for state, source, owner, business impact, and recovery path",
    "Reduced-motion validation with no required running animations",
    "200% zoom and narrow-screen reflow without horizontal overflow",
  ]) {
    assert.ok(PHASE_E_ACCESSIBILITY_REQUIREMENTS.includes(requirement), `${requirement} missing`);
  }

  for (const required of [
    "aria-current",
    "aria-live=\"polite\"",
    "role=\"status\"",
    "aria-label=\"Phase E review routes\"",
    "aria-labelledby",
    "motion-reduce:transition-none",
  ]) {
    assert.ok(componentSource.includes(required), `${required} missing from Phase E components`);
  }

  assert.ok(PHASE_E_SECTIONS.search.keyboard.includes("Command K / Ctrl K"));
  assert.ok(PHASE_E_SECTIONS["command-menu"].keyboard.includes("Command K / Ctrl K"));
  assert.ok(pageSource.includes("SourceSemantics"), "Phase E page should render source semantics");
  assert.ok(pageSource.includes("ValidationSummary"), "Phase E page should render validation summary");
  assert.ok(validatorSource.includes("PHASE_E_ROUTES"), "browser validator should share route data");
  assert.ok(validatorSource.includes("setEmulatedMedia"), "browser validator should check reduced motion media");
  assert.ok(validatorSource.includes("zoom200"), "browser validator should record 200% zoom coverage");
});
