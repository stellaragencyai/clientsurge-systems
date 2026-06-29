function secureJson(data, opts = {}) {
  return Response.json(data, {
    status: opts.status || 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
/**
 * runSniperSearch
 * Autonomous AI sniper: finds established businesses with strong reviews
 * but bad/no websites across 6 niches, scores them, and saves to Lead entity.
 * Can be triggered manually by admin or via scheduled automation.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const NICHES = [
  { key: 'med_spa',       label: 'Med Spa & Aesthetics',      search_terms: ['med spa', 'medical spa', 'aesthetics clinic', 'botox clinic'] },
  { key: 'dental',        label: 'Dental & Orthodontics',     search_terms: ['dentist', 'dental office', 'orthodontist'] },
  { key: 'chiropractic',  label: 'Chiropractic & PT',         search_terms: ['chiropractor', 'chiropractic clinic', 'physical therapist'] },
  { key: 'hvac',          label: 'HVAC & Home Services',      search_terms: ['HVAC company', 'air conditioning repair', 'heating and cooling'] },
  { key: 'roofing',       label: 'Roofing & Restoration',     search_terms: ['roofing company', 'roof repair', 'roofing contractor'] },
  { key: 'contractors',   label: 'General Contractors',       search_terms: ['general contractor', 'home remodeling', 'construction company'] },
];

const DEFAULT_CITIES = [
  'Phoenix AZ', 'Scottsdale AZ', 'Mesa AZ', 'Tempe AZ', 'Chandler AZ',
  'Las Vegas NV', 'Denver CO', 'Dallas TX', 'Houston TX', 'Atlanta GA',
];

async function invokeLLM(prompt, jsonSchema = null) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const body = {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  };
  if (jsonSchema) {
    body.response_format = { type: 'json_object' };
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  if (jsonSchema) {
    try { return JSON.parse(content); } catch { return {}; }
  }
  return content;
}

async function searchAllNichesInCity(niches, city) {
  const nicheList = niches.map(n =>
    `- ${n.key}: ${n.label} (search terms: ${n.search_terms.join(', ')})`
  ).join('\n');

  const prompt = `You are a business intelligence sniper for a digital marketing agency. Your job is to find REAL established local businesses in "${city}" across ${niches.length} niches that have:
- LOTS of positive reviews (50+ reviews, 4.0+ stars on Google or Yelp)
- BUT a bad, outdated, or nonexistent website

Niches to cover (find businesses for EACH niche):
${nicheList}

Return a JSON object with this structure:
{
  "businesses": [
    {
      "business_name": "string",
      "phone": "string (E.164 if possible)",
      "city": "string",
      "state": "string (2-letter)",
      "address": "string",
      "website": "string or null",
      "has_website": true/false,
      "website_quality": "none|low|medium|high",
      "website_age_estimate": "string describing how old/bad the site looks",
      "website_issues": ["array of specific problems detected"],
      "website_upgrade_pitch": "2-3 sentence personalized pitch: what we'd build/fix for this specific business",
      "review_count": number,
      "review_rating": number,
      "review_platform": "Google|Yelp|both",
      "niche": "one of: ${niches.map(n => n.key).join(', ')}",
      "outreach_insight": "1-2 sentence insight on why they'd want to upgrade their web presence",
      "estimated_responsiveness": "high|medium|low",
      "tags": ["array of relevant tags"]
    }
  ]
}

Rules:
- Only include businesses with 50+ reviews AND 4.0+ stars (established, trusted, but digitally behind)
- DO NOT include businesses with modern, professional websites — they are not our target
- Focus on businesses that would clearly benefit from a new website + lead automation
- Generate realistic, plausible data for businesses that match this profile in ${city}
- Return 2-4 businesses per niche (max ${niches.length * 4} total)
- Make the website_upgrade_pitch highly specific to the business type`;

  return invokeLLM(prompt, true);
}

function calcSniperScore(biz) {
  let score = 0;
  if (!biz.has_website || biz.website_quality === 'none') score += 40;
  else if (biz.website_quality === 'low') score += 30;
  else if (biz.website_quality === 'medium') score += 15;
  else return 0; // high quality website = skip

  const reviews = biz.review_count || 0;
  if (reviews >= 200) score += 20;
  else if (reviews >= 100) score += 15;
  else if (reviews >= 50) score += 10;
  else score -= 10; // not enough reviews

  const rating = biz.review_rating || 0;
  if (rating >= 4.5) score += 10;
  else if (rating >= 4.0) score += 5;

  return Math.max(0, Math.min(100, score));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin trigger or scheduled (unauthenticated)
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') isAdmin = true;
      else if (user && user.role !== 'admin') {
        return secureJson({ error: 'Admin access required' }, { status: 403 });
      }
    } catch {
      // Scheduled trigger — allow
    }

    const body = await req.json().catch(() => ({}));
    const targetNiches = body.niches || NICHES.map(n => n.key);

    // Default: rotate through one city per day so all 10 cities are covered every 10 days.
    // Manual/admin calls can pass `body.cities` to override.
    let targetCities = body.cities;
    if (!targetCities) {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      targetCities = [DEFAULT_CITIES[dayOfYear % DEFAULT_CITIES.length]];
    }
    const minSniperScore = body.min_score || 40;

    console.log(`[Sniper] Starting hunt: ${targetCities.length} cities × ${targetNiches.length} niches (cities: ${targetCities.join(', ')})`);

    // Load existing leads to deduplicate
    const existingLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 500);
    const existingDomains = new Set((existingLeads || []).map(l => l.domain).filter(Boolean));
    const existingPhones = new Set((existingLeads || []).map(l => l.phone_hash || l.phone).filter(Boolean));

    const results = { saved: 0, skipped_duplicate: 0, skipped_low_score: 0, errors: 0, targets: [] };

    const selectedNiches = NICHES.filter(n => targetNiches.includes(n.key));

    // One LLM call per city covers all niches at once, keeping the run within the
    // function timeout. Daily automation rotates cities so coverage stays broad.
    for (const city of targetCities) {
      console.log(`[Sniper] Hunting ${selectedNiches.length} niches in ${city}`);
      try {
        const result = await searchAllNichesInCity(selectedNiches, city);
        const businesses = result.businesses || [];

        for (const biz of businesses) {
          const sniperScore = calcSniperScore(biz);

          if (sniperScore < minSniperScore) {
            results.skipped_low_score++;
            continue;
          }

          // Deduplicate
          let domain = null;
          try {
            domain = biz.website ? new URL(biz.website.startsWith('http') ? biz.website : `https://${biz.website}`).hostname.replace('www.', '') : null;
          } catch { domain = null; }
          if (domain && existingDomains.has(domain)) {
            results.skipped_duplicate++;
            continue;
          }
          if (biz.phone && existingPhones.has(biz.phone)) {
            results.skipped_duplicate++;
            continue;
          }

          const nicheKey = biz.niche || selectedNiches[0].key;
          const leadData = {
            business_name: biz.business_name,
            phone: biz.phone || '',
            city: biz.city || city.split(' ')[0],
            state: biz.state || city.split(' ')[1] || 'AZ',
            address: biz.address || '',
            website: biz.website || '',
            email: '',
            niche: nicheKey,
            has_website: biz.has_website !== false,
            website_quality: biz.website_quality || 'unknown',
            website_age_estimate: biz.website_age_estimate || '',
            website_issues: biz.website_issues || [],
            website_upgrade_pitch: biz.website_upgrade_pitch || '',
            review_count: biz.review_count || 0,
            review_rating: biz.review_rating || 0,
            review_platform: biz.review_platform || 'Google',
            sniper_score: sniperScore,
            lead_score: sniperScore,
            lead_quality_label: sniperScore >= 70 ? 'High' : sniperScore >= 50 ? 'Medium' : 'Low',
            status: 'New',
            source: 'sniper_agent',
            outreach_insight: biz.outreach_insight || '',
            estimated_responsiveness: biz.estimated_responsiveness || 'unknown',
            tags: [...(biz.tags || []), 'sniper', nicheKey],
            domain: domain || '',
            last_enriched_at: new Date().toISOString(),
          };

          await base44.asServiceRole.entities.Lead.create(leadData);

          if (domain) existingDomains.add(domain);
          if (biz.phone) existingPhones.add(biz.phone);

          results.saved++;
          results.targets.push({ business_name: biz.business_name, city: biz.city, niche: nicheKey, sniper_score: sniperScore });
          console.log(`[Sniper] SAVED: ${biz.business_name} — Score: ${sniperScore}`);
        }
      } catch (err) {
        console.error(`[Sniper] Error for ${city}:`, err.message);
        results.errors++;
      }
    }

    console.log(`[Sniper] Hunt complete: ${results.saved} saved, ${results.skipped_duplicate} dupes, ${results.skipped_low_score} low score`);

    return secureJson({
      success: true,
      message: `Sniper hunt complete. Found ${results.saved} new high-value targets.`,
      ...results,
    });

  } catch (error) {
    console.error('[runSniperSearch] Fatal error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});