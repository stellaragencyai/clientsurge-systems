#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(process.cwd());
const asJson = process.argv.includes("--json");

const EXPECTED_TWILIO_NUMBER = process.env.CLIENTSURGE_AUTOMATION_NUMBER || "+18778123630";
const EXPECTED_BASE44_HOST =
  process.env.CLIENTSURGE_BASE44_HOST || "clientsurgesystems.com";
const EXPECTED_SMS_WEBHOOK_FUNCTION =
  process.env.CLIENTSURGE_TWILIO_SMS_WEBHOOK_FUNCTION || "receiveTwilioInboundSms";
const EXPECTED_VOICE_WEBHOOK_FUNCTION =
  process.env.CLIENTSURGE_TWILIO_VOICE_WEBHOOK_FUNCTION || "receiveTwilioMissedCallWebhook";
const REQUIRE_TWILIO_WEBHOOK_KEY =
  process.env.CLIENTSURGE_REQUIRE_TWILIO_WEBHOOK_KEY === "true";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
    ...options,
  });

  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function commandExists(command) {
  const probe = process.platform === "win32"
    ? run("where.exe", [command])
    : run("command", ["-v", command], { shell: true });
  return probe.ok;
}

function parseJsonResult(label, result) {
  if (!result.ok) {
    return { ok: false, error: `${label} command failed`, detail: trimForReport(result.stderr || result.stdout) };
  }

  try {
    return { ok: true, value: JSON.parse(result.stdout) };
  } catch (error) {
    return { ok: false, error: `${label} returned invalid JSON`, detail: error.message };
  }
}

function trimForReport(text) {
  return String(text || "").trim().split(/\r?\n/).slice(-8).join("\n");
}

function sanitizeUrlShape(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol,
      host: parsed.host,
      pathname: parsed.pathname,
      has_twilio_webhook_key: parsed.searchParams.has("twilio_webhook_key"),
    };
  } catch {
    return { invalid_url: true };
  }
}

function checkTwilioCli() {
  const version = run("twilio", ["--version"]);
  const profiles = run("twilio", ["profiles:list"]);
  return {
    name: "twilio_cli",
    passed: version.ok && profiles.ok,
    version: trimForReport(version.stdout),
    active_profile_visible: /true/i.test(profiles.stdout),
    failure: version.ok && profiles.ok ? null : trimForReport(version.stderr || profiles.stderr),
  };
}

function checkResendCli() {
  const knownPath = "C:\\Users\\nolan\\.resend\\bin\\resend.exe";
  const directExists = fs.existsSync(knownPath);
  const onPath = commandExists("resend");
  const version = directExists ? run(knownPath, ["--version"]) : null;

  return {
    name: "resend_cli",
    passed: directExists && version?.ok,
    on_path: onPath,
    direct_path_exists: directExists,
    direct_path: knownPath,
    version: version?.ok ? trimForReport(version.stdout) : null,
    failure: version && !version.ok ? trimForReport(version.stderr || version.stdout) : null,
  };
}

function checkBase44Secrets() {
  const result = run("base44", ["secrets", "list"]);
  const required = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "TWILIO_WEBHOOK_KEY",
    "TWILIO_SMS_STATUS_CALLBACK_URL",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
  ];

  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const present = required.filter((name) => new RegExp(`(^|\\s)${name}(\\s|$)`, "m").test(output));
  const missing = required.filter((name) => !present.includes(name));

  return {
    name: "base44_required_secrets",
    passed: result.ok && missing.length === 0,
    present,
    missing,
    failure: result.ok ? null : trimForReport(result.stderr || result.stdout),
  };
}

