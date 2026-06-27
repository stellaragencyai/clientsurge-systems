import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── Inlined shared helpers ──
function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function allowAnonymousAutomation(req) {
  const authHeader = req.headers.get("authorization") || "";
  const xSecret = req.headers.get("x-automation-secret") || "";
  const sharedSecret = Deno.env.get("AUTOMATION_SHARED_SECRET");

  if (sharedSecret) {
    if (authHeader.includes(`Bearer ${sharedSecret}`)) return true;
    if (xSecret === sharedSecret) return true;
  }
  if (req.headers.get("x-internal") === "true") return true;

  const userAgent = req.headers.get("user-agent") || "";
  if (userAgent.includes("base44") || userAgent.includes("Base44")) return true;

  return false;
}

/**
 * autoArchiveOldLeads — Anonymizes WebsiteLead records older than 365 days.
 * Replaces PII fields with non-identifying placeholders.
 */
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_ARCHIVE_BATCH_SIZE = 200;

function lastFour(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? digits.slice(-4).padStart(4, "*") : "";
}

function anonymizeWebsiteLead(lead, archivedAt) {
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
    const old = (leads || []).filter((lead) => lead.created_date < cutoff && !lead.archived);

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
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});