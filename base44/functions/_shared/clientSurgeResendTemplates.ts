import { resendFetch } from "./resendFetch.js";

export const CLIENTSURGE_EMAIL_TEMPLATE_VERSION = "clientsurge_resend_templates_v1.0.0";

export const RESEND_TEMPLATE_ALIASES = {
  remoteSetupIntake: "clientsurge-remote-setup-intake-v2",
  freeAuditRequest: "clientsurge-free-audit-request-received",
  contactFormReceived: "clientsurge-contact-form-received",
  orderReceived: "clientsurge-order-received",
  marketingBroadcastMaster: "clientsurge-marketing-broadcast-master",
} as const;

const APP_URL = Deno.env.get("APP_URL") || "https://clientsurgesystems.com";
const DEFAULT_SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") || "support@clientsurgesystems.com";
const DEFAULT_SUPPORT_PHONE = Deno.env.get("SUPPORT_PHONE") || "(602) 584-3227";
const DEFAULT_CALENDAR_URL = Deno.env.get("CLIENTSURGE_SETUP_CALENDAR_URL") || "https://calendly.com/nolan-clientsurge";

const PACKAGE_LABELS: Record<string, string> = {
  starter: "Starter System",
  starter_system: "Starter System",
  growth: "Growth System",
  growth_system: "Growth System",
  pro: "Pro System",
  pro_system: "Pro System",
  elite: "Pro System",
  elite_system: "Pro System",
};

const SERVICE_LABELS: Record<string, string> = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  nurture_sequence_14d: "14-Day Nurture Sequence",
  ai_booking_agent: "AI Booking Agent",
  daily_lead_digest: "Daily Lead Digest",
  inbound_sms_assistant: "Inbound SMS Assistant",
  ai_voice_receptionist: "AI Voice Receptionist",
  lead_reactivation: "Lead Reactivation",
  review_request: "Review Request Automation",
};

const PLACEHOLDER_PATTERNS = [
  /^(asdf|asdfasdf|fdsf|fdsfdsf|dfdsf|dsfdsf|qwerty|abc|abcd|test|testing|sample|demo|none|null|na|n\/a)$/i,
  /^[asdfjkl;]{5,16}$/i,
  /^[a-z]{1,3}$/i,
];

const TEST_EMAIL_PATTERNS = [
  /@clientsurge\.test$/i,
  /@example\.(com|net|org)$/i,
  /^test[+\w.-]*@/i,
  /^demo[+\w.-]*@/i,
  /^sample[+\w.-]*@/i,
];

export type TemplateEmailSendInput = {
  to: string | string[];
  fromEmail?: string | null;
  fromName?: string | null;
  replyTo?: string | null;
  subject: string;
  templateAlias: string;
  variables: Record<string, string | number>;
  fallbackHtml: string;
  fallbackText: string;
  tags?: Array<{ name: string; value: string }>;
  idempotencyKey?: string | null;
};

export type TemplateEmailSendResult = {
  ok: true;
  providerMessageId: string | null;
  templateAlias: string;
  templateUsed: boolean;
  fallbackUsed: boolean;
} | {
  ok: false;
  templateAlias: string;
  templateUsed: boolean;
  fallbackUsed: boolean;
  error: string;
};

