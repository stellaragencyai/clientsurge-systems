import { secureJson } from "../_shared/response.ts";
/**
 * missingCredentialsAlert — #409 #409a
 * Runs daily at 9am MST. Finds Orders: paid but credentials not submitted (workflow_stage = "Configuring").
 * Sends warm reminder email to client.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

// #409a: warm reminder email template
function buildReminderEmail(client_name, portal_link) {
  return `
<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#fff;">
  <h2 style="color:#0A0F1E;font-size:20px;font-weight:800;margin:0 0 8px;">We're ready to activate your system 🚀</h2>
  <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
    Hey ${client_name || "there"},
  </p>
  <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
    Your ClientSurge AI system is built and ready to go — we just need a couple of details from you to activate it.
    It only takes about 2 minutes.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${portal_link}" style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#00FFB3);color:#0A0F1E;border-radius:9999px;padding:14px 32px;font-size:15px;font-weight:800;text-decoration:none;">
      Complete My Setup →
    </a>
  </div>
  <p style="color:#6B7280;font-size:13px;text-align:center;">
    Questions? Just reply to this email — Nolan will get back to you within a few hours.
  </p>
</div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find paid orders still in "Configuring" stage (credentials not submitted)
    const orders = await base44.asServiceRole.entities.Order
      .filter({ payment_status: "paid", workflow_stage: "Configuring" }).catch(() => []);

    let reminded = 0;
    for (const order of (orders || [])) {
      // Skip if reminded in last 24h
      if (order.last_credentials_reminder) {
        const last = new Date(order.last_credentials_reminder);
        if (Date.now() - last.getTime() < 23 * 3600000) continue;
      }

      const portalLink = \`https://clientsurgesystems.com/setup/credentials?order_id=\${order.id}\`;
      const html = buildReminderEmail(order.client_name, portalLink);

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (order.client_email && resendKey) {
        await resendFetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: \`Bearer \${resendKey}\`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "system@clientsurgesystems.com",
            reply_to: "nolan@clientsurgesystems.com",
            to: order.client_email,
            subject: "We're ready to activate your system — just need 2 minutes from you",
            html,
          }),
        }).catch(() => {});

        await base44.asServiceRole.entities.Order.update(order.id, {
          last_credentials_reminder: new Date().toISOString(),
        });
        reminded++;
      }
    }

    console.log(\`[missingCredentialsAlert] Reminded \${reminded} clients\`);
    return secureJson({ success: true, reminded, total_stalled: orders?.length || 0 });
  } catch (err) {
    console.error("[missingCredentialsAlert]", err.message);
    return secureJson({ error: err.message }, { status: 500 });
  }
});
