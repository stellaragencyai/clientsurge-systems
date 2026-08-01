#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_ZONE_NAME =
  process.env.CLIENTSURGE_CLOUDFLARE_ZONE || "clientsurgesystems.com";
export const DEFAULT_WORKER_SCRIPT =
  process.env.CLIENTSURGE_CLOUDFLARE_WORKER || "clientsurge-security-edge";
export const DEFAULT_ACCOUNT_EMAIL =
  process.env.CLIENTSURGE_CLOUDFLARE_ACCOUNT_EMAIL || "nolanfstrommer@gmail.com";
export const EDGE_HEALTH_PATH = "/.well-known/clientsurge-edge-health.json";
export const EDGE_HEALTH_HEADER = "x-clientsurge-security-edge";

const DEFAULT_WRANGLER_CONFIG = join(
  process.env.APPDATA || "",
  "xdg.config",
  ".wrangler",
  "config",
  "default.toml"
);

function requiredRoutePatterns(zoneName = DEFAULT_ZONE_NAME) {
  return [
    `${zoneName}/*`,
    `www.${zoneName}/*`,
  ];
}

function extractTomlString(source, key) {
  const match = new RegExp(`^\\s*${key}\\s*=\\s*"([^"]+)"`, "m").exec(source);
  return match?.[1] || "";
}

