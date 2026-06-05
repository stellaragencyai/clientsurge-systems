import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, resolve } from "node:path";

const DEFAULT_APP_ID = "69dc4a79656fdba136d413d3";
const DEFAULT_ENTITIES = ["Leads", "Client", "Order", "OnboardingClient", "WebsiteLead"];
const PRESERVE_REMOTE_PROPERTY_ENTITIES = new Set(["Order", "WebsiteLead"]);
const KEEP_RLS_ENTITIES = new Set(["Client", "WebsiteLead"]);

function parseArgs(argv) {
  const args = {
    appId: DEFAULT_APP_ID,
    entities: DEFAULT_ENTITIES,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--app-id") args.appId = argv[++index] || args.appId;
    else if (arg === "--entities") {
      args.entities = (argv[++index] || "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    } else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/base44/push-user-app-entity-schemas.mjs
  node scripts/base44/push-user-app-entity-schemas.mjs --entities Leads,Client,Order

Options:
  --app-id ID        Base44 app ID. Defaults to ClientSurge production.
  --entities LIST   Comma-separated entity names to update.
  --dry-run         Back up and diff only; do not write schemas.`);
}

function readCliAuth() {
  const authPath = resolve(homedir(), ".base44/auth/auth.json");
  if (!existsSync(authPath)) throw new Error("Base44 CLI auth is missing. Run npx base44 login first.");
  return JSON.parse(readFileSync(authPath, "utf8"));
}

function readLocalSchema(entityName) {
  return JSON.parse(readFileSync(resolve("base44", "entities", `${entityName}.jsonc`), "utf8"));
}

function mergeSchema(entityName, remoteSchema = {}, localSchema) {
  const remoteProperties = remoteSchema.properties || {};
  const localProperties = localSchema.properties || {};
  const properties = PRESERVE_REMOTE_PROPERTY_ENTITIES.has(entityName)
    ? { ...localProperties, ...remoteProperties }
    : { ...remoteProperties, ...localProperties };

  return {
    ...remoteSchema,
    ...localSchema,
    name: entityName,
    properties,
    required: [...new Set([...(remoteSchema.required || []), ...(localSchema.required || [])])],
    rls: KEEP_RLS_ENTITIES.has(entityName) ? (remoteSchema.rls || localSchema.rls) : undefined,
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw response text for diagnostics.
  }
  if (!response.ok) {
    throw new Error(`${options?.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`);
  }
  return body;
}

function writeBackup(appId, schemasPayload) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = resolve("private-data", "base44-schema-backups", stamp);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "entity-schemas.json"), `${JSON.stringify(schemasPayload, null, 2)}\n`, "utf8");
  writeFileSync(resolve(dir, "summary.json"), `${JSON.stringify({
    app_id: appId,
    backed_up_at: new Date().toISOString(),
    schema_count: schemasPayload.schemas?.length || 0,
  }, null, 2)}\n`, "utf8");
  return dir;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const auth = readCliAuth();
  const endpoint = `https://app.base44.com/api/apps/${args.appId}/entity-schemas`;
  const headers = {
    Authorization: `Bearer ${auth.accessToken}`,
    "Content-Type": "application/json",
  };

  const remotePayload = await fetchJson(endpoint, { headers });
  const backupDir = writeBackup(args.appId, remotePayload);
  const remoteSchemas = Object.fromEntries((remotePayload.schemas || []).map((schema) => [schema.entity_name, schema.entity_schema]));
  const results = [];

  for (const entityName of args.entities) {
    const localSchema = readLocalSchema(entityName);
    const remoteSchema = remoteSchemas[entityName] || {};
    const mergedSchema = mergeSchema(entityName, remoteSchema, localSchema);
    const addedFields = Object.keys(localSchema.properties || {}).filter((field) => !(field in (remoteSchema.properties || {})));

    if (!args.dryRun) {
      await fetchJson(`${endpoint}/${encodeURIComponent(entityName)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          entity_name: entityName,
          entity_schema: mergedSchema,
        }),
      });
    }

    results.push({
      entity: entityName,
      mode: args.dryRun ? "dry_run" : "updated",
      added_field_count: addedFields.length,
      added_fields: addedFields,
      field_count: Object.keys(mergedSchema.properties || {}).length,
      rls_preserved: KEEP_RLS_ENTITIES.has(entityName),
    });
  }

  console.log(JSON.stringify({
    ok: true,
    app_id: args.appId,
    backup_dir: backupDir,
    dry_run: args.dryRun,
    entities: args.entities.map((name) => basename(name)),
    results,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
