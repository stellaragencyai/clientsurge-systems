import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");

function run(label, command, args) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

const codeAuditStatus = run(
  "Customer experience code audit",
  "node",
  ["scripts/qa/run-customer-experience-code-audit.mjs"]
);

const changeAwareStatus = run(
  "Change-aware customer QA generation",
  "node",
  ["scripts/qa/generate-change-aware-customer-checks.mjs"]
);

const playwrightStatus = run(
  "Customer experience browser checks",
  "npx",
  ["playwright", "test", "-c", "playwright.customer-experience.config.mjs"]
);

const playwrightExtractStatus = run(
  "Extract customer experience browser status",
  "node",
  ["scripts/qa/extract-customer-experience-playwright-status.mjs"]
);

const syncStatus = run(
  "Generate live customer experience markdown",
  "node",
  ["scripts/qa/generate-customer-experience-live-report.mjs"]
);

process.exit(codeAuditStatus || changeAwareStatus || playwrightStatus || playwrightExtractStatus || syncStatus);
