import { mkdir, readFile, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";

const REPORT_PATH = path.resolve("reports/resend-provider-verification.json");
const DOMAIN = "clientsurgesystems.com";
const RESEND_DOMAINS_ENDPOINT = "https://api.resend.com/domains";
const REPO_API_REFERENCES = [
  {
    file: "base44/functions/testProviderConnections/entry.ts",
    endpoint: RESEND_DOMAINS_ENDPOINT,
    purpose: "Admin/provider connection check for Resend domains.",
  },
  {
    file: "base44/functions/_shared/providerTests.js",
    endpoint: "base44.integrations.Core.SendEmail",
    purpose: "Admin integration test path for email provider send proof.",
  },
  {
    file: "base44/functions/_shared/integrationHealth.js",
    endpoint: "CommunicationEvent provider health derivation",
    purpose: "Summarizes recent Resend/Gmail activity and failures.",
  },
  {
    file: "base44/functions/healthCheck/entry.ts",
    endpoint: "healthCheck",
    purpose: "General uptime endpoint and backend 5xx email alert helper.",
  },
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function getSecret(name) {
  return process.env[name] || parseEnvFile(path.resolve(".env.local"))[name] || "";
}

function redactDomain(domain = {}) {
  return {
    id_present: Boolean(domain.id),
    name: domain.name || "",
    status: domain.status || domain.state || "",
    region: domain.region || "",
    created_at: domain.created_at || "",
    records_count: Array.isArray(domain.records) ? domain.records.length : null,
    records: Array.isArray(domain.records)
      ? domain.records.map((record) => ({
          record: record.record || record.name || "",
          type: record.type || "",
          status: record.status || "",
          ttl: record.ttl ?? null,
          priority: record.priority ?? null,
          value_present: Boolean(record.value),
        }))
      : [],
  };
}

async function auditRepoReferences() {
  const findings = [];
  for (const ref of REPO_API_REFERENCES) {
    let exists = false;
    let containsEndpoint = false;
    try {
      const source = await readFile(ref.file, "utf8");
      exists = true;
      containsEndpoint = ref.endpoint.startsWith("http")
        ? source.includes(ref.endpoint)
        : source.includes(ref.endpoint.split(".")[0]) || source.includes(ref.endpoint);
    } catch {
      exists = false;
    }
    findings.push({ ...ref, exists, contains_endpoint_reference: containsEndpoint });
  }
  return findings;
}

async function callResendDomains(apiKey) {
  const startedAt = new Date().toISOString();
  if (!apiKey) {
    return {
      attempted: false,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      status: "BLOCKED",
      reason: "RESEND_API_KEY not present in process env or .env.local. No secret was printed.",
    };
  }

  try {
    const response = await fetch(RESEND_DOMAINS_ENDPOINT, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await response.json().catch(() => ({}));
    const domains = Array.isArray(body.data) ? body.data.map(redactDomain) : [];
    const target = domains.find((domain) => domain.name === DOMAIN) || null;
    return {
      attempted: true,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      status: response.ok ? "PASS" : "FAIL",
      http_status: response.status,
      target_domain_found: Boolean(target),
      target_domain: target,
      domains_seen: domains.map((domain) => ({ name: domain.name, status: domain.status, records_count: domain.records_count })),
      error: response.ok ? null : (body.message || body.error || "Resend domains API returned non-OK status"),
    };
  } catch (error) {
    return {
      attempted: true,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      status: "FAIL",
      error: error.message,
    };
  }
}

async function main() {
  const apiKey = getSecret("RESEND_API_KEY");
  const report = {
    timestamp: new Date().toISOString(),
    domain: DOMAIN,
    secret_presence: {
      process_env_resend_api_key_present: Boolean(process.env.RESEND_API_KEY),
      env_local_resend_api_key_present: Boolean(parseEnvFile(path.resolve(".env.local")).RESEND_API_KEY),
      secret_values_redacted: true,
    },
    repo_provider_verification_references: await auditRepoReferences(),
    provider_api_call: await callResendDomains(apiKey),
    result: "PENDING",
  };
  report.result = report.provider_api_call.status === "PASS" && report.provider_api_call.target_domain_found
    ? "PASS"
    : report.provider_api_call.status === "BLOCKED"
      ? "BLOCKED"
      : "FAIL";

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Resend provider verification: ${report.result}`);
  console.log(`Report: ${REPORT_PATH}`);
  if (report.result === "FAIL") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[resend-provider-verification] Failed: ${error.message}`);
  process.exitCode = 1;
});
