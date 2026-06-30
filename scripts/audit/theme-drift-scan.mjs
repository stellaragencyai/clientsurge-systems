#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const shouldFix = args.has("--fix");
const failOnWarnings = args.has("--fail-on-warnings");

const TARGET_DIRS = ["src", "public"];
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".vite"]);
const TEXT_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".css", ".html", ".md", ".svg", ""]);

const ALLOWLIST = new Map([
  ["src/components/landing/HeroDashboardScreen.jsx", "Intentional dark iPad/device mockup."],
  ["src/components/visual-effects/BeforeAfterSlider.jsx", "Intentional image comparison overlay."],
]);

const PUBLIC_UI_RE = /^(src\/(components|pages|legacy-pages|internal-pages)|public\/)/;
const STORE_MODAL_RE = /^src\/components\/store\/.*(?:Modal|Sidebar|Drawer|Toast)\.(jsx|tsx|js|ts)$/;
const MODAL_LIKE_RE = /(?:Modal|Sidebar|Drawer|Toast)\.(jsx|tsx|js|ts)$/;

const RULES = [
  {
    id: "legacy-dark-modal-gradient",
    severity: "critical",
    description: "Old dark/neon modal surface found in public UI source.",
    pattern: /linear-gradient\([^\n]*?(#0D1B2E|#060D18|#0A0F1E)[^\n]*?\)/gi,
    appliesTo: (file) => PUBLIC_UI_RE.test(file),
  },
  {
    id: "legacy-neon-cyan-token",
    severity: "warning",
    description: "Legacy neon cyan/green token found; review against ClientSurge white/blue theme tokens.",
    pattern: /#00D4FF|#00FFB3/gi,
    appliesTo: (file) => PUBLIC_UI_RE.test(file),
  },
  {
    id: "black-modal-backdrop",
    severity: "warning",
    description: "Black modal backdrop found; public/store modals should use the soft white/blue overlay.",
    pattern: /background:\s*["'`]rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.(45|5|50|55|6|65|7|75)\)["'`]/g,
    appliesTo: (file) => MODAL_LIKE_RE.test(file),
  },
  {
    id: "raw-black-modal-border",
    severity: "warning",
    description: "Raw black modal border found; use blue-tinted modal border instead.",
    pattern: /border:\s*["'`]1px solid rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.(08|1|10|12|15)\)["'`]/g,
    appliesTo: (file) => MODAL_LIKE_RE.test(file),
  },
  {
    id: "raw-black-modal-shadow",
    severity: "warning",
    description: "Raw black modal shadow found; use blue-tinted modal shadow instead.",
    pattern: /boxShadow:\s*["'`]0 20px 60px rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.(25|3|30|35)\)["'`]/g,
    appliesTo: (file) => MODAL_LIKE_RE.test(file),
  },
];

const FIXES = [
  {
    id: "store-modal-soft-overlay",
    appliesTo: (file) => STORE_MODAL_RE.test(file),
    replacements: [
      [/background:\s*["'`]rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.5\)["'`]/g, 'background: "linear-gradient(135deg, rgba(245,251,255,0.72), rgba(5,54,92,0.34))"'],
      [/backdropFilter:\s*["'`]blur\(4px\)["'`]/g, 'backdropFilter: "blur(12px) saturate(1.05)"'],
      [/border:\s*["'`]1px solid rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.1\)["'`]/g, 'border: "1px solid rgba(0,174,239,0.24)"'],
      [/borderBottom:\s*["'`]1px solid rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.08\)["'`]/g, 'borderBottom: "1px solid rgba(0,136,204,0.12)"'],
      [/borderTop:\s*["'`]1px solid rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.08\)["'`]/g, 'borderTop: "1px solid rgba(0,136,204,0.12)"'],
      [/boxShadow:\s*["'`]0 20px 60px rgba\(0\s*,\s*0\s*,\s*0\s*,\s*0\.3\)["'`]/g, 'boxShadow: "0 34px 90px rgba(0,59,143,0.22), 0 14px 38px rgba(0,174,239,0.12), inset 0 1px 0 rgba(255,255,255,0.95)"'],
    ],
  },
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else files.push(fullPath);
  }
  return files;
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function isTextFile(file) {
  const ext = path.extname(file);
  if (!TEXT_EXTENSIONS.has(ext)) return false;
  const stat = fs.statSync(file);
  if (stat.size > 750_000) return false;
  const sample = fs.readFileSync(file);
  return !sample.includes(0);
}

function lineNumberFor(content, index) {
  return content.slice(0, index).split("\n").length;
}

function scanFile(file) {
  const rel = relative(file);
  const content = fs.readFileSync(file, "utf8");
  if (ALLOWLIST.has(rel)) return [];

  const findings = [];
  for (const rule of RULES) {
    if (!rule.appliesTo(rel)) continue;
    for (const match of content.matchAll(rule.pattern)) {
      findings.push({
        file: rel,
        line: lineNumberFor(content, match.index || 0),
        id: rule.id,
        severity: rule.severity,
        description: rule.description,
        match: match[0].slice(0, 140),
      });
    }
  }
  return findings;
}

function applyFixes(file) {
  const rel = relative(file);
  let content = fs.readFileSync(file, "utf8");
  let next = content;

  for (const fix of FIXES) {
    if (!fix.appliesTo(rel)) continue;
    for (const [pattern, replacement] of fix.replacements) {
      next = next.replace(pattern, replacement);
    }
  }

  if (next !== content) {
    fs.writeFileSync(file, next);
    return true;
  }
  return false;
}

const files = TARGET_DIRS
  .flatMap((dir) => walk(path.join(ROOT, dir)))
  .filter(isTextFile);

let changed = [];
if (shouldFix) {
  changed = files.filter(applyFixes).map(relative);
}

const findings = files.flatMap(scanFile);
const critical = findings.filter((finding) => finding.severity === "critical");
const warnings = findings.filter((finding) => finding.severity === "warning");

console.log("\nClientSurge Theme Drift Scan");
console.log("============================");
console.log(`Scanned files: ${files.length}`);
console.log(`Changed by --fix: ${changed.length}`);
console.log(`Critical findings: ${critical.length}`);
console.log(`Warnings: ${warnings.length}`);

if (changed.length) {
  console.log("\nAuto-fixed files:");
  for (const file of changed) console.log(`- ${file}`);
}

if (findings.length) {
  console.log("\nFindings:");
  for (const finding of findings.slice(0, 200)) {
    console.log(`- [${finding.severity.toUpperCase()}] ${finding.file}:${finding.line} ${finding.id}`);
    console.log(`  ${finding.description}`);
    console.log(`  ${finding.match}`);
  }
  if (findings.length > 200) console.log(`...${findings.length - 200} more findings not shown.`);
} else {
  console.log("\nNo theme drift findings detected.");
}

if (critical.length > 0 || (failOnWarnings && warnings.length > 0)) {
  process.exit(1);
}
