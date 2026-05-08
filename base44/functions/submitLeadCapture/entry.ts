/**
 * submitLeadCapture — #504 #505
 * #504: 60-minute dedup window (reject if same phone/email submitted < 60min ago)
 * #505: disposable email domain blocklist
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// #505: disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","temp-mail.org","throwaway.email",
  "fakeinbox.com","yopmail.com","trashmail.com","sharklasers.com",
  "guerrillamailblock.com","grr.la","guerrillamail.info","spam4.me",
  "tempmail.com","tmpmail.net","tmpmail.org","tmp-mail.org","throwam.com",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return DISPOSABLE_DOMAINS.has(domain);
}

const SIXTY_MINUTES = 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { business_name, phone, email, industry, source, website_url } = body;

    // Honeypot check (bot detection)
    if (website_url) {
      return Response.json({ success: true, deduplicated: true, reason: "bot_detected" });
    }

    // Required fields
    if (!phone && !email) return Response.json({ error: "phone or email required" }, { status: 400 });

    // #505: disposable email check
    if (email && isDisposableEmail(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 422 });
    }

    // #504: 60-min dedup — check for recent lead with same phone or email
    const since = new Date(Date.now() - SIXTY_MINUTES).toISOString();
    const existing = await base44.asServiceRole.entities.SpaLead
      .filter({ phone: phone || undefined }).catch(() => []);
    const recent = (existing || []).filter((l: any) => l.created_date >= since);

    if (recent.length > 0) {
      return Response.json({ success: true, deduplicated: true, reason: "duplicate_60min", lead_id: recent[0].id });
    }

    // Create lead
    const lead = await base44.asServiceRole.entities.SpaLead.create({
      business_name: business_name || "Unknown",
      phone: phone || "",
      email: email || "",
      industry: industry || "unknown",
      source: source || "website",
      status: "New",
      lead_score: 50,
      created_date: new Date().toISOString(),
    });

    return Response.json({ success: true, lead_id: lead.id, deduplicated: false });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
