#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const BASE44_ORIGIN = "https://app.base44.com";
const PRIMARY_ENV_KEY = "BASE44_AUTH_JSON";
const FALLBACK_ENV_KEY = "BASE_44_AUTH_JSON";

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
  node scripts/base44/check-app-access.mjs --app-id 69dc4a79656fdba136d413d3 --verify-url https://clientsurgesystems.com --json

Auth sources, in order:
  1. BASE44_AUTH_JSON
  2. BASE_44_AUTH_JSON
  3. ~/.base44/auth/auth.json`);
      process.exit(0);
    }
  }

  return args;
}

function normalizeAuthRecord(parsed) {
  const value = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!value || typeof value !== "object") return null;

  return {
    ...value,
    accessToken: value.accessToken || value.access_token || value.token || "",
    refreshToken: value.refreshToken || value.refresh_token || "",
    expiresAt: value.expiresAt || value.expires_at || null,
    email: value.email || value.user?.email || value.profile?.email || "",
  };
}

function readEnvAuth() {
  const raw = process.env[PRIMARY_ENV_KEY] || process.env[FALLBACK_ENV_KEY] || "";
  if (!raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw);
    const auth = normalizeAuthRecord(parsed);
    return {
      source: process.env[PRIMARY_ENV_KEY] ? PRIMARY_ENV_KEY : FALLBACK_ENV_KEY,
      authPath: null,
      auth,
      canPersistRefresh: false,
      parseError: null,
    };
  } catch (error) {
    return {
      source: process.env[PRIMARY_ENV_KEY] ? PRIMARY_ENV_KEY : FALLBACK_ENV_KEY,
      authPath: null,
      auth: null,
      canPersistRefresh: false,
      parseError: error.message,
    };
  }
}

function readFileAuth() {
  const authPath = resolve(homedir(), ".base44/auth/auth.json");
  if (!existsSync(authPath)) return null;

  try {
    const parsed = JSON.parse(readFileSync(authPath, "utf8"));
    return {
      source: authPath,
      authPath,
      auth: normalizeAuthRecord(parsed),
      canPersistRefresh: true,
      parseError: null,
    };
  } catch (error) {
    return {
      source: authPath,
      authPath,
      auth: null,
      canPersistRefresh: false,
      parseError: error.message,
    };
  }
}

function readAuthRecord() {
  return readEnvAuth() || readFileAuth();
}

function safeExpiryStatus(expiresAt) {
  const numeric = Number(expiresAt || 0);
  if (!numeric) return "unknown";
  const deltaMs = numeric - Date.now();
  if (deltaMs > 60_000) return "valid";
  if (deltaMs > 0) return "expires_within_60s";
  return "expired";
}

async function refreshAuthIfNeeded() {
  const authRecord = readAuthRecord();
  if (!authRecord) {
    return {
      ok: false,
      reason: "missing_auth",
      source: null,
      auth: null,
      token_status: "missing",
      refresh_status: "not_attempted",
    };
  }

  if (authRecord.parseError) {
    return {
      ok: false,
      reason: "invalid_auth_json",
      source: authRecord.source,
      auth: null,
      token_status: "invalid_json",
      refresh_status: "not_attempted",
      parse_error: authRecord.parseError,
    };
  }

  const auth = authRecord.auth;
  if (!auth?.accessToken) {
    return {
      ok: false,
      reason: "missing_access_token",
      source: authRecord.source,
      auth,
      token_status: "missing",
      refresh_status: "not_attempted",
    };
  }

  const tokenStatus = safeExpiryStatus(auth.expiresAt);
  if (tokenStatus === "valid") {
    return {
      ok: true,
      reason: "access_token_valid",
      source: authRecord.source,
      auth,
      token_status: tokenStatus,
      refresh_status: "not_needed",
    };
  }

  if (!auth.refreshToken) {
    return {
      ok: true,
      reason: "access_token_present_no_refresh_token",
      source: authRecord.source,
      auth,
      token_status: tokenStatus,
      refresh_status: "missing_refresh_token",
    };
  }

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", auth.refreshToken);
  body.set("client_id", "base44_cli");

  const response = await fetch(`${BASE44_ORIGIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.access_token) {
    return {
      ok: true,
      reason: "refresh_failed_using_existing_access_token",
      source: authRecord.source,
      auth,
      token_status: tokenStatus,
      refresh_status: `failed_http_${response.status}`,
    };
  }

  const refreshed = {
    ...auth,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || auth.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000,
  };

  if (authRecord.canPersistRefresh && authRecord.authPath) {
    writeFileSync(authRecord.authPath, `${JSON.stringify(refreshed, null, 2)}\n`, "utf8");
  }

  return {
    ok: true,
    reason: "refresh_succeeded",
    source: authRecord.source,
    auth: refreshed,
    token_status: tokenStatus,
    refresh_status: "succeeded",
  };
}

