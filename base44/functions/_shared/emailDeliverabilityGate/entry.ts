/**
 * Email Deliverability Gate
 * Provides sender resolution and outreach gating for email sends.
 */

const FALLBACK_SENDER = "noreply@clientsurgesystems.com";

/**
 * Returns an approved "from" email address.
 * Checks AdminSettings for a configured sender, falls back to env, then to system default.
 */
export function getApprovedEmailSender(settings = {}, options = {}) {
  const configured = String(settings?.resend_from_email || "").trim();
  if (configured && configured.includes("@")) {
    return configured;
  }

  const envSender = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (envSender && envSender.includes("@")) {
    return envSender;
  }

  return FALLBACK_SENDER;
}

/**
 * Gate check for whether email outreach is allowed.
 * Returns { ok, reason, proof_status }.
 */
export function getEmailOutreachGate(context = "email outreach") {
  const proofStatus = String(Deno.env.get("EMAIL_DELIVERABILITY_PROOF_STATUS") || "").trim().toLowerCase();
  const proofReadyValues = ["verified", "passed", "production_verified"];

  if (proofReadyValues.includes(proofStatus)) {
    return { ok: true, reason: null, proof_status: proofStatus || "verified" };
  }

  return {
    ok: false,
    reason: `Email outreach blocked: deliverability proof not complete (context: ${context}). Set EMAIL_DELIVERABILITY_PROOF_STATUS=verified to enable.`,
    proof_status: proofStatus || "missing",
  };
}

// Minimal handler so this utility file is deployable and importable by other functions
Deno.serve(() => new Response("OK", { status: 200 }));