function checkTwilioNumberRouting() {
  const raw = run("twilio", ["phone-numbers:list", "-o", "json"]);
  const parsed = parseJsonResult("twilio phone-numbers:list", raw);
  if (!parsed.ok) {
    return {
      name: "twilio_automation_number_routing",
      passed: false,
      failure: parsed.detail || parsed.error,
    };
  }

  const numbers = Array.isArray(parsed.value) ? parsed.value : [];
  const number = numbers.find((item) => item.phoneNumber === EXPECTED_TWILIO_NUMBER);
  if (!number) {
    return {
      name: "twilio_automation_number_routing",
      passed: false,
      expected_number: EXPECTED_TWILIO_NUMBER,
      failure: "Expected automation number not found in Twilio account.",
    };
  }

  const smsShape = sanitizeUrlShape(number.smsUrl);
  const voiceShape = sanitizeUrlShape(number.voiceUrl);
  const expectedSmsPath = `/api/functions/${EXPECTED_SMS_WEBHOOK_FUNCTION}`;
  const expectedVoicePath = `/api/functions/${EXPECTED_VOICE_WEBHOOK_FUNCTION}`;

  const checks = {
    sms_method_post: number.smsMethod === "POST",
    voice_method_post: number.voiceMethod === "POST",
    sms_host_ok: smsShape?.host === EXPECTED_BASE44_HOST,
    voice_host_ok: voiceShape?.host === EXPECTED_BASE44_HOST,
    sms_path_ok: smsShape?.pathname === expectedSmsPath,
    voice_path_ok: voiceShape?.pathname === expectedVoicePath,
    sms_auth_shape_ok: REQUIRE_TWILIO_WEBHOOK_KEY ? smsShape?.has_twilio_webhook_key === true : true,
    voice_auth_shape_ok: REQUIRE_TWILIO_WEBHOOK_KEY ? voiceShape?.has_twilio_webhook_key === true : true,
  };

  return {
    name: "twilio_automation_number_routing",
    passed: Object.values(checks).every(Boolean),
    expected_number: EXPECTED_TWILIO_NUMBER,
    expected_host: EXPECTED_BASE44_HOST,
    expected_sms_path: expectedSmsPath,
    expected_voice_path: expectedVoicePath,
    require_twilio_webhook_key: REQUIRE_TWILIO_WEBHOOK_KEY,
    checks,
    sms_url_shape: smsShape,
    voice_url_shape: voiceShape,
  };
}

function checkFunctionFiles() {
  const files = [
    "base44/functions/receiveTwilioMissedCallWebhook/entry.ts",
    "base44/functions/processMissedCallFollowUps/entry.ts",
    "base44/functions/processWebsiteLeadFollowUps/entry.ts",
    "base44/functions/submitLeadCapture/entry.ts",
  ];

  const missing = files.filter((file) => !fs.existsSync(path.join(repoRoot, file)));
  return {
    name: "basic_package_function_files",
    passed: missing.length === 0,
    checked: files,
    missing,
  };
}

const checks = [
  checkTwilioCli(),
  checkResendCli(),
  checkBase44Secrets(),
  checkTwilioNumberRouting(),
  checkFunctionFiles(),
];

const summary = {
  generated_at: new Date().toISOString(),
  repo_root: repoRoot,
  suite: "basic_package_activation_v1_readiness",
  passed: checks.every((check) => check.passed),
  passed_count: checks.filter((check) => check.passed).length,
  failed_count: checks.filter((check) => !check.passed).length,
  checks,
};

if (asJson) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  process.stdout.write("ClientSurge Basic Package Activation V1 Readiness\n");
  process.stdout.write(`Generated: ${summary.generated_at}\n`);
  process.stdout.write(`Status: ${summary.passed ? "PASS" : "FAIL"}\n`);
  process.stdout.write(`Checks: ${summary.passed_count}/${checks.length} passing\n\n`);

  for (const check of checks) {
    process.stdout.write(`- ${check.passed ? "PASS" : "FAIL"} ${check.name}\n`);
    if (check.failure) process.stdout.write(`  ${check.failure}\n`);
    if (check.missing?.length) process.stdout.write(`  Missing: ${check.missing.join(", ")}\n`);
  }
}

process.exit(summary.passed ? 0 : 1);