async function base44Json(path, accessToken) {
  const response = await fetch(`${BASE44_ORIGIN}/${path.replace(/^\/+/, "")}`, {
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
    hasProductSignupMarker: html.includes("product-signup") || html.includes("Complete your ClientSurge signup"),
  };
}

function safeBodySummary(body) {
  if (!body || typeof body !== "object") return typeof body === "string" ? body.slice(0, 300) : null;
  return {
    error_type: body.error_type || null,
    message: body.message || body.error || null,
    detail: body.detail || null,
    request_id: body.request_id || null,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const authState = await refreshAuthIfNeeded();

  if (!authState.auth?.accessToken) {
    const result = {
      ok: false,
      checked_at: new Date().toISOString(),
      auth_source: authState.source,
      token_status: authState.token_status,
      refresh_status: authState.refresh_status,
      failure_reason: authState.reason,
      parse_error: authState.parse_error || null,
      next_action: authState.reason === "missing_auth"
        ? "Create BASE44_AUTH_JSON or BASE_44_AUTH_JSON in GitHub repository secrets."
        : "Replace the Base44 auth secret with fresh valid auth JSON.",
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const app = await base44Json(`api/apps/${args.appId}`, authState.auth.accessToken);
  const publishedUrl = await base44Json(`api/apps/platform/${args.appId}/published-url`, authState.auth.accessToken);
  const liveSignal = await fetchLiveSignal(args.verifyUrl).catch((error) => ({ error: error.message }));

  const result = {
    ok: app.ok,
    checked_at: new Date().toISOString(),
    auth_source: authState.source,
    auth_email_present: Boolean(authState.auth.email),
    token_status_before_refresh: authState.token_status,
    refresh_status: authState.refresh_status,
    app_id: args.appId,
    app_status: app.status,
    app_name: app.body?.name || null,
    created_by: app.body?.created_by || null,
    updated_date: app.body?.updated_date || null,
    published_url: publishedUrl.ok ? publishedUrl.body?.url || null : null,
    published_url_status: publishedUrl.status,
    live_signal: liveSignal,
    error: app.ok ? null : safeBodySummary(app.body),
    next_action: app.ok
      ? "Base44 auth secret is valid for this app. Continue with auto-publish or deploy verification."
      : app.status === 401 || app.status === 403
      ? "Replace BASE44_AUTH_JSON / BASE_44_AUTH_JSON with a fresh Base44 auth JSON secret."
      : "Investigate Base44 app access response and deployment permissions.",
  };

  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`Base44 auth source: ${result.auth_source}`);
    console.log(`App: ${result.app_name || args.appId}`);
    console.log(`Access: ${result.ok ? "ok" : `failed (${result.app_status})`}`);
    console.log(`Updated: ${result.updated_date || "unknown"}`);
    console.log(`Published URL: ${result.published_url || "unknown"}`);
    console.log(`Next action: ${result.next_action}`);
  }

  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
