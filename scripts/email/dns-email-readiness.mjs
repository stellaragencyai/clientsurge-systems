import { mkdir, writeFile } from "node:fs/promises";
import dns from "node:dns/promises";
import path from "node:path";

const DOMAIN = process.argv.find((arg) => arg.startsWith("--domain="))?.split("=")[1] || "clientsurgesystems.com";
const REPORT_PATH = path.resolve("artifacts/email/dns-email-readiness.json");
const EXTENDED_REPORT_PATH = path.resolve("artifacts/email/dns-email-readiness-extended.json");
const RESOLVERS = [
  { id: "google", url: "https://dns.google/resolve" },
  { id: "cloudflare", url: "https://cloudflare-dns.com/dns-query" },
];
const GOOGLE_DKIM_SELECTORS = ["google", "selector1", "selector2"];
const GENERIC_DKIM_SELECTORS = ["s1", "s2", "k1", "k2", "mail", "email", "default"];
const RESEND_DKIM_SELECTORS = ["resend", "resend2", "resend3", "rs1", "rs2", "s1", "s2"];
const RESEND_VERIFY_HOSTS = ["_resend", "resend", "resend._domainkey", "resend2._domainkey", "resend3._domainkey"];

function flattenTxt(records = []) {
  return records.map((record) => Array.isArray(record) ? record.join("") : String(record));
}

function normalizeAnswer(answer = {}) {
  return {
    name: answer.name || "",
    type: answer.type,
    ttl: Number.isFinite(answer.TTL) ? answer.TTL : null,
    data: String(answer.data || "").replace(/^"|"$/g, ""),
  };
}

async function resolveNode(kind, name) {
  try {
    if (kind === "MX") return { ok: true, records: await dns.resolveMx(name) };
    if (kind === "TXT") return { ok: true, records: flattenTxt(await dns.resolveTxt(name)) };
    if (kind === "CNAME") return { ok: true, records: await dns.resolveCname(name) };
    throw new Error(`Unsupported record type: ${kind}`);
  } catch (error) {
    return { ok: false, records: [], error: error.code || error.message };
  }
}

async function resolveDoh(resolver, name, type) {
  const url = new URL(resolver.url);
  url.searchParams.set("name", name);
  url.searchParams.set("type", type);

  const response = await fetch(url, {
    headers: resolver.id === "cloudflare" ? { accept: "application/dns-json" } : {},
  });
  const body = await response.json().catch(() => ({}));
  const answers = Array.isArray(body.Answer) ? body.Answer.map(normalizeAnswer) : [];

  return {
    resolver: resolver.id,
    name,
    type,
    ok: response.ok && body.Status === 0 && answers.length > 0,
    status: body.Status ?? null,
    answers,
    min_ttl: answers.length ? Math.min(...answers.map((answer) => answer.ttl ?? Infinity).filter(Number.isFinite)) : null,
  };
}

async function resolveAcrossResolvers(name, type) {
  const results = [];
  for (const resolver of RESOLVERS) {
    try {
      results.push(await resolveDoh(resolver, name, type));
    } catch (error) {
      results.push({ resolver: resolver.id, name, type, ok: false, status: "error", answers: [], error: error.message, min_ttl: null });
    }
  }
  return results;
}

function answerSet(result) {
  return new Set((result.answers || []).map((answer) => answer.data).filter(Boolean));
}

function propagation(results) {
  const resolvers_checked = results.length;
  const resolvers_with_records = results.filter((item) => item.ok).length;
  const sets = results.map(answerSet);
  const union = new Set(sets.flatMap((set) => [...set]));
  const allAgree = sets.length > 0 && sets.every((set) => set.size === union.size && [...union].every((item) => set.has(item)));
  return {
    resolvers_checked,
    resolvers_with_records,
    agreement: allAgree ? "consistent" : resolvers_with_records > 0 ? "partial" : "missing",
    min_ttl: results.map((item) => item.min_ttl).filter(Number.isFinite).sort((a, b) => a - b)[0] ?? null,
  };
}

function result(check, status, explanation, records = [], extended = {}) {
  return { check, status, explanation, records, ...extended };
}

