import { csEmailEscape } from "./clientSurgeEmailDesignSystem.ts";

export type ClientSurgeSenderIdentity = "system" | "support" | "founder" | "sales" | "billing";

export type ClientSurgeSignature = {
  identity: ClientSurgeSenderIdentity;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  footerTitle: string;
  footerText: string;
  plainText: string;
};

const DOMAIN = "clientsurgesystems.com";
const SUPPORT_PHONE = Deno.env.get("SUPPORT_PHONE") || "(602) 584-3227";

const EMAILS = {
  system: Deno.env.get("SYSTEM_EMAIL") || `system@${DOMAIN}`,
  support: Deno.env.get("SUPPORT_EMAIL") || `support@${DOMAIN}`,
  founder: Deno.env.get("FOUNDER_EMAIL") || Deno.env.get("NOLAN_EMAIL") || `nolan@${DOMAIN}`,
  sales: Deno.env.get("SALES_EMAIL") || `sales@${DOMAIN}`,
  billing: Deno.env.get("BILLING_EMAIL") || `billing@${DOMAIN}`,
};

export const CLIENTSURGE_SIGNATURES: Record<ClientSurgeSenderIdentity, ClientSurgeSignature> = {
  system: {
    identity: "system",
    fromName: "ClientSurge Systems",
    fromEmail: EMAILS.system,
    replyTo: EMAILS.support,
    footerTitle: "ClientSurge Systems",
    footerText: `Automated platform notification. Replies are monitored by ClientSurge Support. ${SUPPORT_PHONE} · Phoenix, Arizona`,
    plainText: `ClientSurge Systems\nAutomated platform notification\n${DOMAIN}\n\nReplies are monitored by ClientSurge Support.`,
  },
  support: {
    identity: "support",
    fromName: "ClientSurge Support",
    fromEmail: EMAILS.support,
    replyTo: EMAILS.support,
    footerTitle: "ClientSurge Support",
    footerText: `Helping your AI systems run flawlessly. ${EMAILS.support} · ${SUPPORT_PHONE} · Phoenix, Arizona`,
    plainText: `ClientSurge Support\nHelping your AI systems run flawlessly\n${EMAILS.support}\n${SUPPORT_PHONE}\n${DOMAIN}`,
  },
  founder: {
    identity: "founder",
    fromName: "Nolan Strommer · ClientSurge Systems",
    fromEmail: EMAILS.founder,
    replyTo: EMAILS.founder,
    footerTitle: "Nolan Strommer · Founder, ClientSurge Systems",
    footerText: `Helping businesses automate lead response, booking, and customer communication. ${EMAILS.founder} · ${SUPPORT_PHONE}`,
    plainText: `Nolan Strommer\nFounder, ClientSurge Systems\nHelping businesses automate lead response, booking, and customer communication.\n${EMAILS.founder}\n${SUPPORT_PHONE}\n${DOMAIN}`,
  },
  sales: {
    identity: "sales",
    fromName: "ClientSurge Sales",
    fromEmail: EMAILS.sales,
    replyTo: EMAILS.founder,
    footerTitle: "ClientSurge Sales",
    footerText: `Questions about packages or setup? Reply here and the ClientSurge team will help. ${SUPPORT_PHONE}`,
    plainText: `ClientSurge Sales\n${EMAILS.sales}\n${SUPPORT_PHONE}\n${DOMAIN}`,
  },
  billing: {
    identity: "billing",
    fromName: "ClientSurge Billing",
    fromEmail: EMAILS.billing,
    replyTo: EMAILS.billing,
    footerTitle: "ClientSurge Billing",
    footerText: `Billing and subscription support for ClientSurge Systems. ${EMAILS.billing} · ${SUPPORT_PHONE}`,
    plainText: `ClientSurge Billing\n${EMAILS.billing}\n${SUPPORT_PHONE}\n${DOMAIN}`,
  },
};

export function getClientSurgeSignature(identity: ClientSurgeSenderIdentity = "system"): ClientSurgeSignature {
  return CLIENTSURGE_SIGNATURES[identity] || CLIENTSURGE_SIGNATURES.system;
}

export function formatClientSurgeFrom(identity: ClientSurgeSenderIdentity = "system"): string {
  const signature = getClientSurgeSignature(identity);
  return `${signature.fromName} <${signature.fromEmail}>`;
}

export function buildClientSurgeHtmlSignature(identity: ClientSurgeSenderIdentity = "system"): string {
  const signature = getClientSurgeSignature(identity);
  return `<div style="margin-top:22px;padding-top:18px;border-top:1px solid #C9E7FB;"><p style="margin:0;color:#000000;font-size:14px;line-height:21px;font-weight:900;">${csEmailEscape(signature.footerTitle)}</p><p style="margin:6px 0 0;color:#4B5563;font-size:13px;line-height:20px;">${csEmailEscape(signature.footerText)}</p></div>`;
}

export function senderTags(identity: ClientSurgeSenderIdentity, category: string) {
  return [
    { name: "sender_identity", value: identity },
    { name: "category", value: category.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256) || "email" },
  ];
}
