#!/usr/bin/env node

const API_BASE = "https://api.cloudflare.com/client/v4";
const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = process.env.CLOUDFLARE_ZONE_NAME || "clientsurgesystems.com";
const scriptName = process.env.CLOUDFLARE_WORKER_SCRIPT || "clientsurge-security-edge";
const routePatterns = (process.env.CLOUDFLARE_WORKER_ROUTES || "*clientsurgesystems.com/*,clientsurgesystems.com/*,www.clientsurgesystems.com/*")
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
  if (!zone?.id) {
    throw new Error(`Cloudflare zone not found or inactive: ${zoneName}`);
  }
  return zone.id;
}

async function getRoutes(zoneId) {
  const routes = await cloudflare(`/zones/${zoneId}/workers/routes`);
  return Array.isArray(routes) ? routes : [];
}

async function upsertRoute(zoneId, existingRoutes, pattern) {
  const existing = existingRoutes.find((route) => route.pattern === pattern);
  const body = JSON.stringify({ pattern, script: scriptName });

  if (existing?.id) {
    const updated = await cloudflare(`/zones/${zoneId}/workers/routes/${existing.id}`, {
      method: "PUT",
      body,
    });
    console.log(`updated route ${pattern} -> ${scriptName}`);
    return updated;
  }

  const created = await cloudflare(`/zones/${zoneId}/workers/routes`, {
    method: "POST",
    body,
  });
  console.log(`created route ${pattern} -> ${scriptName}`);
  return created;
}

const zoneId = await getZoneId();
console.log(`zone ${zoneName}: ${zoneId}`);
console.log(`worker script: ${scriptName}`);

let routes = await getRoutes(zoneId);
for (const pattern of routePatterns) {
  await upsertRoute(zoneId, routes, pattern);
  routes = await getRoutes(zoneId);
}

const finalRoutes = routes
  .filter((route) => routePatterns.includes(route.pattern))
  .map((route) => ({ id: route.id, pattern: route.pattern, script: route.script }));

console.log(JSON.stringify({ zoneName, zoneId, scriptName, routes: finalRoutes }, null, 2));

const wrongRoutes = finalRoutes.filter((route) => route.script !== scriptName);
if (wrongRoutes.length > 0 || finalRoutes.length < routePatterns.length) {
  console.error("Cloudflare Worker route verification failed.");
  process.exit(1);
}

console.log("Cloudflare Worker routes verified.");
