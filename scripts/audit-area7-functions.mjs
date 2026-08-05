import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const functionsRoot = join(repoRoot, "base44", "functions");

const CRITICAL_FUNCTIONS = new Set([
  "automationOrchestrator",
  "receiveTwilioMissedCallWebhook",
  "receiveResendWebhook",
  "sendInstantLeadResponseSms",
  "sendWebsiteLeadResponse",
  "processWebsiteLeadFollowUps",
  "processMissedCallFollowUps",
  "processNurtureCampaigns",
  "sendDailyDigest",
  "dailyDigestGate",
  "handleBookingTrigger",
  "triggerAutoReviewRequest",
  "sendReviewRequest",
  "runLeadReactivationTest",
  "automatedBillingRecovery",
  "bookingConfirmationLoop",
  "scheduleFollowUpSMS",
]);

function readMaybe(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function deployedSourceFor(dir) {
  const entryPath = join(dir, "entry.ts");
  const mainPath = join(dir, "main.ts");
  if (existsSync(entryPath)) return { path: entryPath, kind: "entry" };
  if (existsSync(mainPath)) return { path: mainPath, kind: "main" };
  return { path: null, kind: "missing" };
}

function hasAny(source, patterns) {
  return patterns.some((pattern) => pattern.test(source));
}

function classifyFunction(name, source) {
  const lower = `${name}\n${source}`.toLowerCase();
  const authSignals = {
    requiresAdminUser: /requireAdminUser\s*\(/.test(source),
    requiresAuthenticatedUser: /requireAuthenticatedUser\s*\(/.test(source),
    requiresOwnerOrAdmin: /requireOwnerOrAdmin\s*\(/.test(source),
    requiresSignedInternal: /requireSignedInternalInvocation\s*\(/.test(source),
    requiresAdminOrSignedInternal: /requireAdminOrSignedInternalInvocation\s*\(/.test(source),
    authMe: /base44\.auth\.me\s*\(/.test(source),
    webhookSignature: /signature|constructEvent|validateTwilioSignature|X-Twilio-Signature|stripe\.webhooks|shared secret|webhook secret/i.test(source),
  };
  const authorization = authSignals.requiresAdminOrSignedInternal
    ? "admin_or_signed_internal"
    : authSignals.requiresSignedInternal
      ? "signed_internal"
      : authSignals.requiresOwnerOrAdmin
        ? "owner_or_admin"
        : authSignals.requiresAdminUser
          ? "admin"
          : authSignals.requiresAuthenticatedUser || authSignals.authMe
            ? "authenticated"
            : authSignals.webhookSignature
              ? "signed_webhook_or_provider_verified"
              : "no_obvious_auth_guard";

  return {
    critical: CRITICAL_FUNCTIONS.has(name),
    touchesTwilio: /twilio|sms|phone|call/.test(lower),
    touchesResend: /resend|email/.test(lower),
    touchesStripe: /stripe|checkout|billing|invoice|subscription/.test(lower),
    publicWebhook: /webhook|statuscallback|twilioml|resend webhook/.test(lower),
    scheduled: /scheduled|cron|daily|every|processor|process/.test(lower),
    authorization,
    ...authSignals,
  };
}

export function collectFunctionAudit({ root = functionsRoot } = {}) {
  const directories = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return directories.map((name) => {
    const dir = join(root, name);
    const deployed = deployedSourceFor(dir);
    const deployedSource = deployed.path ? readMaybe(deployed.path) : "";
    const entrySource = readMaybe(join(dir, "entry.ts"));
    const mainSource = readMaybe(join(dir, "main.ts"));
    const combinedSource = [entrySource, mainSource].filter(Boolean).join("\n\n/* --- main/entry split --- */\n\n");
    const classification = classifyFunction(name, combinedSource);

    const findings = [];
    if (!deployed.path) findings.push("missing_entry_or_main");
    if (deployed.path && !/Deno\.serve\s*\(/.test(deployedSource) && !/import ['\"]\.\/main\.ts['\"]/.test(deployedSource)) findings.push("deployed_source_has_no_Deno_serve_or_wrapper");
    if (entrySource && mainSource && !/import ['\"]\.\/main\.ts['\"]/.test(entrySource) && !/STALE|deployed source of truth|Do NOT edit/i.test(mainSource)) findings.push("entry_main_dual_source_without_clear_source_of_truth");
    if (classification.critical && !hasAny(combinedSource, [/CommunicationEvent/, /logAutomationExecution/, /AutomationExecutionLog/, /calculateDeploymentHealth/, /provider_message_id/, /StatusCallback/])) findings.push("critical_function_missing_observability_marker");
    if ((classification.touchesTwilio || classification.touchesResend || classification.touchesStripe) && /sk_live_|rk_live_|SG\.|AC[a-fA-F0-9]{30,}|xox[baprs]-/.test(combinedSource)) findings.push("possible_hardcoded_provider_secret");
    if (classification.touchesTwilio && !hasAny(combinedSource, [/TWILIO_/, /StatusCallback/, /validateTwilio/i, /twilioFetch/])) findings.push("twilio_function_missing_provider_guard_marker");
    if (classification.touchesResend && !hasAny(combinedSource, [/RESEND_/, /resendFetch/, /receiveResendWebhook/, /emailDeliverability/i])) findings.push("resend_function_missing_provider_guard_marker");
    if (classification.publicWebhook && !hasAny(combinedSource, [/signature/i, /validate/i, /twilio/i, /resend/i, /shared secret/i, /AUTOMATION_SHARED_SECRET/])) findings.push("webhook_missing_validation_marker");
    if (classification.critical && !hasAny(combinedSource, [/request_id/, /requestId/, /metadata_json/, /context_id/])) findings.push("critical_function_missing_trace_marker");

    return {
      name,
      deployed_file: deployed.path ? relative(repoRoot, deployed.path).replaceAll("\\", "/") : null,
      deployed_kind: deployed.kind,
      has_entry: Boolean(entrySource),
      has_main: Boolean(mainSource),
      ...classification,
      findings,
    };
  });
}

export function summarizeAudit(rows) {
  const summary = {
    total_functions: rows.length,
    critical_functions: rows.filter((row) => row.critical).length,
    functions_with_findings: rows.filter((row) => row.findings.length > 0).length,
    provider_touching_functions: rows.filter((row) => row.touchesTwilio || row.touchesResend || row.touchesStripe).length,
    webhooks: rows.filter((row) => row.publicWebhook).length,
    scheduled_or_processor_functions: rows.filter((row) => row.scheduled).length,
    by_authorization: rows.reduce((acc, row) => {
      acc[row.authorization] = (acc[row.authorization] || 0) + 1;
      return acc;
    }, {}),
  };
  const findings = rows.flatMap((row) => row.findings.map((finding) => ({ function: row.name, finding })));
  return { summary, findings, rows };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = collectFunctionAudit();
  const report = summarizeAudit(rows);
  const shouldWrite = process.argv.includes("--write");
  if (shouldWrite) {
    const outDir = join(repoRoot, "tmp");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "area7-function-audit.json"), JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify(report, null, 2));
}