async function scanSelectorGroup({ label, selectors, domain, expectedProvider }) {
  const candidates = [];
  for (const selector of selectors) {
    const host = `${selector}._domainkey.${domain}`;
    const txt = await resolveNode("TXT", host);
    const cname = txt.ok && txt.records.length ? { ok: false, records: [] } : await resolveNode("CNAME", host);
    const resolverResults = await resolveAcrossResolvers(host, txt.ok && txt.records.length ? "TXT" : "CNAME");
    const records = [...txt.records, ...cname.records];
    const providerMatch = expectedProvider
      ? records.some((record) => String(record).toLowerCase().includes(expectedProvider))
      : records.length > 0;
    candidates.push({
      selector,
      host,
      records,
      status: records.length ? "PASS" : "WARNING",
      provider_match: providerMatch,
      propagation: propagation(resolverResults),
      resolvers: resolverResults,
    });
  }
  return {
    label,
    candidates,
    found: candidates.filter((candidate) => candidate.records.length > 0),
  };
}

function scoreChecks(checks) {
  const weights = {
    "MX records": 20,
    "SPF TXT record": 20,
    "DMARC TXT record": 15,
    "Google Workspace DKIM selectors": 15,
    "Generic DKIM selector discovery": 5,
    "Resend DKIM records": 20,
    "Resend verification records": 10,
  };
  let score = 0;
  let possible = 0;
  for (const check of checks) {
    const weight = weights[check.check] || 5;
    possible += weight;
    if (check.status === "PASS") score += weight;
    if (check.status === "WARNING") score += Math.floor(weight / 2);
  }
  return {
    score,
    possible,
    percent: possible ? Math.round((score / possible) * 100) : 0,
  };
}

