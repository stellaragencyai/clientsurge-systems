#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

function readArg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function resolveSha() {
  const explicit = readArg("--sha") || process.env.RELEASE_SHA || process.env.GITHUB_SHA;
  if (explicit) return explicit.trim();
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

const sha = resolveSha();
const repository = process.env.GITHUB_REPOSITORY || "stellaragencyai/clientsurge-systems";
const output = resolve(readArg("--output", "public/release.json"));
const payload = {
  sha,
  short_sha: sha.slice(0, 12),
  repository,
  branch: process.env.GITHUB_REF_NAME || process.env.RELEASE_BRANCH || "main",
  built_at: new Date().toISOString(),
  app_id: process.env.BASE44_APP_ID || "69dc4a79656fdba136d413d3",
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, output, ...payload }, null, 2));
