import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const functionsRoot = join(repoRoot, "base44", "functions");

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

function classify(name, source) {
  const text = `${name}\n${source}`.toLowerCase();
  return {
    sms: /sms|twilio|phone|missed.call|text.back/.test(text),
    email: /email|resend|unsubscribe|deliverability/.test(text),
    phone: /call|voice|twiml|missed.call|twilio/.test(text),
    webhook: /webhook|statuscallback|x-twilio-signature|resend-signature/.test(text),
    outbound: /messages\.json|resend\.com\/emails|sendemail|sendsms|send_sms|direction:\s*['"]outbound/.test(text),
    inbound: /direction:\s*['"]inbound|receive|webhook|incoming/.test(text),
  };
}

function hasAny(source, patterns) {
  return patterns.some((pattern) => pattern.test(source));
}

function auditSource(name, deployedFile, source) {
  const kind = classify(name, source);
  const findings = [];
  const commsRelated = kind.sms || kind.email || kind.phone || kind.webhook;
  if (!commsRelated) return { name, deployed_file: deployedFile, ...kind, findings };

  if (/sk_live_|rk_live_|SG\.|AC[a-f0-9]{30,}|xox[baprs]-/i.test(source)) findings.push("possible_hardcoded_provider_secret");

  if (kind.sms && kind.outbound && !hasAny(source, [/appendSmsOptOut/, /Reply STOP/i, /sms_opt_out/i, /do_not_contact/i, /sms_permission/i])) {
    findings.push("sms_outbound_missing_visible_opt_out_guard_marker");
  }

  if (kind.sms && kind.webhook && !hasAny(source, [/X-Twilio-Signature/, /validateTwilioSignature/, /TWILIO_WEBHOOK_KEY/, /signature/i])) {
    findings.push("sms_webhook_missing_signature_marker");
  }

  if (kind.sms && kind.outbound && !hasAny(source, [/StatusCallback/, /TWILIO_SMS_STATUS_CALLBACK_URL/, /provider_message_id/, /CommunicationEvent/])) {
    findings.push("sms_outbound_missing_delivery_evidence_marker");
  }

  if (kind.email && kind.outbound && !hasAny(source, [/unsubscribe/i, /email_opt_out/i, /do_not_contact/i, /deliverability/i, /getEmailOutreachGate/])) {
    findings.push("email_outbound_missing_unsubscribe_or_deliverability_marker");
  }

  if (kind.outbound && !hasAny(source, [/CommunicationEvent/, /Messages\.create/, /provider_message_id/, /metadata_json/])) {
    findings.push("outbound_missing_trace_evidence_marker");
  }

  return { name, deployed_file: deployedFile, ...kind, findings };
}

export function collectCommunicationComplianceAudit({ root = functionsRoot } = {}) {
  const directories = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return directories.map((name) => {
    const dir = join(root, name);
    const deployed = deployedSourceFor(dir);
    const source = deployed.path ? readMaybe(deployed.path) : [readMaybe(join(dir, "entry.ts")), readMaybe(join(dir, "main.ts"))].join("\n");
    return auditSource(name, deployed.path ? relative(repoRoot, deployed.path).replaceAll("\\", "/") : null, source);
  }).filter((row) => row.sms || row.email || row.phone || row.webhook);
}

export function summarizeCommunicationCompliance(rows) {
  return {
    summary: {
      communication_functions: rows.length,
      sms_functions: rows.filter((row) => row.sms).length,
      email_functions: rows.filter((row) => row.email).length,
      phone_functions: rows.filter((row) => row.phone).length,
      webhook_functions: rows.filter((row) => row.webhook).length,
      outbound_functions: rows.filter((row) => row.outbound).length,
      inbound_functions: rows.filter((row) => row.inbound).length,
      functions_with_findings: rows.filter((row) => row.findings.length > 0).length,
    },
    findings: rows.flatMap((row) => row.findings.map((finding) => ({ function: row.name, finding }))),
    rows,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = collectCommunicationComplianceAudit();
  const report = summarizeCommunicationCompliance(rows);
  if (process.argv.includes("--write")) {
    const outDir = join(repoRoot, "tmp");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "area8-communication-compliance-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}
