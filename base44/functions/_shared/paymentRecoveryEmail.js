function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatFromAddress(value) {
  const email = String(value || "billing@clientsurgesystems.com").trim();
  if (email.includes("<") && email.includes(">")) {
    return email;
  }
  return `ClientSurge Systems <${email}>`;
}

function formatMoneyFromCents(amountDueCents) {
  const amount = Number(amountDueCents || 0) / 100;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function buildPaymentRecoveryEmail({
  order = {},
  invoice = {},
  paymentUpdateUrl = "",
  fromEmail = "",
  replyToEmail = "",
} = {}) {
  const customerEmail = order.customer_email || invoice.customer_email || "";
  const customerName = order.customer_name || "there";
  const businessName = order.business_name || "your business";
  const amountDue = formatMoneyFromCents(invoice.amount_due || invoice.amount_remaining || 0);
  const safeUrl = String(paymentUpdateUrl || "").trim();

  const text = [
    `Hi ${customerName},`,
    "",
    `Stripe reported a failed payment for ${businessName}.`,
    invoice.number ? `Invoice: ${invoice.number}` : "",
    `Amount due: ${amountDue}`,
    "",
    safeUrl
      ? `Update payment here: ${safeUrl}`
      : "Please open your ClientSurge billing portal or reply to this email for help updating payment.",
    "",
    "Your automations remain tracked in ClientSurge, but billing may show as past due until this is resolved.",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#111827;">
      <h1 style="margin:0 0 12px;font-size:26px;color:#991B1B;">Payment update needed</h1>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(customerName)}, Stripe reported a failed payment for <strong>${escapeHtml(businessName)}</strong>.</p>
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:16px;padding:20px;margin-bottom:20px;">
        ${invoice.number ? `<p style="margin:0 0 8px;font-size:14px;color:#7F1D1D;">Invoice: <strong>${escapeHtml(invoice.number)}</strong></p>` : ""}
        <p style="margin:0;font-size:14px;color:#7F1D1D;">Amount due: <strong>${escapeHtml(amountDue)}</strong></p>
      </div>
      ${
        safeUrl
          ? `<a href="${escapeHtml(safeUrl)}" style="display:inline-block;background:#0F172A;color:#FFFFFF;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;">Update payment</a>`
          : `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#334155;">Please open your ClientSurge billing portal or reply to this email for help updating payment.</p>`
      }
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748B;">Your automations remain tracked in ClientSurge, but billing may show as past due until this is resolved.</p>
    </div>
  `;

  return {
    from: formatFromAddress(fromEmail),
    reply_to: replyToEmail || "billing@clientsurgesystems.com",
    to: customerEmail,
    subject: "Payment update needed for your ClientSurge account",
    text,
    html,
  };
}
