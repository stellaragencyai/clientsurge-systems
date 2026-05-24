import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const ignoredExtensions = new Set([".md", ".json", ".jsonc"]);
const sourceExtensions = new Set([".css", ".js", ".jsx", ".ts", ".tsx"]);

const oldThemePatterns = [
  /#(?:6b3f1f|7a4825|7a4f2e|8b5b34|9a5c2e|a0714f|b77b47|c8965c|f5d9a8|f5e6d0|92400e|d97706|f59e0b|b45309|fbbf24|fcd34d|fde68a|f97316|eab308|ffbd2e|d4b88e)/i,
  /rgba\((?:154,\s*92,\s*46|200,\s*150,\s*92|120,\s*70,\s*20|122,\s*72,\s*37|245,\s*158,\s*11|212,\s*184,\s*142|27,\s*20,\s*13|30,\s*22,\s*14|40,\s*28,\s*16|42,\s*30,\s*10|20,\s*15,\s*8|28,\s*20,\s*10),/i,
  /\b(?:shiny-brown|BROWN_GOLD|from-amber|to-amber|bg-amber|text-amber|border-amber|from-orange|to-orange|bg-orange|text-orange|border-orange|bg-yellow|text-yellow|border-yellow)\b/,
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    const extension = path.extname(entry.name);
    if (sourceExtensions.has(extension) && !ignoredExtensions.has(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

test("active website source does not use the retired brown theme palette", () => {
  const matches = [];

  for (const file of walk(sourceRoot)) {
    const relative = path.relative(root, file);
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (oldThemePatterns.some((pattern) => pattern.test(line))) {
        matches.push(`${relative}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(matches, []);
});
