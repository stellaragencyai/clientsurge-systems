#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const repoRoot = process.cwd();
const SCAN_DIRS = ["src", "public", "base44/functions"];
const BLOCKED_PATTERNS = [
  {
    label: "static ClientSurge Stripe Payment Link",
    regex: /https:\/\/checkout\.clientsurgesystems\.com\/b\//g,
  },
  {
    label: "static Stripe buy link",
    regex: /https:\/\/buy\.stripe\.com\//g,
  },
];

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".html",
  ".css",
  ".md",
]);

function hasTextExtension(pathname) {
  const lower = pathname.toLowerCase();
  return [...TEXT_EXTENSIONS].some((extension) => lower.endsWith(extension));
}

async function walk(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "build"].includes(entry.name)) continue;
      files.push(...await walk(path));
      continue;
    }
    if (entry.isFile() && hasTextExtension(path)) files.push(path);
  }
  return files;
}

const findings = [];
for (const dir of SCAN_DIRS) {
  for (const file of await walk(join(repoRoot, dir))) {
    const text = await readFile(file, "utf8");
    for (const pattern of BLOCKED_PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (!pattern.regex.test(text)) continue;
      findings.push({ file: relative(repoRoot, file), label: pattern.label });
    }
  }
}

if (findings.length) {
  console.error("Static Stripe Payment Links are banned from public checkout source.");
  console.error("Route buyers through /product-signup?package=<package_key> so createCheckoutSession creates a fresh Stripe Checkout Session.");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.label}`);
  }
  process.exit(1);
}

console.log("No static Stripe Payment Links found in public checkout source.");
