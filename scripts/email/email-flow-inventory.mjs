import { mkdir, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";

const REPORT_PATH = path.resolve("reports/email-flow-inventory.md");
const FUNCTIONS_ROOT = path.resolve("base44/functions");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return /\.(js|ts)$/.test(entry.name) ? [fullPath] : [];
  });
}

function rel(file) {
  return file.replace(process.cwd() + path.sep, "").replace(/\\/g, "/");
}

function functionName(file) {
  const parts = rel(file).split("/");
  const index = parts.indexOf("functions");
  return index >= 0 ? parts[index + 1] : path.basename(file);
}

function classifyTrigger(name, source) {
  if (/Campaign/i.test(name)) return "admin campaign send";
  if (/Contact/i.test(name)) return "contact form / admin direct";
  if (/Demo|Booking|Appointment/i.test(name)) return "booking/demo flow";
  if (/Order|Checkout|Payment|Invoice|Billing/i.test(name)) return "payment/order lifecycle";
  if (/Welcome|Portal|Onboarding|Install|GoLive|WentLive|Milestone/i.test(name)) return "onboarding/install lifecycle";
  if (/FollowUp|Nurture|Drip|WinBack|Review|NPS/i.test(name)) return "automation follow-up";
  if (/Admin|Digest|Alert|Credentials|Health/i.test(name)) return "admin/system notification";
  if (source.includes("Deno.serve")) return "function invocation";
  return "shared helper";
}

function extractSnippets(source, pattern) {
  const matches = [...source.matchAll(pattern)];
  return [...new Set(matches.map((match) => match[1] || match[0]))].slice(0, 5);
}

function summarizeTemplate(source) {
  if (source.includes("html:")) return "html";
  if (source.includes("text:")) return "text";
  if (source.includes("body:")) return "body/html";
  return "unknown";
}

function inventoryFile(file) {
  const source = fs.readFileSync(file, "utf8");
  const isEmailFlow =
    source.includes("api.resend.com/emails") ||
    source.includes("resendFetch") ||
    source.includes("Core.SendEmail") ||
    source.includes("sendEmail(") ||
    source.includes("RESEND_API_KEY");
  if (!isEmailFlow) return null;

  const name = functionName(file);
  const senderSnippets = [
    ...extractSnippets(source, /from:\s*([^,\n}]+)/g),
    ...extractSnippets(source, /fromEmail\s*=\s*([^;\n]+)/g),
    ...extractSnippets(source, /senderAddress\(\)/g),
  ];
  const recipientSnippets = [
    ...extractSnippets(source, /to:\s*([^,\n}]+)/g),
    ...extractSnippets(source, /email:\s*([^,\n}]+)/g),
  ];
  const campaignGate = source.includes("EMAIL_CAMPAIGN_ENABLED") || source.includes("EMAIL_DELIVERABILITY_PROOF_STATUS");
  const testMode = source.includes("EMAIL_TEST_MODE") || source.includes("TEST_EMAIL_RECIPIENT") || source.includes("[TEST]");
  const missingProviderSafe = source.includes("RESEND_API_KEY") && (
    source.includes("not configured") ||
    source.includes("missing") ||
    source.includes("No Resend key") ||
    source.includes("missing_resend_api_key")
  );
  const hasLogs = source.includes("CommunicationEvent") || source.includes("console.") || source.includes("provider_message_id");
  const proof = source.includes("provider_message_id") || source.includes("resend_message_id") || source.includes("email_id") || source.includes("emailId");
  const status = campaignGate || !/Campaign/i.test(name)
    ? missingProviderSafe
      ? "READY_REPO_SIDE"
      : "REVIEW_PROVIDER_FAILURE_BEHAVIOR"
    : "BLOCKED_NEEDS_CAMPAIGN_GATE";

  return {
    function: name,
    file: rel(file),
    trigger: classifyTrigger(name, source),
    sender: senderSnippets.join("; ") || "unknown/static platform send",
    recipient: recipientSnippets.join("; ") || "unknown",
    template: summarizeTemplate(source),
    protected_by_test_mode: testMode ? "yes" : "no",
    protected_by_campaign_gate: campaignGate ? "yes" : /Campaign/i.test(name) ? "no" : "not applicable",
    missing_provider_safe: missingProviderSafe ? "yes" : "review",
    logs_or_proof: hasLogs || proof ? "yes" : "review",
    status,
  };
}

async function main() {
  const flows = walk(FUNCTIONS_ROOT).map(inventoryFile).filter(Boolean);
  flows.sort((a, b) => a.function.localeCompare(b.function) || a.file.localeCompare(b.file));
  const statusCounts = flows.reduce((acc, flow) => {
    acc[flow.status] = (acc[flow.status] || 0) + 1;
    return acc;
  }, {});
  const now = new Date().toISOString();
  const lines = [
    "# Email Flow Inventory",
    "",
    `Generated: ${now}`,
    "",
    "## Summary",
    "",
    `- Email-related files scanned: ${flows.length}`,
    `- Status counts: ${Object.entries(statusCounts).map(([key, value]) => `${key}=${value}`).join(", ")}`,
    "",
    "## Flows",
    "",
    "| Function | Trigger | Sender | Recipient | Template | Test Mode | Campaign Gate | Provider Missing Safe | Logs/Proof | Status |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...flows.map((flow) =>
      `| \`${flow.function}\` | ${flow.trigger} | \`${flow.sender.replaceAll("|", "\\|")}\` | \`${flow.recipient.replaceAll("|", "\\|")}\` | ${flow.template} | ${flow.protected_by_test_mode} | ${flow.protected_by_campaign_gate} | ${flow.missing_provider_safe} | ${flow.logs_or_proof} | ${flow.status} |`
    ),
    "",
    "## Files",
    "",
    ...flows.map((flow) => `- \`${flow.file}\``),
    "",
    "## Notes",
    "",
    "- `not applicable` campaign gate means the flow is transactional/system, not outreach.",
    "- `review` indicates static analysis could not prove the condition; see deliverability hardening report for remediation.",
  ];

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
  console.log(`Email flow inventory: ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(`[email-flow-inventory] Failed: ${error.message}`);
  process.exitCode = 1;
});
