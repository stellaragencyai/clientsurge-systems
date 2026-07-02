import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { csEmailShell, csInfoCard, csPillButton, csEmailLogoUrl, CS_EMAIL_THEME, csEmailEscape } from "../_shared/clientSurgeEmailDesignSystem.ts";
import { formatClientSurgeFrom, getClientSurgeSignature, senderTags } from "../_shared/clientSurgeEmailSignatures.ts";

function buildReminderEmail(input: { clientName?: string; portalLink: string; businessName?: string }) {
  const signature = getClientSurgeSignature("support");
  const nameLine = `<p style="margin:0 0 10px;color:${CS_EMAIL_THEME.muted};font-size:15px;line-height:22px;font-weight:650;">Hey ${csEmailEscape(input.clientName || "there")},</p>`;
  const body = `${nameLine}${csInfoCard("Status", `Your ClientSurge AI system${input.businessName ? ` for ${input.businessName}` : ""} is built and ready to activate. We are only waiting on the final setup details.`, { accent: true })}${csInfoCard("What we need", "Complete the secure credentials form inside your ClientSurge setup page. Do not send passwords or private access details by email.")}${csInfoCard("Time Required", "This should take about 2 minutes. Once submitted, we can continue activation and final testing.")}${csPillButton("Complete My Setup →", input.portalLink)}`;

  return csEmailShell({
    badge: "Action Needed",
    title: "Your system is ready — we need final setup details.",
    subtitle: "Complete the secure credentials step so we can activate your ClientSurge system.",
    body,
    logoUrl: csEmailLogoUrl(),
    footerTitle: signature.footerTitle,
    footerText: signature.footerText,
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const orders = await base44.asServiceRole.entities.Order.filter({ payment_status: "paid", workflow_stage: "Configuring" }).catch(() => []);
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const signature = getClientSurgeSignature("support");

    let reminded = 0;
    for (const order of orders || []) {
      if (order.last_credentials_reminder) {
        const last = new Date(order.last_credentials_reminder);
        if (Date.now() - last.getTime() < 23 * 3600000) continue;
      }

      const clientEmail = order.client_email || order.customer_email;
      if (!clientEmail || !resendKey) continue;

      const portalLink = `https://clientsurgesystems.com/setup/credentials?order_id=${order.id}`;
      const html = buildReminderEmail({ clientName: order.client_name || order.customer_name, businessName: order.business_name, portalLink });
      const response = await resendFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: formatClientSurgeFrom("support"),
          reply_to: signature.replyTo,
          to: clientEmail,
          subject: "Action needed: complete your ClientSurge setup details",
          html,
          tags: senderTags("support", "missing_credentials_alert"),
        }),
      }).catch((error) => ({ ok: false, error }));

      if (!response?.ok) continue;

      await base44.asServiceRole.entities.Order.update(order.id, { last_credentials_reminder: new Date().toISOString() });
      reminded++;
    }

    console.log(`[missingCredentialsAlert] Reminded ${reminded} clients`);
    return secureJson({ success: true, reminded, total_stalled: orders?.length || 0 });
  } catch (err) {
    console.error("[missingCredentialsAlert]", err.message);
    return secureJson({ error: err.message }, { status: 500 });
  }
});
