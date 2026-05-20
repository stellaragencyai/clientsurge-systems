#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { stdin, exit } from "node:process";

import {
  buildBasicPackageActivationBrief,
  buildGrowthPackageActivationBrief,
  buildPackageActivationBrief,
  buildProPackageActivationBrief,
} from "../../src/lib/basicPackageActivation.js";

async function readStdin() {
  const chunks = [];
  for await (const chunk of stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function normalizeServiceKeyList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

async function main() {
  const growthMode = process.argv.includes("--growth") || process.argv.includes("--package=growth");
  const proMode = process.argv.includes("--pro") || process.argv.includes("--package=pro");
  const inputPath = process.argv.find((arg) => !arg.startsWith("--") && arg !== process.argv[0] && arg !== process.argv[1]);
  const rawInput = inputPath ? await readFile(inputPath, "utf8") : await readStdin();
  const trimmedInput = rawInput.trim();

  if (!trimmedInput) {
    console.error("Usage: npm run openclaw:basic-package-config -- path/to/intake.json");
    console.error("For automations 1-4: npm run openclaw:basic-package-config -- --growth path/to/intake.json");
    console.error("For automations 1-6: npm run openclaw:basic-package-config -- --pro path/to/intake.json");
    console.error("Or pipe JSON intake into this command.");
    exit(1);
  }

  let intake;
  try {
    intake = JSON.parse(trimmedInput);
  } catch (error) {
    console.error(`Invalid JSON intake: ${error.message}`);
    exit(1);
  }

  const serviceKeysArg = process.argv.find((arg) => arg.startsWith("--services=") || arg.startsWith("--service-keys="));
  const cliServiceKeys = serviceKeysArg
    ? serviceKeysArg.replace(/^--services=|^--service-keys=/, "").split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const intakeServiceKeys = [
    ...normalizeServiceKeyList(intake.service_keys),
    ...normalizeServiceKeyList(intake.selected_service_keys),
    ...normalizeServiceKeyList(intake.package_service_keys),
    ...normalizeServiceKeyList(intake.purchased_service_keys),
  ];
  const serviceKeys = cliServiceKeys.length ? cliServiceKeys : intakeServiceKeys;

  const brief = serviceKeys.length
    ? buildPackageActivationBrief({ intake, serviceKeys })
    : proMode
    ? buildProPackageActivationBrief(intake)
    : growthMode
    ? buildGrowthPackageActivationBrief(intake)
    : buildBasicPackageActivationBrief(intake);
  console.log(JSON.stringify(brief, null, 2));

  if (!brief.validation.valid) {
    exit(2);
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  exit(1);
});
