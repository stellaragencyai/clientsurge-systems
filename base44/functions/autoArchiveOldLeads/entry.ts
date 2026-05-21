import { secureJson } from "../_shared/response.ts";
/**
 * autoArchiveOldLeads - #91
 * Anonymizes WebsiteLead records older than 365 days.
 * Replaces PII fields with non-identifying placeholders.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { allowAnonymousAutomation } from "../_shared/automationSecurity.js";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_ARCHIVE_BATCH_SIZE = 200;

function lastFour(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? digits.slice(-4).padStart(4, "*") : "";
}

function anonymizeWebsiteLead(lead: any, archivedAt: string) {
  const suffix = String(lead.id || "").slice(-6) || "unknown";
  const phoneSuffix = lastFour(lead.phone_number);

  return {
    full_name: `Archived Lead ${suffix}`,
    first_name: "Archived",
    phone_number: phoneSuffix ? `***-***-${phoneSuffix}` : null,
    email: lead.email ? `archived-${suffix}@archived.local` : null,
    business_name: `Archived Business ${suffix}`,
    message: null,
    problem: null,
    user_agent: null,
    ip_address: null,
    consent_ip: null,
    dedup_key: null,
    archived: true,
    archived_at: archivedAt,
  };
}

Deno.serve(async (req) => {
  try {
    if (!allowAnonymousAutomation(req)) {
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const cutoff = new Date(Date.now() - ONE_YEAR_MS).toISOString();

    const leads = await base44.asServiceRole.entities.WebsiteLead.list("-created_date", 1000).catch(() => []);
    const old = (leads || []).filter((lead: any) => lead.created_date < cutoff && !lead.archived);

    let archived = 0;
    const archivedAt = new Date().toISOString();
    for (const lead of old.slice(0, MAX_ARCHIVE_BATCH_SIZE)) {
      await base44.asServiceRole.entities.WebsiteLead.update(
        lead.id,
        anonymizeWebsiteLead(lead, archivedAt)
      ).catch(() => {});
      archived++;
    }

    return secureJson({ success: true, archived, total_checked: old.length });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
