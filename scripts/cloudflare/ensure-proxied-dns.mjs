#!/usr/bin/env node

const API_BASE = "https://api.cloudflare.com/client/v4";
const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = process.env.CLOUDFLARE_ZONE_NAME || "clientsurgesystems.com";
const targetNames = (process.env.CLOUDFLARE_PROXIED_DNS_NAMES || "clientsurgesystems.com,www.clientsurgesystems.com")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!token) {
  console.error("CLOUDFLARE_API_TOKEN is required.");
  process.exit(1);
}

async function cloudflare(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { success: false, errors: [{ message: text || `HTTP ${response.status}` }] };
  }

  if (!response.ok || payload.success === false) {
    const errors = (payload.errors || []).map((error) => error.message || JSON.stringify(error)).join("; ");
    throw new Error(`${options.method || "GET"} ${path} failed: HTTP ${response.status}${errors ? ` - ${errors}` : ""}`);
  }

  return payload.result;
}

async function getZoneId() {
  const zones = await cloudflare(`/zones?name=${encodeURIComponent(zoneName)}&status=active`);
  const zone = Array.isArray(zones) ? zones.find((item) => item.name === zoneName) || zones[0] : null;
  if (!zone?.id) throw new Error(`Cloudflare zone not found or inactive: ${zoneName}`);
  return zone.id;
}

async function listDnsRecords(zoneId, name) {
  const records = await cloudflare(`/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}&per_page=100`);
  return Array.isArray(records) ? records : [];
}

function updateBodyForRecord(record) {
  const allowed = ["A", "AAAA", "CNAME"];
  if (!allowed.includes(record.type)) return null;
  return {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl,
    proxied: true,
    comment: record.comment,
    tags: record.tags,
  };
}

async function ensureRecordProxied(zoneId, record) {
  const body = updateBodyForRecord(record);
  if (!body) {
    console.log(`skipping unsupported DNS record ${record.name} ${record.type}`);
    return { skipped: true, name: record.name, type: record.type, proxied: record.proxied };
  }

  if (record.proxied === true) {
    console.log(`already proxied ${record.name} ${record.type} -> ${record.content}`);
    return { changed: false, name: record.name, type: record.type, proxied: true };
  }

  const updated = await cloudflare(`/zones/${zoneId}/dns_records/${record.id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  console.log(`proxied ${record.name} ${record.type} -> ${record.content}`);
  return { changed: true, name: updated.name, type: updated.type, proxied: updated.proxied };
}

const zoneId = await getZoneId();
const results = [];

for (const name of targetNames) {
  const records = await listDnsRecords(zoneId, name);
  if (records.length === 0) {
    console.warn(`no DNS records found for ${name}`);
    results.push({ name, missing: true });
    continue;
  }

  for (const record of records) {
    results.push(await ensureRecordProxied(zoneId, record));
  }
}

console.log(JSON.stringify({ zoneName, zoneId, results }, null, 2));

const actionable = results.filter((result) => !result.skipped && !result.missing);
const unproxied = actionable.filter((result) => result.proxied !== true);
if (actionable.length === 0 || unproxied.length > 0) {
  console.error("Cloudflare proxied DNS verification failed.");
  process.exit(1);
}

console.log("Cloudflare DNS proxy status verified for Worker routing.");
