#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

function parseArgs(argv) {
  const args = {
    appId: "69dc4a79656fdba136d413d3",
    verifyUrl: "",
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--app-id") args.appId = argv[++i] || args.appId;
    else if (arg === "--verify-url") args.verifyUrl = argv[++i] || "";
    else if (arg === "--json") args.json = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/base44/check-app-access.mjs --app-id 69dc4a79656fdba136d413d3 --verify-url https://clientsurgesystems.com --json`);
      process.exit(0);
    }
  }

  return args;
}

function readCliAuth() {
  const authPath = resolve(homedir(), ".base44/auth/auth.json");
  if (!existsSync(authPath)) return null;
  return {
    authPath,
    auth: JSON.parse(readFileSync(authPath, "utf8")),
  };
}

async function refreshCliAuthIfNeeded() {
  const authRecord = readCliAuth();
  if (!authRecord?.auth?.accessToken) return null;

  if (Date.now() < Number(authRecord.auth.expiresAt || 0) - 60_000) {
    return {
      accessToken: authRecord.auth.accessToken,
      email: authRecord.auth.email || "",
      expiresAt: authRecord.auth.expiresAt || null,
    };
  }

  if (!authRecord.auth.refreshToken) {
    return {
      accessToken: authRecord.auth.accessToken,
      email: authRecord.auth.email || "",
      expiresAt: authRecord.auth.expiresAt || null,
    };
  }

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", authRecord.auth.refreshToken);
  body.set("client_id", "base44_cli");

  const response = await fetch("https://app.base44.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const payload = await response.json();
  if (!response.ok) {
    return {
      accessToken: authRecord.auth.accessToken,
      email: authRecord.auth.email || "",
      expiresAt: authRecord.auth.expiresAt || null,
    };
  }

  const refreshed = {
    ...authRecord.auth,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || authRecord.auth.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000,
  };
  writeFileSync(authRecord.authPath, `${JSON.stringify(refreshed, null, 2)}\n`, "utf8");
  return {
    accessToken: refreshed.accessToken,
    email: refreshed.email || "",
    expiresAt: refreshed.expiresAt || null,
  };
}

async function base44Json(path, accessToken) {
  const response = await fetch(`https://app.base44.com/${path.replace(/^\/+/, "")}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "ClientSurge Base44 access checker",
    },
  });
  const text = await response.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep raw text.
  }
  return { ok: response.ok, status: response.status, body };
}

async function fetchLiveSignal(url) {
  if (!url) return null;
  const response = await fetch(url, { redirect: "follow" });
  const html = await response.text();
  const assetMatch = html.match(/\/assets\/[^"']+\.js/);
  return {
    url: response.url,
    status: response.status,
    asset: assetMatch?.[0] || "",
    hasProductionAppId: html.includes("69dc4a79656fdba136d413d3"),
    hasDonorAppId: html.includes("69f959e2bc665e019e19840c"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const auth = await refreshCliAuthIfNeeded();
  if (!auth?.accessToken) {
    throw new Error("Base44 CLI auth is missing. Run 'base44 login' first.");
  }

  const app = await base44Json(`api/apps/${args.appId}`, auth.accessToken);
  const publishedUrl = await base44Json(`api/apps/platform/${args.appId}/published-url`, auth.accessToken);
  const liveSignal = await fetchLiveSignal(args.verifyUrl);

  const result = {
    ok: app.ok,
    checked_at: new Date().toISOString(),
    auth_email: auth.email,
    app_id: args.appId,
    app_status: app.status,
    app_name: app.body?.name || null,
    created_by: app.body?.created_by || null,
    updated_date: app.body?.updated_date || null,
    published_url: publishedUrl.ok ? publishedUrl.body?.url || null : null,
    published_url_status: publishedUrl.status,
    live_signal: liveSignal,
    error: app.ok ? null : app.body,
  };

  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`Base44 auth: ${result.auth_email}`);
    console.log(`App: ${result.app_name || args.appId}`);
    console.log(`Access: ${result.ok ? "ok" : `failed (${result.app_status})`}`);
    console.log(`Updated: ${result.updated_date || "unknown"}`);
    console.log(`Published URL: ${result.published_url || "unknown"}`);
  }

  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