export function clean(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function escapeHtml(value: unknown): string {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function labelPackage(value: unknown): string {
  const key = clean(value);
  if (!key) return "Custom setup";
  return PACKAGE_LABELS[key] || titleCase(key);
}

export function labelService(value: unknown): string {
  const key = clean(value);
  if (!key) return "Not provided yet";
  return SERVICE_LABELS[key] || titleCase(key);
}

export function firstNameFrom(fullName: unknown): string {
  return clean(fullName).split(/\s+/).filter(Boolean)[0] || "there";
}

function isPlaceholderValue(value: unknown): boolean {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return false;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isPlaceholderWebsite(value: unknown): boolean {
  const normalized = clean(value).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  if (!normalized) return false;
  return ["abc.com", "example.com", "test.com", "demo.com", "localhost"].includes(normalized) || normalized.endsWith(".test");
}

function isTestEmail(value: unknown): boolean {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return false;
  return TEST_EMAIL_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function getRemoteSetupIntakeSuppressionReasons(input: {
  business_name?: unknown;
  contact_name?: unknown;
  owner_name?: unknown;
  email?: unknown;
  website?: unknown;
  is_sample?: unknown;
}): string[] {
  const reasons: string[] = [];
  if (Boolean(input.is_sample)) reasons.push("sample_record");
  if (isPlaceholderValue(input.business_name)) reasons.push("business_name_placeholder_or_test_value");
  if (isPlaceholderValue(input.contact_name) || isPlaceholderValue(input.owner_name)) reasons.push("contact_name_placeholder_or_test_value");
  if (isTestEmail(input.email)) reasons.push("recipient_email_test_value");
  if (isPlaceholderWebsite(input.website)) reasons.push("website_placeholder_or_test_value");
  return reasons;
}

export function getFromEmail(defaultEmail = "system@clientsurgesystems.com"): string {
  return Deno.env.get("RESEND_FROM_EMAIL") || Deno.env.get("RESEND_FROM_ADDRESS") || defaultEmail;
}

export function commonTemplateVariables(overrides: Record<string, string | number> = {}): Record<string, string | number> {
  return {
    RECIPIENT_NAME: "there",
    BUSINESS_NAME: "your business",
    REFERENCE_ID: "not assigned",
    SUPPORT_EMAIL: DEFAULT_SUPPORT_EMAIL,
    SUPPORT_PHONE: DEFAULT_SUPPORT_PHONE,
    CLIENTSURGE_WEBSITE: APP_URL,
    LOGO_URL: Deno.env.get("CLIENTSURGE_EMAIL_LOGO_URL") || "",
    SENDER_NAME: "ClientSurge Setup Team",
    SENDER_TITLE: "Automation Installation Team",
    SENDER_HEADSHOT_URL: Deno.env.get("CLIENTSURGE_SENDER_HEADSHOT_URL") || "",
    CALENDAR_URL: DEFAULT_CALENDAR_URL,
    ...overrides,
  };
}

function normalizeTagValue(value: string): string {
  return clean(value).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256) || "unknown";
}

function safeTags(tags: Array<{ name: string; value: string }> = []): Array<{ name: string; value: string }> {
  return tags
    .map((tag) => ({ name: normalizeTagValue(tag.name), value: normalizeTagValue(tag.value) }))
    .filter((tag) => tag.name && tag.value);
}

export function renderMasterFallbackHtml(input: {
  badge: string;
  headline: string;
  intro: string;
  ctaLabel?: string;
  ctaUrl?: string;
  rows?: Array<[string, string | number | null | undefined]>;
  bullets?: string[];
  proofLine?: string;
  senderName?: string;
  senderTitle?: string;
  referenceId?: string | null;
}): string {
  const rows = input.rows || [];
  const bullets = input.bullets || [];
  const cta = input.ctaLabel && input.ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 4px 0;"><tr><td bgcolor="#0088CC" style="border-radius:999px;background:linear-gradient(90deg,#0088CC,#005691);box-shadow:0 8px 24px rgba(0,121,193,0.36);"><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:15px 23px;color:#ffffff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">${escapeHtml(input.ctaLabel)}</a></td></tr></table>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(input.headline)}</title></head>
  <body style="margin:0;padding:0;background:#F7FBFE;color:#000000;font-family:Inter,Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#F7FBFE;"><tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #C9E7FB;border-radius:24px;overflow:hidden;">
        <tr><td style="padding:28px 30px 18px 30px;border-bottom:1px solid #C9E7FB;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><div style="font-size:23px;line-height:29px;font-weight:900;letter-spacing:-0.7px;color:#000000;">ClientSurge <span style="color:#00AEEF;">Systems</span></div></td><td align="right"><span style="display:inline-block;background:#EEF9FF;color:#005691;border:1px solid #C9E7FB;border-radius:999px;padding:8px 12px;font-size:12px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.4px;">${escapeHtml(input.badge)}</span></td></tr></table></td></tr>
        <tr><td style="padding:30px;">
          <h1 style="margin:0 0 12px 0;color:#000000;font-size:28px;line-height:34px;font-weight:900;letter-spacing:-0.8px;">${escapeHtml(input.headline)}</h1>
          <p style="margin:0;color:#262626;font-size:16px;line-height:25px;">${escapeHtml(input.intro)}</p>
          ${cta}
          ${rows.length ? `<div style="background:#EEF9FF;border:1px solid #C9E7FB;border-left:6px solid #00AEEF;border-radius:18px;padding:20px;margin-top:22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows.map(([label, value]) => `<tr><td style="padding:9px 0;border-bottom:1px solid #C9E7FB;color:#4B5563;font-size:13px;line-height:19px;width:40%;">${escapeHtml(label)}</td><td style="padding:9px 0;border-bottom:1px solid #C9E7FB;color:#000000;font-size:14px;line-height:20px;font-weight:800;">${escapeHtml(value ?? "Not provided yet")}</td></tr>`).join("")}</table></div>` : ""}
          ${bullets.length ? `<div style="background:#ffffff;border:1px solid #C9E7FB;border-radius:18px;padding:21px;margin-top:18px;"><h2 style="margin:0 0 10px 0;color:#000000;font-size:18px;line-height:24px;font-weight:900;">What happens next</h2><ul style="margin:13px 0 0 0;padding:0;list-style:none;">${bullets.map((bullet) => `<li style="margin:0 0 9px 0;color:#262626;font-size:14px;line-height:21px;"><span style="display:inline-block;width:18px;height:18px;border-radius:999px;background:#EEF9FF;color:#00AEEF;text-align:center;font-size:12px;font-weight:900;line-height:18px;margin-right:8px;">✓</span>${escapeHtml(bullet)}</li>`).join("")}</ul></div>` : ""}
          <div style="background:#EEF9FF;border:1px solid #C9E7FB;border-left:6px solid #00AEEF;border-radius:16px;padding:16px 18px;margin-top:20px;"><p style="margin:0;color:#005691;font-size:14px;line-height:22px;"><strong>Security note:</strong> Never send passwords by email. Use secure access links or access instructions only.</p></div>
        </td></tr>
        <tr><td style="padding:0 30px 30px 30px;"><div style="background:#000000;border-radius:20px;padding:22px;color:#ffffff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="width:72px;vertical-align:top;padding-right:14px;"><div style="width:58px;height:58px;border-radius:999px;background:#EEF9FF;color:#00AEEF;font-size:18px;line-height:58px;font-weight:900;text-align:center;border:2px solid #C9E7FB;">CS</div></td><td style="vertical-align:top;"><p style="margin:0;color:#ffffff;font-size:16px;line-height:22px;font-weight:900;">${escapeHtml(input.senderName || "ClientSurge Setup Team")}</p><p style="margin:2px 0 10px 0;color:#DFF6FF;font-size:13px;line-height:19px;font-weight:700;">${escapeHtml(input.senderTitle || "Automation Installation Team")}</p><p style="margin:0;color:#DFF6FF;font-size:13px;line-height:21px;">${escapeHtml(input.proofLine || "Replies go to a monitored ClientSurge inbox.")}</p><p style="margin:12px 0 0 0;color:#ffffff;font-size:13px;line-height:21px;"><a href="mailto:${escapeHtml(DEFAULT_SUPPORT_EMAIL)}" style="color:#ffffff;text-decoration:underline;">${escapeHtml(DEFAULT_SUPPORT_EMAIL)}</a><span style="color:#7dd3fc;"> • </span>${escapeHtml(DEFAULT_SUPPORT_PHONE)}<span style="color:#7dd3fc;"> • </span><a href="${escapeHtml(APP_URL)}" style="color:#ffffff;text-decoration:underline;">clientsurgesystems.com</a></p>${input.referenceId ? `<p style="margin:12px 0 0 0;color:#7dd3fc;font-size:11px;line-height:16px;">Reference: ${escapeHtml(input.referenceId)}</p>` : ""}</td></tr></table></div></td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}

export function renderMasterFallbackText(input: {
  headline: string;
  intro: string;
  ctaLabel?: string;
  ctaUrl?: string;
  rows?: Array<[string, string | number | null | undefined]>;
  referenceId?: string | null;
}): string {
  const lines = [input.headline, "", input.intro, ""];
  if (input.ctaLabel && input.ctaUrl) lines.push(`${input.ctaLabel}: ${input.ctaUrl}`, "");
  if (input.rows?.length) {
    lines.push("Details:");
    input.rows.forEach(([label, value]) => lines.push(`- ${label}: ${clean(value) || "Not provided yet"}`));
    lines.push("");
  }
  lines.push("Never send passwords by email. Use secure access links or access instructions only.", "", "ClientSurge Setup Team", DEFAULT_SUPPORT_EMAIL, DEFAULT_SUPPORT_PHONE, APP_URL);
  if (input.referenceId) lines.push(`Reference: ${input.referenceId}`);
  return lines.join("\n");
}

export async function sendClientSurgeResendTemplateEmail(input: TemplateEmailSendInput): Promise<TemplateEmailSendResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, templateAlias: input.templateAlias, templateUsed: false, fallbackUsed: false, error: "RESEND_API_KEY not configured" };

  const fromEmail = clean(input.fromEmail) || getFromEmail();
  const fromName = clean(input.fromName) || "ClientSurge Systems";
  const commonPayload = {
    from: `${fromName} <${fromEmail}>`,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    ...(input.tags?.length ? { tags: safeTags(input.tags) } : {}),
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;

  const templateResponse = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...commonPayload,
      template: {
        id: input.templateAlias,
        variables: input.variables,
      },
    }),
  });

  if (templateResponse.ok) {
    const data = await templateResponse.json().catch(() => ({}));
    return { ok: true, providerMessageId: data?.id || null, templateAlias: input.templateAlias, templateUsed: true, fallbackUsed: false };
  }

  const templateError = await templateResponse.text().catch(() => "template send failed");

  const fallbackResponse = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...commonPayload,
      html: input.fallbackHtml,
      text: input.fallbackText,
    }),
  });

  if (fallbackResponse.ok) {
    const data = await fallbackResponse.json().catch(() => ({}));
    return { ok: true, providerMessageId: data?.id || null, templateAlias: input.templateAlias, templateUsed: false, fallbackUsed: true };
  }

  const fallbackError = await fallbackResponse.text().catch(() => "fallback send failed");
  return {
    ok: false,
    templateAlias: input.templateAlias,
    templateUsed: false,
    fallbackUsed: true,
    error: `Template send failed: ${templateError}; fallback send failed: ${fallbackError}`,
  };
}

