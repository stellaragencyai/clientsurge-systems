/**
 * Unified Professional Email Template
 * ClientSurge Systems - Electric Blue Brand (#00AEEF)
 * 
 * Usage:
 * const html = buildEmailTemplate({
 *   heading: "Your Order is Confirmed",
 *   body: "<p>Details here</p>",
 *   cta: { text: "View Portal", url: "https://..." },
 *   footerMessage: "Questions? Contact support@..."
 * });
 */

export function buildEmailTemplate({
  heading = "",
  subheading = "",
  body = "",
  cta = null,
  footerMessage = "",
  items = null,
} = {}) {
  const ctaButton = cta ? `
    <a href="${cta.url}" style="display:inline-block;margin-top:12px;background:linear-gradient(90deg, #0079c1 0%, #005691 100%);color:#FFFFFF;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 2px 12px rgba(0,121,193,0.35);">
      ${cta.text}
    </a>
  ` : "";

  const itemsList = items ? `
    <div style="margin:24px 0;">
      <ul style="margin:0;padding-left:20px;list-style:none;">
        ${items.map(item => `
          <li style="margin-bottom:10px;color:#374151;font-size:14px;">
            <strong style="color:#1F2937;">${item.name}</strong> - ${item.desc}
          </li>
        `).join("")}
      </ul>
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
        .header { background: linear-gradient(135deg, #003B8F 0%, #006BB0 52%, #00AEEF 100%); padding: 32px 24px; text-align: center; }
        .logo { font-size: 24px; font-weight: 900; color: #FFFFFF; margin: 0; letter-spacing: -0.02em; }
        .content { padding: 32px 24px; color: #1F2937; }
        .content h1 { margin: 0 0 8px; font-size: 28px; font-weight: 900; color: #0A0F1E; font-family: 'Montserrat', Arial, sans-serif; }
        .content h2 { margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #6B7280; }
        .highlight-box { background: #F0F9FF; border-left: 4px solid #00AEEF; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .highlight-box p { margin: 0; color: #0A0F1E; font-weight: 600; }
        .footer { padding: 24px; text-align: center; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 13px; }
        .footer a { color: #00AEEF; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p class="logo">ClientSurge</p>
        </div>
        <div class="content">
          <h1>${heading}</h1>
          ${subheading ? `<h2>${subheading}</h2>` : ""}
          <p style="margin: 16px 0 0; line-height: 1.6; color: #374151;">${body}</p>
          ${itemsList}
          ${ctaButton ? `<div style="margin-top: 24px;">${ctaButton}</div>` : ""}
        </div>
        <div class="footer">
          ${footerMessage || "<p>© 2026 ClientSurge Systems. All rights reserved.</p>"}
        </div>
      </div>
    </body>
    </html>
  `;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}