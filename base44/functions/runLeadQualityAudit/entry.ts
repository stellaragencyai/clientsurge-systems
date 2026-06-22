import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'full';
    const fetchLimit = Math.min(body.limit || 1000, 1000);
    const now = new Date().toISOString();

    // ── Fetch leads (limited batch for incremental processing) ──
    let allLeads = [];
    const offset = body.offset || 0;
    const batch = await base44.asServiceRole.entities.Leads.filter({}, '-created_date', fetchLimit, offset);
    allLeads = batch || [];

    // ── Canonicalization helpers ──
    const canonicalEmail = (email) => {
      if (!email) return '';
      return email.toLowerCase().trim().replace(/\s+/g, '');
    };
    const canonicalPhone = (phone) => {
      if (!phone) return '';
      return phone.replace(/\D/g, '').replace(/^1/, '');
    };
    const canonicalBusinessName = (name) => {
      if (!name) return '';
      return name.toLowerCase().trim()
        .replace(/\b(llc|inc|corp|co|ltd)\b\.?/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ').trim();
    };
    const extractDomain = (url) => {
      if (!url) return '';
      return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
    };
    const canonicalWebsiteUrl = (website, websiteUrl) => {
      const raw = website || websiteUrl || '';
      if (!raw) return '';
      const domain = extractDomain(raw);
      if (!domain) return '';
      return domain.startsWith('http') ? domain : `https://${domain}`;
    };
    const canonicalCity = (city) => (city || '').toLowerCase().trim();
    const canonicalState = (state) => (state || '').toLowerCase().trim();

    // ── Internal/Test candidate detection ──
    const INTERNAL_TEST_KEYWORDS_BUSINESS = ['test', 'smoke', 'runtime', 'proof', 'qa', 'clientsurge sarah test', 'clientsurge live test', 'crm smoke'];
    const INTERNAL_TEST_KEYWORDS_NAME = ['test', 'smoke', 'runtime', 'proof', 'qa', 'clientsurge live launch', 'leadflow ai assistant', 'leadflow rescue'];
    const INTERNAL_TEST_SOURCES = ['crm_live_smoke_test', 'twilio_missed_call_test'];
    const INTERNAL_TEST_EMAIL_DOMAINS = ['clientsurge.test', 'example.com'];
    const INTERNAL_TEST_WEBSITE_KEYWORDS = ['example.com', 'crm-smoke', 'testhvac', 'testsmsjohn', '.test'];
    const GENERIC_INQUIRY_NAMES = ['general inquiry inquiry', 'other inquiry', 'hvac inquiry', 'roofing inquiry', 'med spas & aesthetic clinics inquiry'];

    // ── Raw import / non-target business detection ──
    const RAW_IMPORT_SOURCE = 'lead_dashboard_5378_2026_05_29';
    const GENERIC_BUSINESS_NAMES = ['garden center', 'storage', 'self storage', 'gym', 'nail salon', 'general store', 'contractor', 'nursery road', 'recreational storage'];
    const CHAIN_FRANCHISE_NAMES = ['walmart garden center', 'home depot garden center', 'public storage', 'extra space storage', 'u-haul', 'cubesmart', "lowe's garden center", 'anytime fitness'];

    const detectInternalTest = (lead) => {
      const codes = [];
      const reasons = [];
      const bn = (lead.business_name || '').toLowerCase().trim();
      const fn = (lead.full_name || '').toLowerCase().trim();
      const email = (lead.email || '').toLowerCase();
      const website = ((lead.website || '') + ' ' + (lead.website_url || '')).toLowerCase();
      const phone = lead.phone || '';
      const source = (lead.source || '').toLowerCase();

      if (INTERNAL_TEST_KEYWORDS_BUSINESS.some(k => bn.includes(k))) {
        codes.push('internal_test_business_name');
        reasons.push(`Business name matches internal/test pattern: "${bn}"`);
      }
      if (INTERNAL_TEST_KEYWORDS_NAME.some(k => fn.includes(k))) {
        codes.push('internal_test_full_name');
        reasons.push(`Full name matches internal/test pattern: "${fn}"`);
      }
      if (INTERNAL_TEST_SOURCES.includes(source)) {
        codes.push('internal_test_source');
        reasons.push(`Source is internal test: "${source}"`);
      }
      if (INTERNAL_TEST_EMAIL_DOMAINS.some(d => email.includes(d))) {
        codes.push('example_email');
        reasons.push(`Email uses test/example domain: "${email}"`);
      }
      if (INTERNAL_TEST_WEBSITE_KEYWORDS.some(k => website.includes(k))) {
        codes.push('test_website');
        reasons.push(`Website contains test/example keyword: "${website.trim()}"`);
      }
      // 555 test phone pattern
      if (phone.replace(/\D/g, '').match(/5550\d{3,}/)) {
        codes.push('test_phone_555');
        reasons.push(`Phone matches 555 test pattern: "${phone}"`);
      }
      if (GENERIC_INQUIRY_NAMES.includes(bn)) {
        codes.push('generic_inquiry_name');
        reasons.push(`Business name is a generic inquiry: "${bn}"`);
      }

      if (codes.length > 0) {
        return { codes, reason: reasons.join('; '), confidence: 100 };
      }
      return null;
    };

    const detectRawImport = (lead) => {
      const codes = [];
      const reasons = [];
      const bn = (lead.business_name || '').toLowerCase().trim();
      const email = lead.email || '';
      const phone = lead.phone || '';
      const website = lead.website || '';
      const websiteUrl = lead.website_url || '';
      const source = (lead.source || '').toLowerCase();
      const city = lead.city || '';
      const state = lead.state || '';
      const businessType = (lead.business_type || '').toLowerCase();

      // Raw import with no contact data — requires ALL conditions
      if (source === RAW_IMPORT_SOURCE && !email && !phone && !website && !websiteUrl) {
        codes.push('raw_import_no_contact');
        reasons.push('Raw import with no email, phone, or website');
      }
      // Generic business name — must be an EXACT match, not substring
      if (GENERIC_BUSINESS_NAMES.some(g => bn === g)) {
        codes.push('generic_business_name');
        reasons.push(`Generic business name: "${bn}"`);
      }
      // Chain/franchise — exact match only
      if (CHAIN_FRANCHISE_NAMES.some(c => bn === c)) {
        codes.push('chain_franchise');
        reasons.push(`Chain/franchise or non-target account: "${bn}"`);
      }
      // Missing city AND state AND no contact data — combined signal, not standalone
      if (!city && !state && !email && !phone && !website && !websiteUrl) {
        codes.push('missing_city_state_no_contact');
        reasons.push('Missing city, state, and all contact data');
      }

      if (codes.length > 0) {
        return { codes, reason: reasons.join('; '), confidence: 85 };
      }
      return null;
    };

    // ── Pass 1: Canonicalize + detect internal/test + raw import ──
    const updates = [];
    const businessNameCounts = {};

    for (const lead of allLeads) {
      const cEmail = canonicalEmail(lead.email);
      const cPhone = canonicalPhone(lead.phone);
      const cBusinessName = canonicalBusinessName(lead.business_name);
      const cWebsiteUrl = canonicalWebsiteUrl(lead.website, lead.website_url);
      const cDomain = extractDomain(cWebsiteUrl);
      const cCity = canonicalCity(lead.city);
      const cState = canonicalState(lead.state);

      // Track business name + no-contact for duplicate detection
      if (cBusinessName && !lead.email && !lead.phone && !lead.website && !lead.website_url && !lead.city && !lead.state) {
        businessNameCounts[cBusinessName] = (businessNameCounts[cBusinessName] || 0) + 1;
      }

      // Detect quality issues
      let qualityStatus = 'active';
      let qualityReason = '';
      let qualityCodes = [];
      let qualityConfidence = 0;

      const internalTest = detectInternalTest(lead);
      if (internalTest) {
        qualityStatus = 'quarantine_candidate';
        qualityReason = internalTest.reason;
        qualityCodes = internalTest.codes;
        qualityConfidence = internalTest.confidence;
      } else {
        const rawImport = detectRawImport(lead);
        if (rawImport) {
          qualityStatus = 'quarantine_candidate';
          qualityReason = rawImport.reason;
          qualityCodes = rawImport.codes;
          qualityConfidence = rawImport.confidence;
        }
      }

      // Determine enrichment status
      let enrichmentStatus = lead.enrichment_status || 'not_started';
      if (enrichmentStatus === 'not_started' && !cWebsiteUrl && qualityStatus === 'active') {
        enrichmentStatus = 'needs_lookup';
      }

      updates.push({
        id: lead.id,
        update: {
          canonical_email: cEmail,
          canonical_phone: cPhone,
          canonical_business_name: cBusinessName,
          canonical_website_url: cWebsiteUrl,
          canonical_city: cCity,
          canonical_state: cState,
          normalized_domain: cDomain || lead.normalized_domain || '',
          quality_review_status: qualityStatus,
          quality_reason: qualityReason,
          quality_reason_codes: qualityCodes,
          quality_confidence: qualityConfidence,
          audited_at: now,
          enrichment_status: enrichmentStatus,
        }
      });
    }

    // ── Pass 2: Detect duplicate business names with no contact ──
    for (const u of updates) {
      const lead = allLeads.find(l => l.id === u.id);
      const cBusinessName = u.update.canonical_business_name;
      if (cBusinessName && businessNameCounts[cBusinessName] > 1) {
        if (u.update.quality_review_status === 'active') {
          u.update.quality_review_status = 'quarantine_candidate';
          u.update.quality_reason = `Business name "${cBusinessName}" appears ${businessNameCounts[cBusinessName]} times with no contact data`;
          u.update.quality_reason_codes = [...(u.update.quality_reason_codes || []), 'duplicate_no_contact'];
          u.update.quality_confidence = 80;
        }
      }
    }

    // ── Pass 3: Deduplication grouping ──
    // Group by: google_place_id, canonical_phone, canonical_domain, canonical_business_name + city/state
    const groups = {};

    for (const u of updates) {
      const lead = allLeads.find(l => l.id === u.id);
      const up = u.update;

      // Skip quarantined leads from dedup (they're already flagged)
      if (up.quality_review_status === 'quarantine_candidate') continue;

      // Create group keys
      const groupKeys = [];
      if (up.canonical_phone && up.canonical_phone.length >= 10) {
        groupKeys.push(`phone:${up.canonical_phone}`);
      }
      if (up.canonical_website_url) {
        groupKeys.push(`domain:${extractDomain(up.canonical_website_url)}`);
      }
      if (up.canonical_business_name && (up.canonical_city || up.canonical_state)) {
        groupKeys.push(`biz:${up.canonical_business_name}|${up.canonical_city}|${up.canonical_state}`);
      }

      for (const key of groupKeys) {
        if (!groups[key]) groups[key] = [];
        groups[key].push({ id: u.id, lead, update: up });
      }
    }

    // For each group with >1 member, keep strongest, mark rest as duplicate_candidate
    for (const [key, members] of Object.entries(groups)) {
      if (members.length < 2) continue;

      // Sort by data completeness (email + phone + website = strongest)
      members.sort((a, b) => {
        const scoreA = (a.update.canonical_email ? 3 : 0) + (a.update.canonical_phone ? 3 : 0) + (a.update.canonical_website_url ? 2 : 0) + (a.update.canonical_city ? 1 : 0);
        const scoreB = (b.update.canonical_email ? 3 : 0) + (b.update.canonical_phone ? 3 : 0) + (b.update.canonical_website_url ? 2 : 0) + (b.update.canonical_city ? 1 : 0);
        return scoreB - scoreA;
      });

      // First member is the keeper
      for (let i = 1; i < members.length; i++) {
        const m = members[i];
        const u = updates.find(uu => uu.id === m.id);
        if (u.update.quality_review_status === 'active') {
          u.update.quality_review_status = 'duplicate_candidate';
          u.update.quality_reason = `Potential duplicate of lead ${members[0].id} (group: ${key})`;
          u.update.quality_reason_codes = [...(u.update.quality_reason_codes || []), 'duplicate_candidate'];
          u.update.quality_confidence = 75;
        }
      }
    }

    // ── Bulk update leads ──
    let updated = 0;
    let quarantined = 0;
    let duplicated = 0;
    let enrichmentNeeded = 0;

    // Process in batches of 500
    const updateBatches = [];
    for (let i = 0; i < updates.length; i += 500) {
      updateBatches.push(updates.slice(i, i + 500));
    }

    for (const batch of updateBatches) {
      const bulkData = batch.map(u => ({ id: u.id, ...u.update }));
      try {
        await base44.asServiceRole.entities.Leads.bulkUpdate(bulkData);
        updated += batch.length;
        quarantined += batch.filter(u => u.update.quality_review_status === 'quarantine_candidate').length;
        duplicated += batch.filter(u => u.update.quality_review_status === 'duplicate_candidate').length;
        enrichmentNeeded += batch.filter(u => u.update.enrichment_status === 'needs_lookup').length;
      } catch (err) {
        console.error('Bulk update error:', err.message);
      }
    }

    return Response.json({
      success: true,
      summary: {
        total_audited: allLeads.length,
        offset_processed: offset,
        has_more: allLeads.length === fetchLimit,
        updated,
        quarantine_candidates: quarantined,
        duplicate_candidates: duplicated,
        enrichment_needed: enrichmentNeeded,
        active: allLeads.length - quarantined - duplicated,
        audited_at: now,
      }
    });
  } catch (error) {
    console.error('Lead Quality Audit Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});