export async function logEmailEvent(serviceRole: any, input: {
  leadId?: string | null;
  orderId?: string | null;
  onboardingClientId?: string | null;
  contextType?: string | null;
  contextId?: string | null;
  eventType: "email_sent" | "email_failed" | "email_skipped";
  status: "sent" | "failed" | "processed";
  subject: string;
  bodyPreview: string;
  templateAlias: string;
  providerMessageId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  suppressionReasons?: string[];
  fallbackUsed?: boolean;
  templateUsed?: boolean;
  recipient?: string | null;
}) {
  try {
    await serviceRole.entities.CommunicationEvent.create({
      lead_id: input.leadId || null,
      order_id: input.orderId || null,
      onboarding_client_id: input.onboardingClientId || null,
      context_type: input.contextType || input.relatedEntityType || null,
      context_id: input.contextId || input.relatedEntityId || null,
      channel: "email",
      direction: "outbound",
      event_type: input.eventType,
      provider: "resend",
      status: input.status,
      subject: input.subject,
      message_body: input.bodyPreview.slice(0, 2000),
      provider_message_id: input.providerMessageId || null,
      metadata_json: JSON.stringify({
        template_alias: input.templateAlias,
        template_version: CLIENTSURGE_EMAIL_TEMPLATE_VERSION,
        related_entity_type: input.relatedEntityType || null,
        related_entity_id: input.relatedEntityId || null,
        recipient: input.recipient || null,
        suppression_reasons: input.suppressionReasons || [],
        template_used: Boolean(input.templateUsed),
        fallback_used: Boolean(input.fallbackUsed),
      }),
      environment: "production",
    });
  } catch (error) {
    console.warn("[ClientSurgeEmail] CommunicationEvent logging failed:", error?.message || error);
  }
}