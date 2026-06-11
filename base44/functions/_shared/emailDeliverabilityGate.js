const PROOF_READY_VALUES = new Set(["verified", "passed", "production_verified"]);

export function getApprovedEmailSender(settings = {}, { preferLeads = false } = {}) {
  const primaryEnv = preferLeads ? "RESEND_FROM_LEADS" : "RESEND_FROM_EMAIL";
  const secondaryEnv = preferLeads ? "RESEND_FROM_EMAIL" : "RESEND_FROM_LEADS";

  return (
    settings.resend_from_email ||
    Deno.env.get(primaryEnv) ||
    Deno.env.get(secondaryEnv) ||
    Deno.env.get("SUPPORT_EMAIL") ||
    "support@clientsurgesystems.com"
  );
}

export function getEmailOutreachGate(label = "outreach email") {
  const campaignEnabled = String(Deno.env.get("EMAIL_CAMPAIGN_ENABLED") || "").trim().toLowerCase() === "true";
  const proofStatus = String(Deno.env.get("EMAIL_DELIVERABILITY_PROOF_STATUS") || "").trim().toLowerCase();

  if (!campaignEnabled) {
    return {
      ok: false,
      reason: `EMAIL_CAMPAIGN_ENABLED must be true before ${label} sends.`,
      proof_status: proofStatus || "missing",
    };
  }
  if (!PROOF_READY_VALUES.has(proofStatus)) {
    return {
      ok: false,
      reason: `EMAIL_DELIVERABILITY_PROOF_STATUS must be verified before ${label} sends.`,
      proof_status: proofStatus || "missing",
    };
  }
  return { ok: true, proof_status: proofStatus };
}
