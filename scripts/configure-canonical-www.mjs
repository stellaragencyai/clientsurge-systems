#!/usr/bin/env node

const DOMAIN = process.env.CANONICAL_DOMAIN || "clientsurgesystems.com";
const WWW_DOMAIN = process.env.CANONICAL_WWW_DOMAIN || `www.${DOMAIN}`;
const TARGET_ORIGIN = `https://${WWW_DOMAIN}`;
const RENDER_API = "https://api.render.com/v1";
const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";
const CF_RULE_DESCRIPTION = "ClientSurge canonical www redirect";

const args = new Set(process.argv.slice(2));

function usage() {
  console.log(`
Canonical www automation

Default:
  node scripts/configure-canonical-www.mjs --check

Optional provider actions:
  RENDER_API_KEY=... RENDER_SERVICE_ID=... CONFIRM_RENDER_DOMAIN_RECREATE=${DOMAIN} \\
    node scripts/configure-canonical-www.mjs --apply-render-recreate

  CLOUDFLARE_API_TOKEN=... \\
    node scripts/configure-canonical-www.mjs --apply-cloudflare-redirect

Notes:
  - Do not paste provider passwords into chat or commit tokens.
  - Render currently controls the www -> apex redirect; switching Render to www usually requires recreating the custom domain with www first.
  - Cloudflare redirect rules help force apex/http traffic to https://www, but they cannot override a Render origin that redirects https://www back to apex.
`);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const details = body?.message || body?.error || body?.errors?.[0]?.message || text || response.statusText;
    throw new Error(`${response.status} ${response.statusText}: ${details}`);
  }

  return body;
}

async function checkUrl(url) {
  const response = await fetch(url, {
    method: "HEAD",
    redirect: "manual",
  });

  return {
    url,
    status: response.status,
    location: response.headers.get("location") || "",
    hsts: response.headers.get("strict-transport-security") || "",
  };
}

async function checkLiveRedirects() {
  const checks = await Promise.all([
    checkUrl(`http://${DOMAIN}`),
    checkUrl(`https://${DOMAIN}`),
    checkUrl(`http://${WWW_DOMAIN}`),
    checkUrl(`https://${WWW_DOMAIN}`),
  ]);

  for (const check of checks) {
    console.log(`${check.url} -> ${check.status}${check.location ? ` Location=${check.location}` : ""}${check.hsts ? ` HSTS=${check.hsts}` : ""}`);
  }

  const www = checks.find((check) => check.url === `https://${WWW_DOMAIN}`);
  if (www?.status >= 300 && www?.status < 400 && www.location.includes(`https://${DOMAIN}`)) {
    console.log("\nRender/origin is still redirecting https://www back to the apex domain. Switch Render custom domains to make www primary before enabling a Cloudflare apex->www redirect.");
  }
}

function renderAuthHeaders() {
  const key = process.env.RENDER_API_KEY;
  if (!key) {
    throw new Error("Missing RENDER_API_KEY.");
  }

  return { Authorization: `Bearer ${key}` };
}

async function listRenderCustomDomains(serviceId) {
  const body = await fetchJson(`${RENDER_API}/services/${serviceId}/custom-domains?limit=100`, {
    headers: renderAuthHeaders(),
  });

  return Array.isArray(body) ? body.map((item) => item.customDomain || item) : [];
}

