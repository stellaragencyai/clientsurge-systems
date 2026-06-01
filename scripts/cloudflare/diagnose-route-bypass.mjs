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

function buildNextAction({ routeSummary, dnsProbe, customHostnamesProbe, rulesetsProbe }) {
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
  if (denied.length > 0) {
    return {
      status: "needs_cloudflare_dns_custom_hostname_ruleset_access",
      message:
        "Worker routes are installed, but this token cannot inspect DNS records, custom hostnames, or rulesets. Grant Cloudflare DNS/custom-hostname/ruleset read access or inspect those dashboard pages next.",
      denied_probes: denied.map((item) => item.name),
      dashboard_path:
        "Cloudflare Dashboard -> clientsurgesystems.com -> DNS -> Records, then Workers Routes, Custom Hostnames for SaaS, and Rules/Redirect Rules.",
    };
  }

  return {
    status: "inspect_dns_custom_hostname_rulesets",
    message:
      "Worker routes are installed and management-plane reads are available. Inspect DNS/custom-hostnames/rulesets for an orange-to-orange or externally managed apex path.",
  };
}

export async function diagnoseRouteBypass({
  zoneName = DEFAULT_ZONE_NAME,
  workerScript = DEFAULT_WORKER_SCRIPT,
  configPath = DEFAULT_WRANGLER_CONFIG,
  fetchImpl = globalThis.fetch,
} = {}) {
  const wrangler = await readWranglerOAuthConfig(configPath);
  if (!wrangler.oauth_token) {
    return {
      ok: false,
      checked_at: new Date().toISOString(),
      zone_name: zoneName,
      worker_script: workerScript,
      wrangler: {
        config_path: wrangler.config_path,
        expiration_time: wrangler.expiration_time || null,
        scopes: wrangler.scopes,
        has_oauth_token: false,
      },
      next_action: {
        status: "cloudflare_login_required",
        message: "Wrangler OAuth token is missing. Run npm run cloudflare:security:login.",
      },
    };
  }

  const zoneProbe = await probe("zone", () =>
    cloudflareGet({
      token: wrangler.oauth_token,
      path: `/zones?name=${encodeURIComponent(zoneName)}`,
      fetchImpl,
    })
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
        has_oauth_token: true,
      },
      probes: { zone: zoneProbe },
      next_action: {
        status: "zone_read_failed",
        message:
          "Cloudflare zone lookup failed. Confirm the authenticated account can read clientsurgesystems.com.",
      },
    };
  }

  const routesProbe = await probe("worker-routes", () =>
    cloudflareGet({
      token: wrangler.oauth_token,
      path: `/zones/${zone.id}/workers/routes`,
      fetchImpl,
    })
  );
  const dnsProbe = await probe("dns-records", () =>
    cloudflareGet({
      token: wrangler.oauth_token,
      path: `/zones/${zone.id}/dns_records?per_page=100`,
      fetchImpl,
    })
  );
  const customHostnamesProbe = await probe("custom-hostnames", () =>
    cloudflareGet({
      token: wrangler.oauth_token,
      path: `/zones/${zone.id}/custom_hostnames?per_page=100`,
      fetchImpl,
    })
  );
  const rulesetsProbe = await probe("rulesets", () =>
    cloudflareGet({
      token: wrangler.oauth_token,
      path: `/zones/${zone.id}/rulesets`,
      fetchImpl,
    })
  );

  const routes = routesProbe.result?.result || [];
  const routeSummary = routesProbe.ok ? summarizeRoutes(routes, { zoneName, workerScript }) : [];
  const nextAction = buildNextAction({
    routeSummary,
    dnsProbe,
    customHostnamesProbe,
    rulesetsProbe,
  });

  return {
    ok: nextAction.status === "inspect_dns_custom_hostname_rulesets",
    checked_at: new Date().toISOString(),
    zone_name: zoneName,
    zone_id: zone.id,
    worker_script: workerScript,
    expected_account_email: DEFAULT_ACCOUNT_EMAIL,
    wrangler: {
      config_path: wrangler.config_path,
      expiration_time: wrangler.expiration_time || null,
      scopes: wrangler.scopes,
      has_oauth_token: true,
    },
    routes: routeSummary,
    probes: {
      zone: {
        name: zoneProbe.name,
        ok: zoneProbe.ok,
        count: zoneProbe.count,
        error: zoneProbe.error,
      },
      worker_routes: {
        name: routesProbe.name,
        ok: routesProbe.ok,
        count: routesProbe.count,
        error: routesProbe.error,
      },
      dns_records: {
        name: dnsProbe.name,
        ok: dnsProbe.ok,
        count: dnsProbe.count,
        error: dnsProbe.error,
      },
      custom_hostnames: {
        name: customHostnamesProbe.name,
        ok: customHostnamesProbe.ok,
        count: customHostnamesProbe.count,
        error: customHostnamesProbe.error,
      },
      rulesets: {
        name: rulesetsProbe.name,
        ok: rulesetsProbe.ok,
        count: rulesetsProbe.count,
        error: rulesetsProbe.error,
      },
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
      const status = probeResult.ok ? `ok count=${probeResult.count}` : `denied ${probeResult.error?.message || ""}`;
      lines.push(`- ${label}: ${status}`);
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
