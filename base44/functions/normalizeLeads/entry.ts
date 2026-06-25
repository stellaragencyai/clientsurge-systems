import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * normalizeLeads — Stabilize existing Leads with canonical_lead_id and normalized fields.
 * 
 * Called once or periodically to ensure all leads have:
 * - canonical_lead_id: unique identifier based on email/phone/business_name
 * - normalized_email: lowercase, trimmed
 * - normalized_phone: digits only
 * - normalized_business_name: lowercase, trimmed
 * - normalized_domain: extracted domain
 * - lead_state: default to NEW if missing
 * 
 * Non-destructive: only fills missing fields, never overwrites existing data.
 */

// FIX #4-6: SHA-256 deduplication hashing to prevent collision on partial matches
async function generateCanonicalId(email, phone, businessName) {
  const parts = [];
  if (email) parts.push(email.toLowerCase().trim());
  if (phone) parts.push(phone.replace(/\D/g, ''));
  if (businessName) parts.push(businessName.toLowerCase().trim());
  
  if (parts.length === 0) return null;
  
  const combined = parts.join('|');
  // Use SubtleCrypto for SHA-256 hash (secure + collision-resistant)
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 24);
}

function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

function normalizeBusinessName(name) {
  if (!name) return null;
  return name.toLowerCase().trim();
}

function extractDomain(email, website) {
  if (email) {
    const match = email.match(/@(.+)$/);
    if (match) return match[1].toLowerCase();
  }
  if (website) {
    const match = website.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = 50;
    const skip = parseInt(body.skip || 0);

    const leads = await base44.asServiceRole.entities.Leads.filter({}, "-created_date", batchSize, skip);

    if (!leads || leads.length === 0) {
      return Response.json({ success: true, total_processed: 0, done: true, next_skip: skip });
    }

    let updated = 0;
    let skipped = 0;

    for (const lead of leads) {
      const updates = {};

      // Generate canonical_lead_id if missing (FIX #4-6: SHA-256 hashing)
      if (!lead.canonical_lead_id) {
        const cid = await generateCanonicalId(lead.email, lead.phone, lead.business_name);
        if (cid) updates.canonical_lead_id = cid;
      }

      // Normalize email if missing
      if (!lead.normalized_email && lead.email) {
        updates.normalized_email = normalizeEmail(lead.email);
      }

      // Normalize phone if missing
      if (!lead.normalized_phone && lead.phone) {
        updates.normalized_phone = normalizePhone(lead.phone);
      }

      // Normalize business name if missing
      if (!lead.normalized_business_name && lead.business_name) {
        updates.normalized_business_name = normalizeBusinessName(lead.business_name);
      }

      // Extract domain if missing
      if (!lead.normalized_domain && (lead.email || lead.website || lead.website_url)) {
        const domain = extractDomain(lead.email, lead.website || lead.website_url);
        if (domain) updates.normalized_domain = domain;
      }

      // Ensure lead_state exists
      if (!lead.lead_state) {
        // Infer from status if possible
        let state = "NEW";
        if (lead.status === "Booked") state = "BOOKED";
        else if (lead.status === "Qualified") state = "QUALIFIED";
        else if (lead.status === "Replied") state = "ENGAGED";
        else if (lead.status === "Contacted") state = "ENGAGED";
        updates.lead_state = state;
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        try {
          await base44.asServiceRole.entities.Leads.update(lead.id, updates);
          updated++;
          await sleep(100); // Rate limit protection
        } catch (e) {
          skipped++;
          if (e.message?.includes("Rate limit")) await sleep(2000);
        }
      } else {
        skipped++;
      }
    }

    const nextSkip = skip + batchSize;
    const done = leads.length < batchSize;

    return Response.json({
      success: true,
      updated,
      skipped,
      done,
      next_skip: nextSkip,
      batch_size: batchSize,
      this_skip: skip,
    });
  } catch (error) {
    console.error("normalizeLeads error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});