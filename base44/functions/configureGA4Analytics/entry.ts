/**
 * Configure GA4 Analytics for ClientSurge
 * Sets measurement ID and enables event tracking for:
 * - Page views
 * - Form submissions
 * - Link clicks
 * - Conversion events
 */

Deno.serve(async (req) => {
  try {
    const { measurement_id } = await req.json();

    if (!measurement_id || !measurement_id.match(/^G-[A-Z0-9]{10,}$/i)) {
      return new Response(
        JSON.stringify({ error: "Invalid GA4 measurement ID (format: G-XXXXXXXXXX)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Store in environment or return configuration
    const config = {
      measurement_id,
      status: "configured",
      events_enabled: [
        "page_view",
        "form_submit",
        "link_click",
        "conversion",
        "scroll_depth",
        "sign_up",
        "purchase",
      ],
      installation: {
        script_url: `https://www.googletagmanager.com/gtag/js?id=${measurement_id}`,
        init_script: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurement_id}', { send_page_view: true });
        `,
      },
      tracking_setup: {
        forms: "Add data-ga-form='form-name' to track form submissions",
        links: "Add onclick=\"trackLinkClick(this.href, this.textContent)\" to track link clicks",
        conversions: "Call window.gtag('event', 'conversion', { event_name: '...' })",
      },
    };

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});