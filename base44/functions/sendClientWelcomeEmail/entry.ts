import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

Deno.serve(async (req) => {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: "Missing order_id" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Fetch the order
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const { customer_name, customer_email, business_name } = order;

    if (!customer_email) {
      return Response.json({ error: "Missing customer email" }, { status: 400 });
    }

    // Generate dashboard URL
    const dashboardUrl = `${new URL(req.url).origin}/client-dashboard`;

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: customer_email,
        subject: "Welcome to ClientSurge Systems – Your Dashboard Is Ready",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1b140d; font-size: 28px; margin: 0 0 8px; font-weight: 800;">
                Welcome to ClientSurge!
              </h1>
              <p style="color: rgba(27, 20, 13, 0.6); font-size: 16px; margin: 0;">
                Your AI automation systems are being set up.
              </p>
            </div>

            <div style="background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 40%, #7a4825 100%); border-radius: 12px; padding: 24px; color: #ffffff; margin-bottom: 32px;">
              <p style="font-size: 14px; margin: 0 0 16px;">
                Hi <strong>${customer_name || "there"}</strong>,
              </p>
              <p style="font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
                Your order for <strong>${business_name}</strong> has been confirmed and your automation systems are being installed. You can now track the progress of each service in real time.
              </p>
              <p style="font-size: 14px; margin: 0;">
                We'll guide you through each step of the setup process and ensure everything is running smoothly by your go-live date.
              </p>
            </div>

            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #a0714f 0%, #c8965c 30%, #f5d9a8 50%, #c8965c 70%, #7a4f2e 100%); color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; transition: opacity 0.3s;">
                View Your Installation Dashboard
              </a>
            </div>

            <div style="background: rgba(154, 92, 46, 0.08); border: 1px solid rgba(154, 92, 46, 0.15); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="font-size: 13px; font-weight: 700; color: #9a5c2e; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.08em;">
                What's Next?
              </p>
              <ul style="font-size: 13px; color: rgba(27, 20, 13, 0.7); margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Review the progress tracker for each automation</li>
                <li style="margin-bottom: 8px;">Complete the setup steps in your dashboard</li>
                <li>Reach out if you have any questions</li>
              </ul>
            </div>

            <div style="border-top: 1px solid rgba(154, 92, 46, 0.12); padding-top: 24px; text-align: center;">
              <p style="font-size: 12px; color: rgba(27, 20, 13, 0.5); margin: 0;">
                Have questions? Contact us at <a href="mailto:support@clientsurgesystems.com" style="color: #9a5c2e; text-decoration: none;">support@clientsurgesystems.com</a>
              </p>
              <p style="font-size: 12px; color: rgba(27, 20, 13, 0.5); margin: 8px 0 0;">
                ClientSurge Systems — AI-Powered Automation for Your Business
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return Response.json({ error: "Failed to send email" }, { status: 500 });
    }

    const result = await response.json();
    console.log(`[Welcome Email] Sent to ${customer_email} for order ${order_id}`);

    return Response.json({ success: true, message_id: result.id });
  } catch (error) {
    console.error("Welcome email error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});