async function main() {
  const checks = [];

  const mx = await resolveNode("MX", DOMAIN);
  const mxResolvers = await resolveAcrossResolvers(DOMAIN, "MX");
  const googleMx = mx.records.some((record) => /smtp\.google\.com$/i.test(record.exchange));
  checks.push(result(
    "MX records",
    googleMx ? "PASS" : mx.records.length ? "WARNING" : "FAIL",
    googleMx
      ? "Google Workspace MX is visible."
      : mx.records.length
        ? "MX exists, but Google Workspace smtp.google.com is not the visible target."
        : "No MX records were found.",
    mx.records,
    { propagation: propagation(mxResolvers), resolvers: mxResolvers }
  ));

  const apexTxt = await resolveNode("TXT", DOMAIN);
  const spfResolvers = await resolveAcrossResolvers(DOMAIN, "TXT");
  const spfRecords = apexTxt.records.filter((record) => /^v=spf1\b/i.test(record));
  checks.push(result(
    "SPF TXT record",
    spfRecords.length === 1 ? "PASS" : "FAIL",
    spfRecords.length === 1
      ? "Exactly one SPF record is visible."
      : spfRecords.length > 1
        ? "Multiple SPF records are visible; consolidate into one SPF TXT record."
        : "No SPF TXT record is visible.",
    spfRecords,
    { propagation: propagation(spfResolvers), resolvers: spfResolvers }
  ));

  const dmarc = await resolveNode("TXT", `_dmarc.${DOMAIN}`);
  const dmarcResolvers = await resolveAcrossResolvers(`_dmarc.${DOMAIN}`, "TXT");
  const dmarcRecords = dmarc.records.filter((record) => /^v=DMARC1\b/i.test(record));
  checks.push(result(
    "DMARC TXT record",
    dmarcRecords.length === 1 ? "PASS" : "FAIL",
    dmarcRecords.length === 1 ? "One DMARC record is visible." : "No valid DMARC TXT record is visible.",
    dmarcRecords,
    { propagation: propagation(dmarcResolvers), resolvers: dmarcResolvers }
  ));

  const googleDkim = await scanSelectorGroup({
    label: "Google Workspace DKIM selectors",
    selectors: GOOGLE_DKIM_SELECTORS,
    domain: DOMAIN,
  });
  checks.push(result(
    "Google Workspace DKIM selectors",
    googleDkim.found.length ? "PASS" : "WARNING",
    googleDkim.found.length
      ? `Found ${googleDkim.found.length} candidate Google Workspace DKIM selector(s).`
      : "No common Google Workspace DKIM selector is visible. Google Admin may use a custom selector.",
    googleDkim.found,
    { selector_discovery: googleDkim }
  ));

  const genericDkim = await scanSelectorGroup({
    label: "Generic DKIM selector discovery",
    selectors: GENERIC_DKIM_SELECTORS,
    domain: DOMAIN,
  });
  checks.push(result(
    "Generic DKIM selector discovery",
    genericDkim.found.length ? "PASS" : "WARNING",
    genericDkim.found.length
      ? `Found ${genericDkim.found.length} non-Google generic DKIM selector(s). These prove DKIM records exist but do not prove Google Workspace DKIM is enabled.`
      : "No generic DKIM selectors were discovered.",
    genericDkim.found,
    { selector_discovery: genericDkim }
  ));

  const resendDkim = await scanSelectorGroup({
    label: "Resend DKIM records",
    selectors: RESEND_DKIM_SELECTORS,
    domain: DOMAIN,
  });
  checks.push(result(
    "Resend DKIM records",
    resendDkim.found.length ? "PASS" : "WARNING",
    resendDkim.found.length
      ? `Found ${resendDkim.found.length} candidate Resend DKIM selector(s).`
      : "No common Resend DKIM records are visible. OWNER_CONFIRMATION_REQUIRED_RESEND_SELECTOR.",
    resendDkim.found,
    { selector_discovery: resendDkim }
  ));

  const resendVerification = [];
  for (const hostPrefix of RESEND_VERIFY_HOSTS) {
    const host = `${hostPrefix}.${DOMAIN}`;
    const txt = await resolveNode("TXT", host);
    const cname = txt.ok && txt.records.length ? { ok: false, records: [] } : await resolveNode("CNAME", host);
    const resolverResults = await resolveAcrossResolvers(host, txt.records.length ? "TXT" : "CNAME");
    resendVerification.push({
      host,
      records: [...txt.records, ...cname.records],
      propagation: propagation(resolverResults),
      resolvers: resolverResults,
    });
  }
  const visibleResendVerification = resendVerification.filter((item) => item.records.length > 0);
  checks.push(result(
    "Resend verification records",
    visibleResendVerification.length ? "PASS" : "WARNING",
    visibleResendVerification.length
      ? `Found ${visibleResendVerification.length} candidate Resend verification/DKIM host(s).`
      : "No Resend verification records were discovered beyond SPF. Resend dashboard may use a specific record not in common selectors.",
    visibleResendVerification,
    { discovery: resendVerification }
  ));

  const status = checks.some((check) => check.status === "FAIL")
    ? "FAIL"
    : checks.some((check) => check.status === "WARNING")
      ? "WARNING"
      : "PASS";
  const confidence = scoreChecks(checks);
  const report = {
    timestamp: new Date().toISOString(),
    domain: DOMAIN,
    status,
    confidence,
    checks,
    owner_confirmation_required: checks
      .filter((check) => check.status !== "PASS")
      .map((check) => `${check.check}: ${check.explanation}`),
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify({
    timestamp: report.timestamp,
    domain: report.domain,
    status: report.status,
    checks: checks.map((check) => ({
      check: check.check,
      status: check.status,
      explanation: check.explanation,
      records: check.records,
    })),
    owner_confirmation_required: report.owner_confirmation_required,
  }, null, 2)}\n`, "utf8");
  await writeFile(EXTENDED_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  for (const check of checks) {
    console.log(`${check.status} ${check.check}: ${check.explanation}`);
  }
  console.log(`Confidence: ${confidence.percent}% (${confidence.score}/${confidence.possible})`);
  console.log(`Report: ${REPORT_PATH}`);
  console.log(`Extended report: ${EXTENDED_REPORT_PATH}`);

  if (status === "FAIL") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[dns-email-readiness] Failed: ${error.message}`);
  process.exitCode = 1;
});
