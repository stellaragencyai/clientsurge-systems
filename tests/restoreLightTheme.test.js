import test from "node:test";
import assert from "node:assert/strict";

import { restoreLightTheme } from "../src/lib/restoreLightTheme.js";

function createElementMock({ classes = [], attributes = {} } = {}) {
  const classSet = new Set(classes);
  const attrMap = new Map(Object.entries(attributes));

  return {
    style: {},
    classList: {
      remove(value) {
        classSet.delete(value);
      },
      contains(value) {
        return classSet.has(value);
      },
    },
    getAttribute(name) {
      return attrMap.has(name) ? attrMap.get(name) : null;
    },
    setAttribute(name, value) {
      attrMap.set(name, String(value));
    },
    removeAttribute(name) {
      attrMap.delete(name);
    },
    hasAttribute(name) {
      return attrMap.has(name);
    },
  };
}

test("restoreLightTheme removes forced dark markers from document roots", () => {
  const previousDocument = globalThis.document;

  const html = createElementMock({
    classes: ["dark", "theme-dark"],
    attributes: {
      "data-theme": "dark",
      "data-color-scheme": "dark",
      "data-client-surge-dark-disabled": "",
    },
  });
  const body = createElementMock({ classes: ["dark"], attributes: { "data-force-dark": "true" } });
  const createdMeta = createElementMock();

  globalThis.document = {
    documentElement: html,
    body,
    head: {
      querySelector() {
        return null;
      },
      appendChild(node) {
        this.appended = node;
      },
    },
    createElement() {
      return createdMeta;
    },
  };

  try {
    restoreLightTheme();

    assert.equal(html.classList.contains("dark"), false);
    assert.equal(html.classList.contains("theme-dark"), false);
    assert.equal(body.classList.contains("dark"), false);
    assert.equal(html.getAttribute("data-theme"), "light");
    assert.equal(html.getAttribute("data-color-scheme"), "light");
    assert.equal(html.hasAttribute("data-client-surge-dark-disabled"), false);
    assert.equal(body.hasAttribute("data-force-dark"), false);
    assert.equal(html.style.colorScheme, "light");
    assert.equal(body.style.colorScheme, "light");
    assert.equal(createdMeta.getAttribute("name"), "theme-color");
    assert.equal(createdMeta.getAttribute("content"), "#ffffff");
  } finally {
    globalThis.document = previousDocument;
  }
});