async function deleteRenderCustomDomain(serviceId, name) {
  const response = await fetch(`${RENDER_API}/services/${serviceId}/custom-domains/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...renderAuthHeaders(),
    },
  });

  if (![204, 404, 410].includes(response.status)) {
    throw new Error(`Failed deleting Render custom domain ${name}: ${response.status} ${response.statusText}`);
  }
}

async function addRenderCustomDomain(serviceId, name) {
  return fetchJson(`${RENDER_API}/services/${serviceId}/custom-domains`, {
    method: "POST",
    headers: renderAuthHeaders(),
    body: JSON.stringify({ name }),
  });
}

async function verifyRenderCustomDomain(serviceId, name) {
  return fetchJson(`${RENDER_API}/services/${serviceId}/custom-domains/${encodeURIComponent(name)}/verify`, {
    method: "POST",
    headers: renderAuthHeaders(),
  });
}

async function applyRenderRecreate() {
  const serviceId = process.env.RENDER_SERVICE_ID;
  if (!serviceId) {
    throw new Error("Missing RENDER_SERVICE_ID.");
  }

  if (process.env.CONFIRM_RENDER_DOMAIN_RECREATE !== DOMAIN) {
    throw new Error(`Set CONFIRM_RENDER_DOMAIN_RECREATE=${DOMAIN} to allow Render custom-domain delete/recreate.`);
  }

  const before = await listRenderCustomDomains(serviceId);
  console.log("Render custom domains before:", before.map((domain) => domain.name).join(", ") || "(none)");

  await deleteRenderCustomDomain(serviceId, WWW_DOMAIN);
  await deleteRenderCustomDomain(serviceId, DOMAIN);
  await addRenderCustomDomain(serviceId, WWW_DOMAIN);
  await verifyRenderCustomDomain(serviceId, WWW_DOMAIN).catch((error) => {
    console.warn(`Verify ${WWW_DOMAIN} returned: ${error.message}`);
  });
  await verifyRenderCustomDomain(serviceId, DOMAIN).catch((error) => {
    console.warn(`Verify ${DOMAIN} returned: ${error.message}`);
  });

  const after = await listRenderCustomDomains(serviceId);
  console.log("Render custom domains after:", after.map((domain) => `${domain.name}:${domain.verificationStatus || "unknown"}`).join(", ") || "(none)");
  console.log(`Render should now redirect ${DOMAIN} to ${TARGET_ORIGIN} after DNS/TLS settles.`);
}

function cloudflareAuthHeaders() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error("Missing CLOUDFLARE_API_TOKEN.");
  }

  return { Authorization: `Bearer ${token}` };
}

async function getCloudflareZoneId() {
  const body = await fetchJson(`${CLOUDFLARE_API}/zones?name=${encodeURIComponent(DOMAIN)}`, {
    headers: cloudflareAuthHeaders(),
  });
  const zone = body?.result?.[0];
  if (!zone?.id) {
    throw new Error(`Cloudflare zone not found for ${DOMAIN}.`);
  }
  return zone.id;
}

function buildCloudflareRedirectRule() {
  return {
    action: "redirect",
    action_parameters: {
      from_value: {
        status_code: 301,
        target_url: {
          expression: `concat("${TARGET_ORIGIN}", http.request.uri.path)`,
        },
        preserve_query_string: true,
      },
    },
    expression: `(http.host eq "${DOMAIN}") or (http.host eq "${WWW_DOMAIN}" and http.request.scheme eq "http")`,
    description: CF_RULE_DESCRIPTION,
    enabled: true,
  };
}

async function applyCloudflareRedirectRule() {
  const zoneId = await getCloudflareZoneId();
  const endpoint = `${CLOUDFLARE_API}/zones/${zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`;
  const rule = buildCloudflareRedirectRule();

  let existing = null;
  try {
    existing = await fetchJson(endpoint, {
      headers: cloudflareAuthHeaders(),
    });
  } catch (error) {
    if (!error.message.startsWith("404 ")) {
      throw error;
    }
  }

  if (!existing?.result?.id) {
    await fetchJson(`${CLOUDFLARE_API}/zones/${zoneId}/rulesets`, {
      method: "POST",
      headers: cloudflareAuthHeaders(),
      body: JSON.stringify({
        name: "Canonical www redirects",
        kind: "zone",
        phase: "http_request_dynamic_redirect",
        rules: [rule],
      }),
    });
    console.log("Created Cloudflare canonical www redirect ruleset.");
    return;
  }

  const ruleset = existing.result;
  const rules = (ruleset.rules || []).filter((item) => item.description !== CF_RULE_DESCRIPTION);
  rules.push(rule);

  await fetchJson(`${CLOUDFLARE_API}/zones/${zoneId}/rulesets/${ruleset.id}`, {
    method: "PUT",
    headers: cloudflareAuthHeaders(),
    body: JSON.stringify({
      name: ruleset.name || "Canonical www redirects",
      kind: ruleset.kind || "zone",
      phase: ruleset.phase || "http_request_dynamic_redirect",
      rules,
    }),
  });

  console.log("Updated Cloudflare canonical www redirect rule.");
}

if (args.has("--help") || args.size === 0) {
  usage();
}

if (args.has("--check")) {
  await checkLiveRedirects();
}

if (args.has("--apply-render-recreate")) {
  await applyRenderRecreate();
}

if (args.has("--apply-cloudflare-redirect")) {
  await applyCloudflareRedirectRule();
}
