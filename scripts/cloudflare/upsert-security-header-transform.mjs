#!/usr/bin/env node

import { GLOBAL_SECURITY_HEADERS, SENSITIVE_HEADERS } from "../../cloudflare/clientsurge-security-edge-worker.mjs";

const API_BASE = "https://api.cloudflare.com/client/v4";
const DEFAULT_ZONE_NAME = process.env.CLIENTSURGE_CLOUDFLARE_ZONE || "clientsurgesystems.com";
const PHASE = "http_response_headers_transform";
const RULESET_NAME = "ClientSurge production security headers";
const TRANSFORM_HEADER = "X-ClientSurge-Security-Transform";

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const parsed = {
    dryRun: false,
    zoneName: DEFAULT_ZONE_NAME,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--zone") parsed.zoneName = argv[++index] || parsed.zoneName;
    else if (arg === "--help" || arg === "-h") parsed.help = true;
  }
  return parsed;
}

function usage() {
  return `Usage: node scripts/cloudflare/upsert-security-header-transform.mjs [--dry-run] [--zone clientsurgesystems.com]

Creates or updates Cloudflare Response Header Transform Rules so production
security headers still apply when the Base44 custom-domain path bypasses the
Worker route. Requires CLOUDFLARE_API_TOKEN or CF_API_TOKEN with zone Rulesets
read/write access.`;
}

function token() {
  return (process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || "").trim();
}

async function cf(path, { method = "GET", body, tokenValue = token(), fetchImpl = globalThis.fetch } = {}) {
  if (!tokenValue) {
    throw new Error("Missing CLOUDFLARE_API_TOKEN or CF_API_TOKEN.");
  }

  const response = await fetchImpl(`${API_BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${tokenValue}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const details = payload?.errors?.map((item) => `${item.code}: ${item.message}`).join("; ");
    const error = new Error(details || `Cloudflare API returned ${response.status}`);
    error.status = response.status;
    error.code = payload?.errors?.[0]?.code || null;
    throw error;
  }
  return payload;
}

function headerMap(headers) {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      {
        operation: "set",
        value,
      },
    ])
  );
}

export function buildSecurityHeaderRules(zoneName = DEFAULT_ZONE_NAME) {
  const hostExpression = `(http.host in {"${zoneName}" "www.${zoneName}"})`;
  const sensitivePathExpression = [
    'http.request.uri.path eq "/admin"',
    'starts_with(http.request.uri.path, "/admin/")',
    'http.request.uri.path eq "/onboarding"',
    'http.request.uri.path eq "/motion-lab"',
    'http.request.uri.path eq "/client-portal"',
    'http.request.uri.path eq "/setup/preview"',
    'starts_with(http.request.uri.path, "/setup/preview/")',
  ].join(" or ");

  return [
    {
      ref: "clientsurge_global_security_headers_v1",
      description: "ClientSurge global security headers for production and Base44 custom-domain fallback",
      expression: hostExpression,
      action: "rewrite",
      enabled: true,
      action_parameters: {
        headers: headerMap({
          ...GLOBAL_SECURITY_HEADERS,
          [TRANSFORM_HEADER]: "active",
        }),
      },
    },
    {
      ref: "clientsurge_sensitive_security_headers_v1",
      description: "ClientSurge noindex and no-store headers for sensitive production app routes",
      expression: `${hostExpression} and (${sensitivePathExpression})`,
      action: "rewrite",
      enabled: true,
      action_parameters: {
        headers: headerMap(SENSITIVE_HEADERS),
      },
    },
  ];
}

function mergeRules(existingRules = [], managedRules = []) {
  const managedRefs = new Set(managedRules.map((rule) => rule.ref));
  return [
    ...existingRules.filter((rule) => !managedRefs.has(rule.ref)),
    ...managedRules,
  ];
}

async function findZoneId(zoneName) {
  const payload = await cf(`/zones?name=${encodeURIComponent(zoneName)}`);
  const zone = payload.result?.[0];
  if (!zone?.id) throw new Error(`Cloudflare zone not found for ${zoneName}.`);
  return zone.id;
}

async function getPhaseRuleset(zoneId) {
  const payload = await cf(`/zones/${zoneId}/rulesets`);
  return (payload.result || []).find((ruleset) => ruleset.phase === PHASE && ruleset.kind === "zone") || null;
}

async function upsertSecurityHeaderTransform({ zoneName = DEFAULT_ZONE_NAME, dryRun = false } = {}) {
  const zoneId = await findZoneId(zoneName);
  const existing = await getPhaseRuleset(zoneId);
  const managedRules = buildSecurityHeaderRules(zoneName);
  const nextRules = mergeRules(existing?.rules || [], managedRules);
  const body = {
    name: existing?.name || RULESET_NAME,
    description:
      existing?.description ||
      "Zone-level response header transform fallback for ClientSurge production security headers.",
    kind: "zone",
    phase: PHASE,
    rules: nextRules,
  };

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      zoneName,
      zoneId,
      phase: PHASE,
      action: existing ? "update" : "create",
      managedRefs: managedRules.map((rule) => rule.ref),
      existingRuleCount: existing?.rules?.length || 0,
      nextRuleCount: nextRules.length,
    };
  }

  const payload = existing
    ? await cf(`/zones/${zoneId}/rulesets/${existing.id}`, { method: "PUT", body })
    : await cf(`/zones/${zoneId}/rulesets`, { method: "POST", body });

  return {
    ok: true,
    dryRun: false,
    zoneName,
    zoneId,
    phase: PHASE,
    action: existing ? "updated" : "created",
    rulesetId: payload.result?.id || existing?.id || null,
    version: payload.result?.version || null,
    managedRefs: managedRules.map((rule) => rule.ref),
    ruleCount: payload.result?.rules?.length || nextRules.length,
  };
}

export { TRANSFORM_HEADER, upsertSecurityHeaderTransform };

if (process.argv[1]?.endsWith("upsert-security-header-transform.mjs")) {
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  upsertSecurityHeaderTransform(args)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(`Cloudflare security header transform failed: ${error.message}`);
      process.exit(1);
    });
}
