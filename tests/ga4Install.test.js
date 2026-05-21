import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getGa4MeasurementId,
  hasGrantedAnalyticsConsent,
  installGa4,
  updateGa4Consent,
} from "../src/lib/ga4.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const envReadme = readFileSync(new URL("../src/README_ENV.md", import.meta.url), "utf8");
const docsEnvReadme = readFileSync(new URL("../docs/README_ENV.md", import.meta.url), "utf8");

function createBrowserHarness(existingScriptId = "") {
  const appendedScripts = [];
  const windowRef = {
    dataLayer: [],
    localStorage: {
      values: new Map(),
      getItem(key) {
        return this.values.get(key) || null;
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
      return {
        tagName,
        async: false,
        dataset: {},
        src: "",
      };
    },
    querySelector(selector) {
      return selector === `script[data-ga4-measurement-id="${existingScriptId}"]`
        ? { dataset: { ga4MeasurementId: existingScriptId } }
        : null;
    },
  };

  return { appendedScripts, documentRef, windowRef };
}

test("GA4 measurement ID only accepts real public G- IDs", () => {
  assert.equal(getGa4MeasurementId({ VITE_GA4_MEASUREMENT_ID: "G-ABC12345" }), "G-ABC12345");
  assert.equal(getGa4MeasurementId({ VITE_GOOGLE_ANALYTICS_ID: " g-test9876 " }), "G-TEST9876");
  assert.equal(getGa4MeasurementId({ VITE_GA4_MEASUREMENT_ID: "UA-123" }), "");
  assert.equal(getGa4MeasurementId({ VITE_GA4_MEASUREMENT_ID: "G-" }), "");
  assert.equal(getGa4MeasurementId({}), "");
});

test("GA4 installer is inert until a measurement ID exists", () => {
  const { appendedScripts, documentRef, windowRef } = createBrowserHarness();
  const result = installGa4({ documentRef, windowRef, measurementId: "" });

  assert.deepEqual(result, { installed: false, reason: "missing_measurement_id" });
  assert.equal(appendedScripts.length, 0);
  assert.equal(windowRef.gtag, undefined);
});

test("GA4 installer injects the Google tag and configures default consent", () => {
  const { appendedScripts, documentRef, windowRef } = createBrowserHarness();
  const result = installGa4({
    documentRef,
    windowRef,
    measurementId: "G-ABC12345",
    consentGranted: false,
  });

  assert.deepEqual(result, {
    installed: true,
    measurementId: "G-ABC12345",
    alreadyInstalled: false,
  });
  assert.equal(appendedScripts.length, 1);
  assert.equal(appendedScripts[0].async, true);
  assert.equal(appendedScripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-ABC12345");
  assert.equal(appendedScripts[0].dataset.ga4MeasurementId, "G-ABC12345");
  assert.equal(windowRef.dataLayer.length, 3);
  assert.equal(windowRef.dataLayer[0][0], "consent");
  assert.equal(windowRef.dataLayer[0][2].analytics_storage, "denied");
  assert.equal(windowRef.dataLayer[2][0], "config");
  assert.equal(windowRef.dataLayer[2][1], "G-ABC12345");
});

test("GA4 installer is idempotent when the tag already exists", () => {
  const { appendedScripts, documentRef, windowRef } = createBrowserHarness("G-ABC12345");
  const result = installGa4({
    documentRef,
    windowRef,
    measurementId: "G-ABC12345",
    consentGranted: true,
  });

  assert.deepEqual(result, {
    installed: true,
    measurementId: "G-ABC12345",
    alreadyInstalled: true,
  });
  assert.equal(appendedScripts.length, 0);
  assert.equal(windowRef.dataLayer[0][2].analytics_storage, "granted");
});

test("GA4 consent follows stored cookie preference and can be updated", () => {
  const { windowRef } = createBrowserHarness();
  windowRef.localStorage.values.set("cookie-consent", "accepted");
  windowRef.gtag = (...args) => windowRef.dataLayer.push(args);

  assert.equal(hasGrantedAnalyticsConsent(windowRef), true);
  assert.equal(updateGa4Consent(false, windowRef), true);
  assert.equal(windowRef.dataLayer[0][0], "consent");
  assert.equal(windowRef.dataLayer[0][2].analytics_storage, "denied");
});

test("React app boots GA4 and environment docs expose the launch variable", () => {
  assert.match(appSource, /import \{ installGa4 \} from "@\/lib\/ga4";/);
  assert.match(appSource, /<AppInner \/>/);
  assert.match(appSource, /installGa4\(\)/);
  assert.doesNotMatch(indexHtml, /G-XXXXXXXXXX/);
  assert.match(indexHtml, /GA4 loads from the React bootstrap/);
  assert.match(envReadme, /VITE_GA4_MEASUREMENT_ID/);
  assert.match(docsEnvReadme, /VITE_GA4_MEASUREMENT_ID/);
});
