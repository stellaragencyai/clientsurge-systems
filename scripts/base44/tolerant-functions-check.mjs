#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const APP_CONFIG_PATH = path.resolve("base44/.app.jsonc");
const AUTH_PATH = path.join(os.homedir(), ".base44", "auth", "auth.json");
const BASE44_API_URL = process.env.BASE44_API_URL || "https://app.base44.com";

const SIMPLE_UNITS = new Set(["minutes", "hours", "days", "weeks", "months"]);
const SCHEDULE_MODES = new Set(["one-time", "recurring"]);
const SCHEDULE_TYPES = new Set(["simple", "cron"]);
const END_TYPES = new Set(["never", "on", "after", undefined]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function inferRepeatInterval(automation) {
  if (automation.repeat_interval != null) return automation.repeat_interval;

  const text = `${automation.name || ""} ${automation.description || ""}`.toLowerCase();
  if (text.includes("bi-weekly") || text.includes("every other")) return 2;

  return 1;
}

function normalizeAutomation(automation) {
  const normalized = { ...automation };
  const notes = [];

  if (
    normalized.type === "scheduled" &&
    normalized.schedule_mode === "recurring" &&
    normalized.schedule_type === "simple" &&
    normalized.repeat_interval == null
  ) {
    normalized.repeat_interval = inferRepeatInterval(normalized);
    notes.push(`repeat_interval:null -> ${normalized.repeat_interval}`);
  }

  return { normalized, notes };
}

function validateAutomation(automation) {
  const issues = [];

  if (!automation || typeof automation !== "object") {
    return ["automation must be an object"];
  }

  if (!automation.name || typeof automation.name !== "string") {
    issues.push("name must be a non-empty string");
  }

  if (automation.type === "scheduled") {
    if (!SCHEDULE_MODES.has(automation.schedule_mode)) {
      issues.push(`invalid schedule_mode: ${automation.schedule_mode}`);
    }

    if (automation.schedule_mode === "one-time" && !automation.one_time_date) {
      issues.push("one-time schedule requires one_time_date");
    }

    if (automation.schedule_mode === "recurring") {
      if (!SCHEDULE_TYPES.has(automation.schedule_type)) {
        issues.push(`invalid schedule_type: ${automation.schedule_type}`);
      }

      if (automation.schedule_type === "cron" && !automation.cron_expression) {
        issues.push("cron schedule requires cron_expression");
      }

      if (automation.schedule_type === "simple") {
        if (!SIMPLE_UNITS.has(automation.repeat_unit)) {
          issues.push(`invalid repeat_unit: ${automation.repeat_unit}`);
        }
        if (!Number.isInteger(automation.repeat_interval) || automation.repeat_interval < 1) {
          issues.push(`repeat_interval must be a positive integer, got ${automation.repeat_interval}`);
        }
      }
    }

    if (!END_TYPES.has(automation.ends_type)) {
      issues.push(`invalid ends_type: ${automation.ends_type}`);
    }
  } else if (automation.type === "entity") {
    if (!automation.entity_name) issues.push("entity automation requires entity_name");
    if (!Array.isArray(automation.event_types) || automation.event_types.length === 0) {
      issues.push("entity automation requires event_types");
    }
  } else if (automation.type === "connector") {
    if (!automation.integration_type) issues.push("connector automation requires integration_type");
    if (!Array.isArray(automation.events)) issues.push("connector automation requires events");
  } else {
    issues.push(`invalid type: ${automation.type}`);
  }

  return issues;
}

async function main() {
  const app = readJson(APP_CONFIG_PATH);
  const auth = readJson(AUTH_PATH);
  const url = new URL(`/api/apps/${app.id}/backend-functions`, BASE44_API_URL);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "User-Agent": "ClientSurge Base44 tolerant metadata check",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch Base44 functions: ${response.status} ${body.slice(0, 300)}`);
  }

  const payload = await response.json();
  const functions = Array.isArray(payload.functions) ? payload.functions : [];
  const normalizations = [];
  const failures = [];
  let automationCount = 0;

  for (const fn of functions) {
    const automations = Array.isArray(fn.automations) ? fn.automations : [];
    automationCount += automations.length;

    automations.forEach((automation, index) => {
      const { normalized, notes } = normalizeAutomation(automation);
      if (notes.length) {
        normalizations.push({
          function: fn.name,
          automation: automation.name || `automation[${index}]`,
          index,
          notes,
        });
      }

      const issues = validateAutomation(normalized);
      if (issues.length) {
        failures.push({
          function: fn.name,
          automation: automation.name || `automation[${index}]`,
          index,
          issues,
        });
      }
    });
  }

  const summary = {
    generated_at: new Date().toISOString(),
    app_id: app.id,
    functions_count: functions.length,
    automations_count: automationCount,
    legacy_normalizations_count: normalizations.length,
    failures_count: failures.length,
    legacy_normalizations: normalizations,
    failures,
  };

  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write("Base44 Function Metadata Tolerant Check\n");
    process.stdout.write(`Generated: ${summary.generated_at}\n`);
    process.stdout.write(`Status: ${failures.length ? "FAIL" : "PASS"}\n`);
    process.stdout.write(`Functions: ${functions.length}\n`);
    process.stdout.write(`Automations: ${automationCount}\n`);
    process.stdout.write(`Legacy normalizations: ${normalizations.length}\n`);
    process.stdout.write(`Failures: ${failures.length}\n`);

    if (normalizations.length) {
      process.stdout.write("\nNormalized legacy schedule rows:\n");
      for (const item of normalizations) {
        process.stdout.write(`- ${item.function} / ${item.automation}: ${item.notes.join(", ")}\n`);
      }
    }

    if (failures.length) {
      process.stdout.write("\nFailures:\n");
      for (const item of failures) {
        process.stdout.write(`- ${item.function} / ${item.automation}: ${item.issues.join("; ")}\n`);
      }
    }
  }

  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
