export const CLIENTSURGE_EMAIL_DESIGN_SYSTEM_VERSION = "clientsurge_email_design_system_v1.0.0";

export const CS_EMAIL_THEME = {
  electric: "#00AEEF",
  deep: "#0088CC",
  navy: "#005691",
  page: "#F7FBFE",
  soft: "#EEF9FF",
  border: "#C9E7FB",
  text: "#000000",
  body: "#262626",
  muted: "#4B5563",
  footerSoft: "#DFF6FF",
} as const;

export function csEmailClean(value: unknown): string {
  return String(value ?? "").trim();
}

export function csEmailEscape(value: unknown): string {
  return csEmailClean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function csEmailLogoUrl(): string {
  return Deno.env.get("CLIENTSURGE_EMAIL_LOGO_URL") || Deno.env.get("CLIENTSURGE_LOGO_URL") || "";
}

export function csEmailFrom(defaultEmail = "system@clientsurgesystems.com"): string {
  const configured = csEmailClean(Deno.env.get("RESEND_FROM_EMAIL") || Deno.env.get("RESEND_FROM_ADDRESS"));
  const email = configured || defaultEmail;
  if (email.includes("<") && email.includes(">")) return email;
  return `ClientSurge Systems <${email}>`;
}

export function csLogoLockup(logoUrl = csEmailLogoUrl()): string {
  const src = csEmailEscape(logoUrl);
  const mark = src
    ? `<img src="${src}" width="46" height="46" alt="ClientSurge Systems" style="display:block;width:46px;height:46px;border:0;border-radius:12px;object-fit:contain;background:#ffffff;" />`
    : `<div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,${CS_EMAIL_THEME.deep},${CS_EMAIL_THEME.navy});box-shadow:0 8px 22px rgba(0,174,239,0.28);color:#ffffff;font-family:Montserrat,Arial,sans-serif;font-size:15px;line-height:46px;font-weight:900;text-align:center;">CS</div>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:0 12px 0 0;vertical-align:middle;">${mark}</td><td style="vertical-align:middle;"><div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:29px;font-weight:900;letter-spacing:-0.03em;color:#000000;">ClientSurge <span style="color:${CS_EMAIL_THEME.electric};">Systems</span></div><div style="margin-top:5px;color:${CS_EMAIL_THEME.muted};font-size:12px;line-height:17px;font-weight:700;">AI lead-response and booking automation</div></td></tr></table>`;
}

export function csPillButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td bgcolor="${CS_EMAIL_THEME.deep}" style="border-radius:999px;background:linear-gradient(90deg,${CS_EMAIL_THEME.deep},${CS_EMAIL_THEME.navy});box-shadow:0 8px 24px rgba(0,121,193,0.36);"><a href="${csEmailEscape(url)}" style="display:inline-block;padding:15px 23px;color:#ffffff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">${csEmailEscape(label)}</a></td></tr></table>`;
}

export function csInfoCard(label: string, value: string, options: { accent?: boolean } = {}): string {
  return `<div style="background:${options.accent ? CS_EMAIL_THEME.soft : "#ffffff"};border:1px solid ${CS_EMAIL_THEME.border};${options.accent ? `border-left:6px solid ${CS_EMAIL_THEME.electric};` : ""}border-radius:16px;padding:20px 22px;margin-top:18px;"><div style="color:${CS_EMAIL_THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">${csEmailEscape(label)}</div><p style="margin:10px 0 0;color:#000000;font-size:15px;line-height:24px;font-weight:800;">${csEmailEscape(value)}</p></div>`;
}

export function csEmailShell(input: {
  badge: string;
  title: string;
  subtitle: string;
  body: string;
  ctaHtml?: string;
  footerTitle?: string;
  footerText?: string;
  logoUrl?: string;
}): string {
  const footerText = input.footerText || `Reply to this email or contact ${Deno.env.get("SUPPORT_EMAIL") || "support@clientsurgesystems.com"}. ${Deno.env.get("SUPPORT_PHONE") || "(602) 584-3227"} · Phoenix, Arizona`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" /><title>${csEmailEscape(input.title)}</title></head><body style="margin:0;padding:0;background:${CS_EMAIL_THEME.page};color:#000000;font-family:Inter,Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${csEmailEscape(input.subtitle)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${CS_EMAIL_THEME.page};border-collapse:collapse;"><tr><td align="center" style="padding:30px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#ffffff;border:1px solid ${CS_EMAIL_THEME.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);"><tr><td style="height:7px;background:linear-gradient(90deg,${CS_EMAIL_THEME.deep},${CS_EMAIL_THEME.electric},${CS_EMAIL_THEME.navy});font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 32px 22px;border-bottom:1px solid ${CS_EMAIL_THEME.border};background:#ffffff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="vertical-align:middle;">${csLogoLockup(input.logoUrl)}</td><td align="right" style="vertical-align:middle;"><span style="display:inline-block;background:${CS_EMAIL_THEME.soft};color:${CS_EMAIL_THEME.navy};border:1px solid ${CS_EMAIL_THEME.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${csEmailEscape(input.badge)}</span></td></tr></table></td></tr><tr><td style="padding:34px 32px 10px;"><h1 style="margin:0;color:#000000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-0.045em;">${csEmailEscape(input.title)}</h1><p style="margin:14px 0 0;color:${CS_EMAIL_THEME.body};font-size:17px;line-height:27px;font-weight:500;">${csEmailEscape(input.subtitle)}</p>${input.ctaHtml || ""}${input.body}</td></tr><tr><td style="padding:30px 32px 32px;"><div style="background:#000000;border-radius:16px;padding:20px 22px;color:#ffffff;box-shadow:0 12px 32px rgba(0,0,0,0.16);"><p style="margin:0;color:#ffffff;font-size:15px;line-height:22px;font-weight:900;">${csEmailEscape(input.footerTitle || "ClientSurge Systems")}</p><p style="margin:8px 0 0;color:${CS_EMAIL_THEME.footerSoft};font-size:13px;line-height:20px;">${csEmailEscape(footerText)}</p></div></td></tr></table></td></tr></table></body></html>`;
}
