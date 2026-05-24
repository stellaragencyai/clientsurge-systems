/**
 * stalledCredentialsAlert
 * Runs daily at 9am MST.
 * Checks for Orders that are:
 *   - payment_status = "paid"
 *   - install_configuration_updated_at is null (credentials never submitted)
 *   - Created more than 24 hours ago
 *
 * Sends an email alert to admin for each stalled order.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { getAppUrl } from "../_shared/appUrl.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allPaidOrders = await base44.asServiceRole.entities.Order.filter(
      { payment_status: "paid" },
      "-created_date",
      200
    );

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stalled = (allPaidOrders || []).filter(order => {
      const isOldEnough = new Date(order.created_date) < twentyFourHoursAgo;
      const noCredentials = !order.install_configuration_updated_at;
      return isOldEnough && noCredentials;
    });

    if (stalled.length === 0) {
      console.log("[stalledCredentialsAlert] No stalled orders found.");
      return Response.json({ success: true, stalled_count: 0 });
    }

    const appUrl = getAppUrl();
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "nolan@clientsurgesystems.com";

    let rows = "";
    for (const order of stalled) {
      const hoursAgo = Math.floor((Date.now() - new Date(order.created_date)) / (1000 * 60 * 60));
      const credentialsUrl = `${appUrl}/setup/credentials?order_id=${order.id}`;
      rows += `
<tr style="border-bottom:1px solid #e5e7eb;">
  <td style="padding:12px 8px;font-weight:600;color:#1a1a1a;">${order.business_name || "Unknown"}</td>
  <td style="padding:12px 8px;color:#555;">${order.customer_email}</td>
  <td style="padding:12px 8px;color:#555;">${hoursAgo}h ago</td>
  <td style="padding:12px 8px;">
    <a href="${credentialsUrl}" style="color:#0077CC;font-size:12px;">Resend Link</a>
  </td>
</tr>`;
    }

    const emailBody = `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:0 auto;padding:32px 20px;">
  <h2 style="color:#0A1628;margin:0 0 8px;">⏰ ${stalled.length} Client${stalled.length > 1 ? "s" : ""} Haven't Submitted Setup Info</h2>
  <p style="color:#555;margin:0 0 24px;">These clients paid but haven't completed their credentials form. Consider sending a follow-up or resending their setup link.</p>

  <table style="width:100%;border-collapse:collapse;font-size:14px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:10px 8px;text-align:left;color:#374151;font-weight:600;">Business</th>
        <th style="padding:10px 8px;text-align:left;color:#374151;font-weight:600;">Email</th>
        <th style="padding:10px 8px;text-align:left;color:#374151;font-weight:600;">Paid</th>
        <th style="padding:10px 8px;text-align:left;color:#374151;font-weight:600;">Link</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="margin-top:24px;">
    <a href="${appUrl}/admin/onboarding" style="display:inline-block;background:#0A1628;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:14px;">View Admin Onboarding →</a>
  </div>

  <p style="font-size:12px;color:#aaa;margin-top:24px;">This alert runs daily at 9am MST. — ClientSurge Systems Automation</p>
</div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: "ClientSurge Systems",
      subject: `⏰ ${stalled.length} Client${stalled.length > 1 ? "s" : ""} Haven't Submitted Setup Info`,
      body: emailBody,
    });

    console.log(`[stalledCredentialsAlert] Alert sent for ${stalled.length} stalled orders`);
    return Response.json({ success: true, stalled_count: stalled.length });
  } catch (error) {
    console.error("[stalledCredentialsAlert] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
