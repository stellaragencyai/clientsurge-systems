import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const entitiesRoot = join(repoRoot, "base44", "entities");

const CORE_ENTITY_CONTRACTS = {
  Order: {
    requiredProperties: ["customer_email", "customer_name", "business_name", "payment_status", "client_id", "client_project_id", "selected_package_type", "package_type", "pipeline_status", "order_status", "environment", "dashboard_truth_status"],
    requiredRlsMarkers: ["data.customer_email", "data.client_id", "data.client_project_id"],
  },
  ClientProject: {
    requiredProperties: ["client_id", "client_email", "business_name", "client_project_status", "support_status", "qa_status", "environment", "dashboard_truth_status"],
    requiredRlsMarkers: ["data.client_id", "data.client_email"],
  },
  ClientDeployment: {
    requiredProperties: ["client_id", "client_project_id", "order_id", "industry_config_id", "package_tier_id", "package_tier_key", "deployment_status", "activated_modules", "module_installation_status", "health_status"],
    requiredFields: ["client_id", "industry_config_id", "package_tier_id", "deployment_status"],
    requiredRlsMarkers: ["data.client_id", "data.client_project_id"],
  },
  AutomationExecutionLog: {
    requiredProperties: ["client_deployment_id", "client_id", "automation_module_id", "module_key", "trigger_event", "execution_status", "external_provider_reference", "lead_id", "started_at", "completed_at"],
    requiredFields: ["client_deployment_id", "module_key", "trigger_event", "execution_status"],
    requiredRlsMarkers: ["data.client_id"],
  },
  CommunicationEvent: {
    requiredProperties: ["lead_id", "order_id", "client_id", "client_project_id", "tenant_scope_status", "channel", "direction", "event_type", "provider", "status", "provider_message_id", "metadata_json", "dashboard_truth_status"],
    requiredFields: ["channel", "direction", "event_type", "provider", "status"],
    requiredEnumValues: {
      event_type: ["sms_blocked", "email_blocked", "outbound_hold", "tenant_scope_blocked", "provider_send_failed"],
      provider: ["internal_guardrail", "internal_compliance_guard", "twilio", "resend"],
      status: ["blocked", "skipped", "failed", "processed"],
    },
    requiredRlsMarkers: ["data.client_id", "data.client_project_id", "data.order_id", "data.lead_id"],
  },
  Messages: {
    requiredProperties: ["lead_id", "client_id", "client_project_id", "tenant_scope_status", "direction", "channel", "message_text", "status", "provider", "provider_message_id", "provider_from_number", "from_address", "from_number", "from_phone", "lead_phone", "to_address", "metadata_json"],
    requiredFields: ["direction", "channel", "message_text"],
    forbiddenRequiredFields: ["lead_id"],
    requiredEnumValues: {
      tenant_scope_status: ["unmatched"],
      status: ["blocked", "skipped", "opt_out", "opt_out_unmatched", "received_unmatched"],
      provider: ["internal_compliance_guard", "twilio", "resend"],
    },
    requiredRlsMarkers: ["data.client_id", "data.client_project_id", "data.lead_id"],
  },
  WebsiteLead: {
    requiredProperties: ["client_id", "client_project_id", "crm_lead_id", "consent_given", "consent_text_version", "lead_status", "reply_status", "booking_status", "sms_permission", "automation_enabled", "cadence_paused"],
    requiredRlsMarkers: ["data.client_id", "data.client_project_id"],
  },
};

function parseJsonc(raw) {
  const withoutBlockComments = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLineComments = withoutBlockComments.replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(withoutLineComments);
}

function listEntityFiles(root = entitiesRoot) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonc"))
    .map((entry) => join(root, entry.name))
    .sort();
}

function readEntity(path) {
  const raw = readFileSync(path, "utf8");
  const entity = parseJsonc(raw);
  return { path, raw, entity };
}

function hasRlsMarker(raw, marker) {
  return raw.includes(`"${marker}"`) || raw.includes(marker);
}

function enumValues(entity, propertyName) {
  return entity?.properties?.[propertyName]?.enum || [];
}

function auditEntity({ raw, entity }, contract) {
  const findings = [];
  const properties = entity.properties || {};
  const required = entity.required || [];

  for (const property of contract.requiredProperties || []) {
    if (!Object.prototype.hasOwnProperty.call(properties, property)) findings.push(`missing_property:${property}`);
  }

  for (const field of contract.requiredFields || []) {
    if (!required.includes(field)) findings.push(`missing_required_field:${field}`);
  }

  for (const field of contract.forbiddenRequiredFields || []) {
    if (required.includes(field)) findings.push(`forbidden_required_field:${field}`);
  }

  for (const [property, values] of Object.entries(contract.requiredEnumValues || {})) {
    const actualValues = enumValues(entity, property);
    for (const value of values) {
      if (!actualValues.includes(value)) findings.push(`missing_enum:${property}:${value}`);
    }
  }

  for (const marker of contract.requiredRlsMarkers || []) {
    if (!hasRlsMarker(raw, marker)) findings.push(`missing_rls_marker:${marker}`);
  }

  return findings;
}

export function collectDataIntegrityAudit({ root = entitiesRoot } = {}) {
  const entityFiles = listEntityFiles(root);
  const entities = entityFiles.map(readEntity);
  const byName = new Map(entities.map((record) => [record.entity.name, record]));
  const rows = [];

  for (const [entityName, contract] of Object.entries(CORE_ENTITY_CONTRACTS)) {
    const record = byName.get(entityName);
    if (!record) {
      rows.push({ entity: entityName, path: null, findings: ["missing_entity"] });
      continue;
    }
    rows.push({
      entity: entityName,
      path: record.path.replace(`${repoRoot}/`, ""),
      findings: auditEntity(record, contract),
    });
  }

  return {
    summary: {
      total_entity_files: entityFiles.length,
      audited_core_entities: rows.length,
      entities_with_findings: rows.filter((row) => row.findings.length > 0).length,
    },
    rows,
    findings: rows.flatMap((row) => row.findings.map((finding) => ({ entity: row.entity, finding }))),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = collectDataIntegrityAudit();
  if (process.argv.includes("--write")) {
    const outDir = join(repoRoot, "tmp");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "area11-data-integrity-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}
