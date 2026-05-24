import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (/\.(jsx|tsx|js|html)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripBlockComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function findImgTags(source) {
  const tags = [];
  let index = 0;

  while ((index = source.indexOf("<img", index)) !== -1) {
    let cursor = index + 4;
    let braceDepth = 0;
    let quote = null;

    for (; cursor < source.length; cursor += 1) {
      const char = source[cursor];
      const prev = source[cursor - 1];

      if (quote) {
        if (char === quote && prev !== "\\") quote = null;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        quote = char;
      } else if (char === "{") {
        braceDepth += 1;
      } else if (char === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
      } else if (char === ">" && braceDepth === 0) {
        tags.push(source.slice(index, cursor + 1));
        index = cursor + 1;
        break;
      }
    }
  }

  return tags;
}

test("rendered img tags include explicit width and height attributes", () => {
  const offenders = [];

  for (const filePath of [...collectFiles("src"), "index.html"]) {
    const source = stripBlockComments(readFileSync(filePath, "utf8"));
    for (const tag of findImgTags(source)) {
      if (!/\bwidth\s*=/.test(tag) || !/\bheight\s*=/.test(tag)) {
        offenders.push(`${filePath}: ${tag.replace(/\s+/g, " ").slice(0, 160)}`);
      }
    }
  }

  assert.deepEqual(offenders, []);
});
