import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync("index.html", "utf8");

test("static fallback is hidden before first paint for JavaScript browsers", () => {
  assert.match(indexSource, /<html lang="en" class="no-js">/);
  assert.match(indexSource, /document\.documentElement\.classList\.remove\("no-js"\)/);
  assert.match(indexSource, /document\.documentElement\.classList\.add\("js"\)/);
  assert.match(
    indexSource,
    /html\.js:not\(\.app-fallback-visible\) #root > \.static-fallback/
  );
});

test("static fallback can reappear if the app bundle never replaces it", () => {
  assert.match(indexSource, /window\.setTimeout\(function \(\) \{/);
  assert.match(indexSource, /document\.querySelector\("#root > \.static-fallback"\)/);
  assert.match(indexSource, /classList\.add\("app-fallback-visible"\)/);
});
