import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");

const inputPath = path.join(root, "qa", "results", "customer-experience-playwright.json");
const outputPath = path.join(root, "qa", "results", "customer-experience-playwright-status.json");

if (!fs.existsSync(inputPath)) {
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), checks: {} }, null, 2)}\n`
  );
  console.log(`No playwright JSON report found. Wrote empty status file to ${outputPath}`);
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const checks = {};

function collectSpecs(suite, bucket = []) {
  if (Array.isArray(suite.specs)) {
    bucket.push(...suite.specs);
  }
  if (Array.isArray(suite.suites)) {
    for (const child of suite.suites) {
      collectSpecs(child, bucket);
    }
  }
  return bucket;
}

const specs = collectSpecs(report);

for (const spec of specs) {
  const title = spec.title || "";
  const idMatch = title.match(/\[((?:FE-\d{3}\s*)+)\]/);
  if (!idMatch) {
    continue;
  }

  const ids = idMatch[1].trim().split(/\s+/);
  const tests = spec.tests || [];
  const hasPassingRun = tests.some((entry) =>
    (entry.results || []).some((result) => result.status === "passed")
  );
  const finalResult = hasPassingRun ? "passed" : "failed";

  let note = "Playwright check passed.";
  if (finalResult === "failed") {
    const failingResult = tests
      .flatMap((entry) => entry.results || [])
      .find((result) => result.status !== "passed");
    note =
      failingResult?.error?.message?.split("\n")[0] ||
      failingResult?.status ||
      "Playwright check failed.";
  }

  for (const id of ids) {
    checks[id] = {
      status: finalResult,
      source: "playwright",
      note,
    };
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  checks,
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote playwright status summary to ${outputPath}`);
