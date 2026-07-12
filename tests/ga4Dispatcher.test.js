import test from "node:test";
import assert from "node:assert/strict";
import { installGa4, trackGa4Event } from "../src/lib/ga4.js";

function createBrowserHarness() {
  const appendedScripts = [];
  const windowRef = {
    dataLayer: [],
    localStorage: {
      getItem() {
        return null;
      },
    },
  };

  const documentRef = {
    head: {
      appendChild(node) {
        appendedScripts.push(node);
      },
    },
    createElement(tagName) {
      return { tagName, async: false, dataset: {}, src: "" };
    },
    querySelector() {
      return null;
    },
  };

  windowRef.document = documentRef;
  installGa4({
    documentRef,
    windowRef,
    measurementId: "G-ABC12345",
    consentState: { analytics: true, ads: false },
  });

  return { appendedScripts, documentRef, windowRef };
}

function eventCommands(windowRef) {
  return windowRef.dataLayer.filter((command) => command[0] === "event");
}

test("direct legacy form_submit calls become form_submit_attempt and are deduplicated", () => {
  const { windowRef } = createBrowserHarness();

  assert.equal(
    windowRef.gtag("event", "form_submit", { form_id: "contact", page_path: "/contact" }),
    true,
  );
  assert.equal(
    windowRef.gtag("event", "form_submit", { form_id: "contact", page_path: "/contact" }),
    false,
  );

  const events = eventCommands(windowRef);
  assert.equal(events.length, 1);
  assert.equal(events[0][1], "form_submit_attempt");
});

test("successful forms retain the canonical form_submit event name", () => {
  const { windowRef } = createBrowserHarness();

  assert.equal(
    trackGa4Event(
      "form_submit",
      { form_id: "contact", submission_status: "success" },
      windowRef,
    ),
    true,
  );

  const events = eventCommands(windowRef);
  assert.equal(events.length, 1);
  assert.equal(events[0][1], "form_submit");
});

test("legacy conversion names are normalized before dispatch", () => {
  const { windowRef } = createBrowserHarness();

  windowRef.gtag("event", "checkout_click", { package_key: "growth_system" });
  windowRef.gtag("event", "demo_booking", { source: "book_page" });
  windowRef.gtag("event", "cta_click_auto", { cta_label: "Start" });

  assert.deepEqual(
    eventCommands(windowRef).map((command) => command[1]),
    ["begin_checkout", "audit_request_started", "cta_click"],
  );
});
