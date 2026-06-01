import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../src/legacy-pages/AdminSettings.jsx", import.meta.url),
  "utf8",
);

test("AdminSettings test connection uses provider payload expected by backend", () => {
  assert.match(source, /provider,\s*\n\s*\}/);
  assert.doesNotMatch(source, /provider_type:\s*providerType/);
});

test("AdminSettings test connection maps email tab to resend provider", () => {
  assert.match(source, /providerType === "email" \? "resend" : providerType/);
  assert.match(source, /resultKey = providerType === "email" \? "email" : providerType/);
});