function extractTomlArray(source, key) {
  const match = new RegExp(`^\\s*${key}\\s*=\\s*\\[([^\\]]*)\\]`, "m").exec(source);
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

export async function readWranglerOAuthConfig(configPath = DEFAULT_WRANGLER_CONFIG) {
  const source = await readFile(configPath, "utf8");
  return {
    config_path: configPath,
    oauth_token: extractTomlString(source, "oauth_token"),
    expiration_time: extractTomlString(source, "expiration_time"),
    scopes: extractTomlArray(source, "scopes"),
  };
}

function resolveCloudflareApiAuths(wrangler) {
  const envToken = (process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || "").trim();
  const auths = [];
  if (envToken) {
    auths.push({
      token: envToken,
      source: "env",
      has_env_token: true,
      has_oauth_token: Boolean(wrangler.oauth_token),
    });
  }

  if (wrangler.oauth_token && wrangler.oauth_token !== envToken) {
    auths.push({
      token: wrangler.oauth_token,
      source: "wrangler_oauth",
      has_env_token: Boolean(envToken),
      has_oauth_token: true,
    });
  }

  return auths;
}

function safeError(error) {
  const message = String(error?.message || error || "");
  return {
    message,
    status: error?.status || null,
    code: error?.code || null,
  };
}

async function cloudflareGet({ token, path, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(`https://api.cloudflare.com/client/v4${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    const error = new Error(
      body?.errors?.map((item) => `${item.code}: ${item.message}`).join("; ") ||
        `Cloudflare API returned ${response.status}`
    );
    error.status = response.status;
    error.code = body?.errors?.[0]?.code || null;
    error.errors = body?.errors || [];
    throw error;
  }
  return body;
}

async function probe(name, fn) {
  try {
    const result = await fn();
    return {
      name,
      ok: true,
      count: Array.isArray(result?.result) ? result.result.length : 0,
      result,
      error: null,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      count: 0,
      result: null,
      error: safeError(error),
    };
  }
}

async function probeCloudflare(name, path, auths, fetchImpl = globalThis.fetch) {
  const attempts = [];
  for (const auth of auths) {
    try {
      const result = await cloudflareGet({
        token: auth.token,
        path,
        fetchImpl,
      });
      return {
        name,
        ok: true,
        count: Array.isArray(result?.result) ? result.result.length : 0,
        result,
        token_source: auth.source,
        attempted_sources: [...attempts.map((attempt) => attempt.source), auth.source],
        error: null,
      };
    } catch (error) {
      attempts.push({
        source: auth.source,
        error: safeError(error),
      });
    }
  }

  const last = attempts.at(-1)?.error || { message: "No Cloudflare token attempted", status: null, code: null };
  return {
    name,
    ok: false,
    count: 0,
    result: null,
    token_source: null,
    attempted_sources: attempts.map((attempt) => attempt.source),
    error: {
      ...last,
      attempts,
    },
  };
}

function summarizeRoutes(routes, { zoneName = DEFAULT_ZONE_NAME, workerScript = DEFAULT_WORKER_SCRIPT } = {}) {
  return requiredRoutePatterns(zoneName).map((pattern) => {
    const match = routes.find((route) => route.pattern === pattern);
    return {
      pattern,
      present: Boolean(match),
      script: match?.script || null,
      matches_worker: match?.script === workerScript,
      id: match?.id || null,
    };
  });
}

function isRelevantHost(name, zoneName = DEFAULT_ZONE_NAME) {
  const value = String(name || "").toLowerCase().replace(/\.$/, "");
  const zone = String(zoneName || "").toLowerCase();
  return value === zone || value === `www.${zone}`;
}

function mentionsDomain(value, zoneName = DEFAULT_ZONE_NAME) {
  const text = JSON.stringify(value || {}).toLowerCase();
  const zone = String(zoneName || "").toLowerCase();
  return text.includes(zone) || text.includes(`www.${zone}`) || text.includes("base44");
}

function riskFlagsForDnsRecord(record = {}) {
  const content = String(record.content || "").toLowerCase();
  const flags = [];
  if (record.proxied === true) flags.push("proxied");
  if (record.type === "CNAME" && record.proxied === true) flags.push("proxied_cname");
  if (content.includes("base44")) flags.push("base44_target");
  if (content.includes("cloudflare") || content.includes("workers.dev")) flags.push("cloudflare_or_worker_target");
  if (content.includes("render.com") || content.includes("onrender.com")) flags.push("render_target");
  return flags;
}

function summarizeDnsRecords(records = [], zoneName = DEFAULT_ZONE_NAME) {
  return records
    .filter((record) => isRelevantHost(record.name, zoneName))
    .map((record) => ({
      id: record.id || null,
      type: record.type || null,
      name: record.name || null,
      content: record.content || null,
      proxied: record.proxied ?? null,
      ttl: record.ttl ?? null,
      risk_flags: riskFlagsForDnsRecord(record),
    }));
}

function summarizeCustomHostnames(hostnames = [], zoneName = DEFAULT_ZONE_NAME) {
  return hostnames
    .filter((hostname) => mentionsDomain(hostname, zoneName))
    .map((hostname) => ({
      id: hostname.id || null,
      hostname: hostname.hostname || null,
      status: hostname.status || null,
      ssl_status: hostname.ssl?.status || null,
      custom_origin_server: hostname.custom_origin_server || null,
      risk_flags: hostname.custom_origin_server ? ["custom_origin_server"] : [],
    }));
}

function summarizeRulesets(rulesets = [], zoneName = DEFAULT_ZONE_NAME) {
  const summaries = [];
  for (const ruleset of rulesets) {
    const matchingRules = (ruleset.rules || []).filter((rule) => mentionsDomain(rule, zoneName));
    if (!mentionsDomain(ruleset, zoneName) && matchingRules.length === 0) continue;

    summaries.push({
      id: ruleset.id || null,
      name: ruleset.name || null,
      kind: ruleset.kind || null,
      phase: ruleset.phase || null,
      matching_rules: matchingRules.map((rule) => ({
        id: rule.id || null,
        description: rule.description || null,
        action: rule.action || null,
        expression: rule.expression || null,
        enabled: rule.enabled ?? null,
      })),
    });
  }
  return summaries;
}

function buildManagementPlaneAnalysis({
  zoneName = DEFAULT_ZONE_NAME,
  dnsProbe,
  customHostnamesProbe,
  rulesetsProbe,
}) {
  const dns_records = dnsProbe.ok
    ? summarizeDnsRecords(dnsProbe.result?.result || [], zoneName)
    : [];
  const custom_hostnames = customHostnamesProbe.ok
    ? summarizeCustomHostnames(customHostnamesProbe.result?.result || [], zoneName)
    : [];
  const rulesets = rulesetsProbe.ok
    ? summarizeRulesets(rulesetsProbe.result?.result || [], zoneName)
    : [];

  const candidates = [];
  for (const record of dns_records) {
    if (record.risk_flags.length > 0) {
      candidates.push({
        source: "dns_records",
        id: record.id,
        label: `${record.type} ${record.name} -> ${record.content}`,
        risk_flags: record.risk_flags,
      });
    }
  }
  for (const hostname of custom_hostnames) {
    candidates.push({
      source: "custom_hostnames",
      id: hostname.id,
      label: hostname.hostname,
      risk_flags: hostname.risk_flags.length ? hostname.risk_flags : ["custom_hostname"],
    });
  }
  for (const ruleset of rulesets) {
    for (const rule of ruleset.matching_rules) {
      candidates.push({
        source: "rulesets",
        id: rule.id || ruleset.id,
        label: `${ruleset.phase || "ruleset"}: ${rule.description || rule.expression || ruleset.name}`,
        risk_flags: [rule.action || "rule_reference"],
      });
    }
  }

  return {
    dns_records,
    custom_hostnames,
    rulesets,
    candidates,
  };
}

async function probeLiveEdgeHealth({ zoneName = DEFAULT_ZONE_NAME, fetchImpl = globalThis.fetch } = {}) {
  const target = `https://${zoneName}${EDGE_HEALTH_PATH}`;
  try {
    const response = await fetchImpl(target, { redirect: "manual" });
    const workerHeader = response.headers.get(EDGE_HEALTH_HEADER);
    const transformHeader = response.headers.get("x-clientsurge-security-transform");
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.clone().json().catch(() => null)
      : null;

    return {
      name: "live-edge-health",
      ok: response.status === 200 && workerHeader === "active",
      target,
      status: response.status,
      worker_header: workerHeader,
      transform_header: transformHeader,
      body_ok: body?.ok === true,
      error: null,
    };
  } catch (error) {
    return {
      name: "live-edge-health",
      ok: false,
      target,
      status: null,
      worker_header: null,
      transform_header: null,
      body_ok: false,
      error: safeError(error),
    };
  }
}

function buildNextAction({ routeSummary, routesProbe, dnsProbe, customHostnamesProbe, rulesetsProbe, analysis, liveEdgeProbe }) {
  if (!routesProbe.ok) {
    return {
      status: "needs_cloudflare_worker_route_access",
      message:
        "Cloudflare zone lookup works, but no available token can inspect Worker routes. Grant Workers Routes read access or run Wrangler OAuth login before changing DNS.",
      denied_probes: [routesProbe.name],
      dashboard_path:
        "Cloudflare Dashboard -> clientsurgesystems.com -> Workers Routes.",
    };
  }

  const routeMissing = routeSummary.some((route) => !route.present || !route.matches_worker);
  if (routeMissing) {
    return {
      status: "worker_route_mismatch",
      message:
        "Cloudflare Worker routes are missing or point at the wrong script. Re-run npm run cloudflare:security:release before changing DNS.",
    };
  }

  const denied = [dnsProbe, customHostnamesProbe, rulesetsProbe].filter(
    (item) => !item.ok && (item.error?.code === 10000 || item.error?.status === 403)
  );

  if (liveEdgeProbe?.ok) {
    const deniedNames = denied.map((item) => item.name);
    const readable = [dnsProbe, customHostnamesProbe, rulesetsProbe]
      .filter((item) => item.ok)
      .map((item) => item.name);
    return {
      status: denied.length > 0
        ? "live_worker_verified_management_limited"
        : "live_worker_verified",
      message: denied.length > 0
        ? `Live production traffic returns the Worker health header, but available tokens still cannot inspect ${deniedNames.join(", ")}.`
        : "Live production traffic returns the Worker health header and the Worker routes point at the expected script.",
      denied_probes: deniedNames,
      readable_probes: readable,
      live_edge_status: liveEdgeProbe.status,
      live_worker_header: liveEdgeProbe.worker_header,
      dashboard_path: denied.length > 0
        ? "Cloudflare Dashboard -> clientsurgesystems.com -> DNS -> Records, Custom Hostnames for SaaS, and Rules/Redirect Rules."
        : undefined,
    };
  }

  if (denied.length > 0) {
    const deniedNames = denied.map((item) => item.name);
    const readable = [dnsProbe, customHostnamesProbe, rulesetsProbe]
      .filter((item) => item.ok)
      .map((item) => item.name);
    return {
      status: "needs_cloudflare_dns_custom_hostname_ruleset_access",
      message:
        `Worker routes are installed, but available tokens cannot inspect ${deniedNames.join(", ")}. Readable management-plane probes: ${readable.length ? readable.join(", ") : "none"}.`,
      denied_probes: deniedNames,
      readable_probes: readable,
      dashboard_path:
        "Cloudflare Dashboard -> clientsurgesystems.com -> DNS -> Records, then Workers Routes, Custom Hostnames for SaaS, and Rules/Redirect Rules.",
    };
  }

  if (analysis?.candidates?.length > 0) {
    return {
      status: "inspect_bypass_candidates",
      message:
        "Worker routes are installed and management-plane reads are available. Inspect the listed DNS/custom-hostname/ruleset candidates for the path bypassing the Worker.",
      candidate_count: analysis.candidates.length,
      dashboard_path:
        "Cloudflare Dashboard -> clientsurgesystems.com -> DNS -> Records, Custom Hostnames for SaaS, and Rules/Redirect Rules.",
    };
  }

  return {
    status: "management_plane_access_available",
    message:
      "Worker routes are installed and management-plane reads are available, but no obvious DNS/custom-hostname/ruleset bypass candidate was found by the automated scan.",
  };
}

export async function diagnoseRouteBypass({
  zoneName = DEFAULT_ZONE_NAME,
  workerScript = DEFAULT_WORKER_SCRIPT,
  configPath = DEFAULT_WRANGLER_CONFIG,
  fetchImpl = globalThis.fetch,
} = {}) {
  const wrangler = await readWranglerOAuthConfig(configPath);
  const apiAuths = resolveCloudflareApiAuths(wrangler);
  const hasEnvToken = apiAuths.some((auth) => auth.has_env_token);
  const hasOauthToken = apiAuths.some((auth) => auth.has_oauth_token);
  if (apiAuths.length === 0) {
    return {
      ok: false,
      checked_at: new Date().toISOString(),
      zone_name: zoneName,
      worker_script: workerScript,
      wrangler: {
        config_path: wrangler.config_path,
        expiration_time: wrangler.expiration_time || null,
        scopes: wrangler.scopes,
        token_source: null,
        available_token_sources: [],
        has_env_token: hasEnvToken,
        has_oauth_token: hasOauthToken,
      },
      next_action: {
        status: "cloudflare_login_required",
        message: "Cloudflare API token is missing. Set CLOUDFLARE_API_TOKEN or run npm run cloudflare:security:login.",
      },
    };
  }

  const zoneProbe = await probeCloudflare(
    "zone",
    `/zones?name=${encodeURIComponent(zoneName)}`,
    apiAuths,
    fetchImpl
  );
  const zone = zoneProbe.result?.result?.[0] || null;

  if (!zoneProbe.ok || !zone?.id) {
    return {
      ok: false,
      checked_at: new Date().toISOString(),
      zone_name: zoneName,
      worker_script: workerScript,
      wrangler: {
        config_path: wrangler.config_path,
        expiration_time: wrangler.expiration_time || null,
        scopes: wrangler.scopes,
        token_source: zoneProbe.token_source || null,
        available_token_sources: apiAuths.map((auth) => auth.source),
        has_env_token: hasEnvToken,
        has_oauth_token: hasOauthToken,
      },
      probes: { zone: zoneProbe },
      next_action: {
        status: "zone_read_failed",
        message:
          "Cloudflare zone lookup failed. Confirm the authenticated account can read clientsurgesystems.com.",
      },
    };
  }

  const routesProbe = await probeCloudflare(
    "worker-routes",
    `/zones/${zone.id}/workers/routes`,
    apiAuths,
    fetchImpl
  );
  const dnsProbe = await probeCloudflare(
    "dns-records",
    `/zones/${zone.id}/dns_records?per_page=100`,
    apiAuths,
    fetchImpl
  );
  const customHostnamesProbe = await probeCloudflare(
    "custom-hostnames",
    `/zones/${zone.id}/custom_hostnames?per_page=100`,
    apiAuths,
    fetchImpl
  );
  const rulesetsProbe = await probeCloudflare(
    "rulesets",
    `/zones/${zone.id}/rulesets`,
    apiAuths,
    fetchImpl
  );
  const liveEdgeProbe = await probeLiveEdgeHealth({ zoneName, fetchImpl });

  const routes = routesProbe.result?.result || [];
  const routeSummary = routesProbe.ok ? summarizeRoutes(routes, { zoneName, workerScript }) : [];
  const analysis = buildManagementPlaneAnalysis({
    zoneName,
    dnsProbe,
    customHostnamesProbe,
    rulesetsProbe,
  });
  const nextAction = buildNextAction({
    routeSummary,
    routesProbe,
    dnsProbe,
    customHostnamesProbe,
    rulesetsProbe,
    analysis,
    liveEdgeProbe,
  });

  return {
    ok: [
      "inspect_bypass_candidates",
      "management_plane_access_available",
      "live_worker_verified",
      "live_worker_verified_management_limited",
    ].includes(nextAction.status),
    checked_at: new Date().toISOString(),
    zone_name: zoneName,
    zone_id: zone.id,
    worker_script: workerScript,
    expected_account_email: DEFAULT_ACCOUNT_EMAIL,
    wrangler: {
      config_path: wrangler.config_path,
      expiration_time: wrangler.expiration_time || null,
      scopes: wrangler.scopes,
      token_source: zoneProbe.token_source || apiAuths[0]?.source || null,
      available_token_sources: apiAuths.map((auth) => auth.source),
      has_env_token: hasEnvToken,
      has_oauth_token: hasOauthToken,
    },
    routes: routeSummary,
    analysis,
    probes: {
      zone: {
        name: zoneProbe.name,
        ok: zoneProbe.ok,
        count: zoneProbe.count,
        token_source: zoneProbe.token_source || null,
        attempted_sources: zoneProbe.attempted_sources || [],
        error: zoneProbe.error,
      },
      worker_routes: {
        name: routesProbe.name,
        ok: routesProbe.ok,
        count: routesProbe.count,
        token_source: routesProbe.token_source || null,
        attempted_sources: routesProbe.attempted_sources || [],
        error: routesProbe.error,
      },
      dns_records: {
        name: dnsProbe.name,
        ok: dnsProbe.ok,
        count: dnsProbe.count,
        token_source: dnsProbe.token_source || null,
        attempted_sources: dnsProbe.attempted_sources || [],
        error: dnsProbe.error,
      },
      custom_hostnames: {
        name: customHostnamesProbe.name,
        ok: customHostnamesProbe.ok,
        count: customHostnamesProbe.count,
        token_source: customHostnamesProbe.token_source || null,
        attempted_sources: customHostnamesProbe.attempted_sources || [],
        error: customHostnamesProbe.error,
      },
      rulesets: {
        name: rulesetsProbe.name,
        ok: rulesetsProbe.ok,
        count: rulesetsProbe.count,
        token_source: rulesetsProbe.token_source || null,
        attempted_sources: rulesetsProbe.attempted_sources || [],
        error: rulesetsProbe.error,
      },
      live_edge_health: liveEdgeProbe,
    },
    next_action: nextAction,
  };
}

export function formatRouteBypassDiagnosis(report) {
  const lines = [
    "Cloudflare route-bypass diagnosis",
    `Zone: ${report.zone_name}${report.zone_id ? ` (${report.zone_id})` : ""}`,
    `Worker: ${report.worker_script}`,
    `Next: ${report.next_action.status} - ${report.next_action.message}`,
    "",
  ];

  if (Array.isArray(report.routes) && report.routes.length > 0) {
    lines.push("Routes:");
    for (const route of report.routes) {
      lines.push(
        `- ${route.pattern}: ${route.present ? route.script : "missing"}${
          route.matches_worker ? " (ok)" : " (needs attention)"
        }`
      );
    }
    lines.push("");
  }

  if (report.probes) {
    lines.push("Management-plane probes:");
    for (const [label, probeResult] of Object.entries(report.probes)) {
      if (label === "live_edge_health") continue;
      const status = probeResult.ok ? `ok count=${probeResult.count}` : `denied ${probeResult.error?.message || ""}`;
      lines.push(`- ${label}: ${status}`);
    }
    lines.push("");
  }

  if (report.probes?.live_edge_health) {
    const live = report.probes.live_edge_health;
    lines.push("Live edge probe:");
    lines.push(
      `- ${live.target}: status=${live.status || "unknown"} ${EDGE_HEALTH_HEADER}=${live.worker_header || "missing"}${
        live.ok ? " (ok)" : " (needs attention)"
      }`
    );
    lines.push("");
  }

  if (report.analysis?.candidates?.length > 0) {
    lines.push("Bypass candidates:");
    for (const candidate of report.analysis.candidates) {
      lines.push(`- ${candidate.source}: ${candidate.label} [${candidate.risk_flags.join(", ")}]`);
    }
    lines.push("");
  }

  if (report.next_action.dashboard_path) {
    lines.push(`Dashboard: ${report.next_action.dashboard_path}`);
  }

  return `${lines.join("\n")}\n`;
}

function parseCliArgs(argv) {
  return {
    json: argv.includes("--json"),
    zoneName:
      argv.find((arg) => arg.startsWith("--zone="))?.split("=")[1] ||
      DEFAULT_ZONE_NAME,
    workerScript:
      argv.find((arg) => arg.startsWith("--worker="))?.split("=")[1] ||
      DEFAULT_WORKER_SCRIPT,
    configPath:
      argv.find((arg) => arg.startsWith("--config="))?.split("=")[1] ||
      DEFAULT_WRANGLER_CONFIG,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseCliArgs(process.argv.slice(2));
  try {
    const report = await diagnoseRouteBypass(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatRouteBypassDiagnosis(report));
    }
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(`Cloudflare route-bypass diagnosis failed: ${error.message}`);
    process.exitCode = 1;
  }
}
