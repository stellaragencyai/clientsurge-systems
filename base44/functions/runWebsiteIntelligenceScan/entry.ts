import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, website_url } = await req.json().catch(() => ({}));

    if (!order_id || !website_url) {
      return json({ error: "order_id and website_url required" }, 400);
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

    // Create scan record
    const scan = await base44.asServiceRole.entities.WebsiteIntelligenceScan.create({
      order_id,
      client_id: order.client_id || "",
      client_project_id: order.client_project_id || "",
      client_email: order.customer_email || "",
      business_name: order.business_name || "",
      website_url,
      scan_status: "in_progress",
      scanned_at: new Date().toISOString(),
    });

    // Use InvokeLLM to scan the website
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a website intelligence scanner. Analyze the website at "${website_url}" and return a JSON object with the following structure:
{
  "pages": [{"url": "...", "title": "...", "page_type": "home|contact|services|about|booking|listing|blog", "has_form": true/false, "has_cta": true/false, "has_phone": true/false}],
  "forms": [{"page_url": "...", "form_id": "...", "fields": ["name","email","phone","message"], "has_consent_checkbox": true/false}],
  "cta_buttons": [{"text": "...", "page_url": "...", "link": "..."}],
  "phone_numbers": ["..."],
  "email_addresses": ["..."],
  "booking_links": ["..."],
  "visible_services": ["..."],
  "detected_industry": "...",
  "lead_paths": [{"page_url": "...", "page_title": "...", "lead_intent": "buyer|seller|valuation|listing_inquiry|general_inquiry|property_inquiry|missed_call_recovery", "confidence": 0-100}],
  "missing_consent_language": true/false,
  "tracking_gaps": ["..."],
  "mobile_cta_issues": ["..."],
  "confidence_score": 0-100,
  "recommended_lead_path_mapping": [{"source": "...", "intent": "...", "automation": "..."}]
}

If the website appears to be a real estate website, map:
- Buyers page → buyer intent
- Sellers page → seller intent
- Home Valuation page → urgent seller valuation intent
- Listings page → listing inquiry intent
- Property Detail page → property-specific inquiry intent
- Contact page → general inquiry
- Phone Call → missed-call recovery

Use add_context_from_internet to fetch and analyze the actual website content.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          pages: { type: "array", items: { type: "object" } },
          forms: { type: "array", items: { type: "object" } },
          cta_buttons: { type: "array", items: { type: "object" } },
          phone_numbers: { type: "array", items: { type: "string" } },
          email_addresses: { type: "array", items: { type: "string" } },
          booking_links: { type: "array", items: { type: "string" } },
          visible_services: { type: "array", items: { type: "string" } },
          detected_industry: { type: "string" },
          lead_paths: { type: "array", items: { type: "object" } },
          missing_consent_language: { type: "boolean" },
          tracking_gaps: { type: "array", items: { type: "string" } },
          mobile_cta_issues: { type: "array", items: { type: "string" } },
          confidence_score: { type: "number" },
          recommended_lead_path_mapping: { type: "array", items: { type: "object" } },
        },
      },
    });

    // Update scan with results
    const updated = await base44.asServiceRole.entities.WebsiteIntelligenceScan.update(scan.id, {
      scan_status: "completed",
      pages: llmResponse.pages || [],
      forms: llmResponse.forms || [],
      cta_buttons: llmResponse.cta_buttons || [],
      phone_numbers: llmResponse.phone_numbers || [],
      email_addresses: llmResponse.email_addresses || [],
      booking_links: llmResponse.booking_links || [],
      visible_services: llmResponse.visible_services || [],
      detected_industry: llmResponse.detected_industry || "",
      lead_paths: llmResponse.lead_paths || [],
      missing_consent_language: llmResponse.missing_consent_language || false,
      tracking_gaps: llmResponse.tracking_gaps || [],
      mobile_cta_issues: llmResponse.mobile_cta_issues || [],
      confidence_score: llmResponse.confidence_score || 0,
      recommended_lead_path_mapping: llmResponse.recommended_lead_path_mapping || [],
      raw_scan_result: JSON.stringify(llmResponse),
    });

    return json({ success: true, scan: updated });
  } catch (error) {
    console.error("[runWebsiteIntelligenceScan] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});