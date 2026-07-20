/**
 * Legacy compatibility helper.
 *
 * GA4 is configured through setupGA4Configuration and verified through
 * verifyGA4Configuration. Do not generate a second browser tag snippet here.
 */

const CANONICAL_EVENTS = [
  "page_view",
  "scroll",
  "scroll_depth",
  "cta_click",
  "pricing_view",
  "link_click",
  "form_submit_attempt",
  "form_submit",
  "generate_lead",
  "contact_form_submit",
  "audit_request_started",
  "audit_request_submitted",
  "begin_checkout",
  "purchase",
  "purchase_client_confirmation",
  "demo_booked",
  "onboarding_complete",
];

Deno.serve(async (req) => {
  try {
    const { measurement_id } = await req.json().catch(() => ({}));

    if (measurement_id && !String(measurement_id).match(/^G-[A-Z0-9]{4,}$/i)) {
      return new Response(
        JSON.stringify({ error: "Invalid GA4 measurement ID (format: G-XXXXXXXXXX)" }),
        { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
      );
    }

    return new Response(
      JSON.stringify({
        status: "deprecated",
        replacement_functions: ["setupGA4Configuration", "verifyGA4Configuration"],
        browser_installation: "src/lib/ga4.js installs the single GA4 tag with Consent Mode v2 and send_page_view disabled.",
        events_enabled: CANONICAL_EVENTS,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "GA4 compatibility helper failed" }),
      { status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  }
});
