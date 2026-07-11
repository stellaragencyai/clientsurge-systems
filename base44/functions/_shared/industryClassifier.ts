/**
 * Canonical deterministic lead-industry classifier.
 *
 * Business identity evidence (name, domain and enrichment notes) is weighted
 * above broad legacy import labels. Ambiguous or contradictory records are
 * flagged for review rather than silently forced into a false category.
 */

export const INDUSTRY_CLASSIFIER_VERSION = "2026-07-11.v2";

export const INDUSTRIES = {
  dental: { label: "Dental & Orthodontics", agent_name: "sales_rep_dental", rep_name: "Marcus" },
  med_spa: { label: "Med Spa & Aesthetics", agent_name: "sales_rep_med_spa", rep_name: "Sarah" },
  beauty: { label: "Beauty & Personal Care", agent_name: "sales_rep_general", rep_name: "Nolan" },
  chiropractic: { label: "Chiropractic", agent_name: "sales_rep_chiropractic", rep_name: "Jordan" },
  physical_therapy: { label: "Physical Therapy & Rehabilitation", agent_name: "sales_rep_chiropractic", rep_name: "Jordan" },
  rehabilitation_general: { label: "Chiropractic & Rehabilitation", agent_name: "sales_rep_chiropractic", rep_name: "Jordan" },
  fitness_wellness: { label: "Fitness & Wellness", agent_name: "sales_rep_general", rep_name: "Nolan" },
  hvac: { label: "HVAC", agent_name: "sales_rep_hvac", rep_name: "Tyler" },
  plumbing: { label: "Plumbing", agent_name: "sales_rep_hvac", rep_name: "Tyler" },
  electrical: { label: "Electrical", agent_name: "sales_rep_hvac", rep_name: "Tyler" },
  roofing_restoration: { label: "Roofing & Restoration", agent_name: "sales_rep_roofing", rep_name: "Derek" },
  contractors_trades: { label: "Contractors & Trades", agent_name: "sales_rep_contractors", rep_name: "Alex" },
  landscaping_outdoor: { label: "Landscaping & Outdoor Services", agent_name: "sales_rep_contractors", rep_name: "Alex" },
  cleaning: { label: "Cleaning Services", agent_name: "sales_rep_general", rep_name: "Nolan" },
  pest_control: { label: "Pest Control", agent_name: "sales_rep_hvac", rep_name: "Tyler" },
  automotive: { label: "Automotive Services", agent_name: "sales_rep_general", rep_name: "Nolan" },
  legal: { label: "Legal Services", agent_name: "sales_rep_general", rep_name: "Nolan" },
  accounting_finance: { label: "Accounting & Financial Services", agent_name: "sales_rep_general", rep_name: "Nolan" },
  real_estate: { label: "Real Estate", agent_name: "sales_rep_general", rep_name: "Nolan" },
  property_management: { label: "Property Management", agent_name: "sales_rep_general", rep_name: "Nolan" },
  insurance: { label: "Insurance", agent_name: "sales_rep_general", rep_name: "Nolan" },
  food_hospitality: { label: "Restaurants & Food Service", agent_name: "sales_rep_general", rep_name: "Nolan" },
  retail_ecommerce: { label: "Retail & E-commerce", agent_name: "sales_rep_general", rep_name: "Nolan" },
  education_training: { label: "Education & Training", agent_name: "sales_rep_general", rep_name: "Nolan" },
  healthcare_medical: { label: "Healthcare & Medical", agent_name: "sales_rep_general", rep_name: "Nolan" },
  veterinary_pet: { label: "Veterinary & Pet Services", agent_name: "sales_rep_general", rep_name: "Nolan" },
  home_care: { label: "Home Care & Senior Services", agent_name: "sales_rep_general", rep_name: "Nolan" },
  technology_marketing: { label: "Technology & Marketing", agent_name: "sales_rep_general", rep_name: "Nolan" },
  professional_services: { label: "Professional Services", agent_name: "sales_rep_general", rep_name: "Nolan" },
  home_services: { label: "Home Services", agent_name: "sales_rep_hvac", rep_name: "Tyler" },
};

const RULES = [
  {
    key: "dental",
    decisive: ["dental", "dentist", "dentistry", "orthodont", "endodont", "periodont", "prosthodont", "oral surgery", "oral and maxillofacial", "dentures", "tooth doctor", "braces", "dds", "dmd"],
    keywords: ["implant", "veneers", "teeth", "tooth", "gum care", "root canal"],
  },
  {
    key: "physical_therapy",
    decisive: ["physical therapy", "physical therapist", "physiotherapy", "occupational therapy", "sports rehabilitation", "rehabilitation clinic", "rehab clinic"],
    keywords: ["pt clinic", "sports therapy", "movement therapy", "rehabilitation"],
  },
  {
    key: "chiropractic",
    decisive: ["chiropractic", "chiropractor", "spinal adjustment", "chiropractic clinic"],
    keywords: ["chiro", "spine adjustment", "spinal care"],
  },
  {
    key: "med_spa",
    decisive: ["med spa", "medspa", "medical spa", "aesthetic medicine", "aesthetics clinic", "injectables", "botox", "dermal filler", "cosmetic surgery", "plastic surgeon", "laser hair removal", "skin bar", "skin clinic", "body contouring"],
    keywords: ["aesthetic", "microneedling", "coolsculpting", "hydrafacial", "chemical peel", "facial rejuvenation", "anti aging"],
    excludes: ["nail salon", "nails and spa", "nail spa", "barber", "hair salon", "beauty salon", "tanning salon"],
  },
  {
    key: "beauty",
    decisive: ["nail salon", "nails and spa", "nail spa", "nail studio", "nail bar", "barber shop", "barbershop", "hair salon", "beauty salon", "beauty bar", "lash studio", "eyelash", "eyebrow threading", "brow studio", "tanning salon", "spray tanning", "massage studio", "day spa", "permanent makeup"],
    keywords: ["nails", "barber", "salon", "lashes", "lash", "brows", "brow", "tanning", "massage", "reflexology", "hair", "waxing", "makeup", "beauty supply"],
  },
  {
    key: "hvac",
    decisive: ["hvac", "heating and air", "air conditioning", "ac repair", "furnace repair", "heat pump"],
    keywords: ["heating", "cooling", "furnace", "ductless", "indoor air quality", "ventilation"],
  },
  {
    key: "plumbing",
    decisive: ["plumbing", "plumber", "drain cleaning", "sewer service", "water heater repair", "hydro jetting"],
    keywords: ["water heater", "boiler", "drain", "sewer", "repiping"],
  },
  {
    key: "electrical",
    decisive: ["electrician", "electrical contractor", "electrical services", "panel upgrade", "electrical repair"],
    keywords: ["rewiring", "generator installation", "electrical", "wiring"],
  },
  {
    key: "roofing_restoration",
    decisive: ["roofing", "roof repair", "roof replacement", "storm restoration", "water damage restoration", "fire damage restoration"],
    keywords: ["roofer", "roof", "shingles", "gutters", "siding", "restoration"],
  },
  {
    key: "landscaping_outdoor",
    decisive: ["landscaping", "landscape design", "lawn care", "tree service", "pool service", "pool cleaning", "hardscape", "irrigation"],
    keywords: ["landscape", "lawn", "tree removal", "outdoor living", "pool repair"],
  },
  {
    key: "cleaning",
    decisive: ["cleaning service", "house cleaning", "commercial cleaning", "maid service", "carpet cleaning", "pressure washing", "window cleaning"],
    keywords: ["janitorial", "cleaners", "cleaning", "maid"],
  },
  {
    key: "pest_control",
    decisive: ["pest control", "exterminator", "termite control"],
    keywords: ["pest", "termite", "rodent control", "wildlife removal"],
  },
  {
    key: "contractors_trades",
    decisive: ["general contractor", "remodeling contractor", "construction company", "painting contractor", "flooring contractor", "concrete contractor", "home builder"],
    keywords: ["contractor", "construction", "remodel", "builder", "painting", "flooring", "cabinet", "tile"],
  },
  {
    key: "fitness_wellness",
    decisive: ["gym", "fitness center", "pilates", "yoga studio", "martial arts", "jiu jitsu", "personal training", "crossfit", "athletic club"],
    keywords: ["fitness", "wellness", "yoga", "pilates", "training", "boxing"],
    excludes: ["physical therapy", "physiotherapy", "chiropractic"],
  },
  {
    key: "automotive",
    decisive: ["auto repair", "automotive repair", "collision center", "body shop", "car dealership", "tire shop", "auto detailing", "transmission repair"],
    keywords: ["automotive", "mechanic", "tires", "oil change", "car wash"],
  },
  {
    key: "legal",
    decisive: ["law firm", "attorney", "law office", "legal services"],
    keywords: ["lawyer", "legal", "litigation", "estate planning"],
  },
  {
    key: "accounting_finance",
    decisive: ["accounting firm", "bookkeeping", "tax preparation", "financial advisor", "wealth management", "mortgage broker"],
    keywords: ["accountant", "cpa", "payroll", "finance", "financial"],
  },
  {
    key: "property_management",
    decisive: ["property management", "property manager", "hoa management", "apartment management", "community management"],
    keywords: ["rental management", "managed properties", "hoa"],
  },
  {
    key: "real_estate",
    decisive: ["real estate", "realtor", "realty", "home inspector", "title company"],
    keywords: ["brokerage", "realtors", "real estate agent"],
  },
  { key: "insurance", decisive: ["insurance agency", "insurance broker"], keywords: ["insurance", "coverage", "policy"] },
  {
    key: "food_hospitality",
    decisive: ["restaurant", "cafe", "coffee shop", "bakery", "catering", "food truck", "bar and grill"],
    keywords: ["pizza", "kitchen", "bistro", "tacos", "diner", "brewery"],
  },
  {
    key: "veterinary_pet",
    decisive: ["veterinary", "animal hospital", "pet grooming", "dog daycare", "pet boarding", "dog training"],
    keywords: ["veterinarian", "pet care", "groomer", "kennel"],
  },
  {
    key: "home_care",
    decisive: ["home care", "senior care", "assisted living", "memory care", "hospice", "caregiving"],
    keywords: ["caregiver", "elder care", "in home care"],
  },
  {
    key: "healthcare_medical",
    decisive: ["medical clinic", "primary care", "urgent care", "pediatrics", "dermatology", "optometry", "ophthalmology", "mental health", "counseling center", "hearing center"],
    keywords: ["doctor", "clinic", "physician", "health center"],
    excludes: ["dental", "dentist", "physical therapy", "chiropractic", "med spa", "medspa"],
  },
  {
    key: "education_training",
    decisive: ["school", "academy", "education center", "tutoring", "training center", "driving school", "daycare", "preschool"],
    keywords: ["education", "courses", "learning", "institute", "college"],
  },
  {
    key: "technology_marketing",
    decisive: ["software company", "web design", "digital marketing", "marketing agency", "it services", "managed services", "cybersecurity", "crypto"],
    keywords: ["software", "technology", "marketing", "seo", "automation"],
  },
  {
    key: "retail_ecommerce",
    decisive: ["retail store", "online store", "e commerce", "ecommerce", "boutique", "gift shop", "furniture store"],
    keywords: ["shop", "store", "retail", "products"],
  },
  {
    key: "home_services",
    decisive: ["home services", "garage door", "appliance repair", "handyman", "locksmith", "moving company", "storage facility"],
    keywords: ["home repair", "repair service", "installation service"],
  },
  {
    key: "professional_services",
    decisive: ["consulting firm", "business consulting", "staffing agency", "recruiting firm", "architectural firm", "engineering firm"],
    keywords: ["consulting", "consultant", "professional services", "agency"],
  },
];

const LEGACY_ALIASES = new Map([
  ["dental", "dental"],
  ["dental and orthodontics", "dental"],
  ["med spa / aesthetics", "med_spa"],
  ["med spa and aesthetics", "med_spa"],
  ["beauty / personal care", "beauty"],
  ["beauty and personal care", "beauty"],
  ["chiropractic", "chiropractic"],
  ["physical therapy", "physical_therapy"],
  ["physical therapy and rehabilitation", "physical_therapy"],
  ["chiropractic / physical therapy", "rehabilitation_general"],
  ["chiropractic and physical therapy", "rehabilitation_general"],
  ["fitness / wellness", "fitness_wellness"],
  ["fitness and wellness", "fitness_wellness"],
  ["hvac", "hvac"],
  ["plumbing", "plumbing"],
  ["electrical", "electrical"],
  ["hvac / plumbing / home services", "home_services"],
  ["hvac and plumbing", "home_services"],
  ["roofing", "roofing_restoration"],
  ["roofing and restoration", "roofing_restoration"],
  ["contractors and trades", "contractors_trades"],
  ["contractor", "contractors_trades"],
  ["home and local services", "home_services"],
  ["home services", "home_services"],
  ["legal services", "legal"],
  ["real estate", "real_estate"],
  ["property management", "property_management"],
]);

const TEST_SOURCES = new Set(["crm_live_smoke_test", "twilio_missed_call_test", "smoke_test", "qa_test"]);
const GENERIC_NAMES = new Set(["", "doe", "personal", "business", "company", "test", "lead", "unknown", "hair salon", "barber shop", "contractor", "hvac"]);
const OBSERVED_SOURCES = new Set(["business_name", "website", "enrichment_notes"]);
const DECLARED_SOURCES = new Set(["industry_tags", "business_type", "business_type_alias", "current_industry_alias"]);

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9./+\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function websiteText(lead) {
  const raw = normalize(lead?.normalized_domain || lead?.canonical_website_url || lead?.website_url || lead?.website || "");
  return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[./_\-]+/g, " ").trim();
}

function matchesAny(text, phrases = []) {
  return phrases.filter((phrase) => text.includes(normalize(phrase)));
}

function canonicalAlias(value) {
  return LEGACY_ALIASES.get(normalize(value)) || null;
}

function isInternalTestLead(lead) {
  const source = normalize(lead?.source);
  const name = normalize(lead?.business_name);
  const site = websiteText(lead);
  if (TEST_SOURCES.has(source)) return true;
  if (site.includes("example com") || site.includes("clientsurge test") || site.includes("crm smoke")) return true;
  return ["clientsurge crm smoke", "clientsurge live test", "smoke test", "runtime proof", "qa test"].some((phrase) => name.includes(phrase));
}

function scoreRules(text, weight, source, scores, evidence, decisiveHits) {
  if (!text) return;
  for (const rule of RULES) {
    if (matchesAny(text, rule.excludes || []).length > 0) continue;
    const decisive = matchesAny(text, rule.decisive);
    const keywords = matchesAny(text, rule.keywords);
    if (decisive.length > 0) {
      const points = weight + Math.min(4, decisive.length - 1);
      scores[rule.key] = (scores[rule.key] || 0) + points;
      decisiveHits.push({ key: rule.key, source, matches: decisive });
      evidence.push({ key: rule.key, source, points, matches: decisive });
    }
    if (keywords.length > 0) {
      const points = Math.max(1, Math.round(weight * 0.45)) + Math.min(3, keywords.length - 1);
      scores[rule.key] = (scores[rule.key] || 0) + points;
      evidence.push({ key: rule.key, source, points, matches: keywords });
    }
  }
}

function addAliasScore(value, weight, source, scores, evidence) {
  const key = canonicalAlias(value);
  if (!key) return;
  scores[key] = (scores[key] || 0) + weight;
  evidence.push({ key, source, points: weight, matches: [normalize(value)] });
}

function totalsBySource(evidence, sourceSet) {
  const totals = {};
  for (const item of evidence) {
    if (!sourceSet.has(item.source)) continue;
    totals[item.key] = (totals[item.key] || 0) + item.points;
  }
  return Object.entries(totals)
    .map(([key, score]) => ({ key, score }))
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
}

export function buildIndustryDataQualityFlags(existingFlags, classification) {
  const flags = new Set(Array.isArray(existingFlags) ? existingFlags : []);
  flags.delete("missing_industry");
  flags.delete("industry_review_required");
  flags.delete("industry_conflict");
  if (classification.status === "review_required") {
    flags.add("industry_review_required");
    if (classification.conflict) flags.add("industry_conflict");
  }
  return [...flags];
}

export function classifyLeadIndustry(lead) {
  if (isInternalTestLead(lead)) {
    return {
      status: "excluded_test",
      industry_key: "internal_test",
      industry_label: "Internal Test / Excluded",
      confidence: 100,
      conflict: false,
      reason: "Internal smoke-test or QA record",
      evidence: [],
      classifier_version: INDUSTRY_CLASSIFIER_VERSION,
      routing: { agent_name: "sales_rep_general", rep_name: "Nolan" },
    };
  }

  const scores = {};
  const evidence = [];
  const decisiveHits = [];
  const name = normalize(lead?.business_name);
  const domain = websiteText(lead);
  const tags = normalize(Array.isArray(lead?.industry_tags) ? lead.industry_tags.join(" ") : "");
  const notes = normalize(lead?.enrichment_notes);
  const businessType = normalize(lead?.business_type);
  const currentIndustry = normalize(lead?.industry);

  scoreRules(name, 14, "business_name", scores, evidence, decisiveHits);
  scoreRules(domain, 10, "website", scores, evidence, decisiveHits);
  scoreRules(tags, 7, "industry_tags", scores, evidence, decisiveHits);
  scoreRules(notes, 5, "enrichment_notes", scores, evidence, decisiveHits);
  scoreRules(businessType, 4, "business_type", scores, evidence, decisiveHits);
  addAliasScore(businessType, 5, "business_type_alias", scores, evidence);
  addAliasScore(currentIndustry, 2, "current_industry_alias", scores, evidence);

  const ranked = Object.entries(scores)
    .map(([key, score]) => ({ key, score }))
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));

  if (ranked.length === 0 || ranked[0].score < 5) {
    return {
      status: "review_required",
      industry_key: "unknown",
      industry_label: "Needs Manual Review",
      confidence: 0,
      conflict: false,
      reason: "No reliable industry evidence found",
      evidence,
      classifier_version: INDUSTRY_CLASSIFIER_VERSION,
      routing: { agent_name: "sales_rep_general", rep_name: "Nolan" },
    };
  }

  const top = ranked[0];
  const second = ranked[1] || { key: null, score: 0 };
  const margin = top.score - second.score;
  const topDecisive = decisiveHits.filter((hit) => hit.key === top.key);
  const competingDecisive = decisiveHits.filter((hit) => hit.key !== top.key);
  const decisiveNameHit = topDecisive.some((hit) => hit.source === "business_name");
  const genericName = GENERIC_NAMES.has(name);
  const observedRanked = totalsBySource(evidence, OBSERVED_SOURCES);
  const declaredRanked = totalsBySource(evidence, DECLARED_SOURCES);
  const observedTop = observedRanked[0] || { key: null, score: 0 };
  const declaredTop = declaredRanked[0] || { key: null, score: 0 };

  const declaredObservedConflict = Boolean(
    observedTop.key && declaredTop.key && observedTop.key !== declaredTop.key &&
    observedTop.score >= 8 && declaredTop.score >= 6 && margin < 7
  );
  const genericIdentityConflict = Boolean(
    genericName && observedTop.key && declaredTop.key && observedTop.key !== declaredTop.key && observedTop.score >= 8
  );
  const closeConflict = competingDecisive.length > 0 && margin < 4 && !decisiveNameHit;
  const conflict = declaredObservedConflict || genericIdentityConflict || closeConflict;

  let confidence = 55;
  if (decisiveNameHit && margin >= 5) confidence = 96;
  else if (top.score >= 25 && margin >= 9) confidence = 92;
  else if (top.score >= 17 && margin >= 6) confidence = 86;
  else if (top.score >= 11 && margin >= 4) confidence = 78;
  else if (top.score >= 7 && margin >= 2) confidence = 68;

  if (conflict || confidence < 68) {
    const candidate = INDUSTRIES[top.key];
    return {
      status: "review_required",
      industry_key: top.key,
      industry_label: candidate?.label || "Needs Manual Review",
      confidence: Math.min(confidence, 67),
      conflict,
      reason: conflict
        ? `Conflicting observed and declared evidence (${observedTop.key || top.key} vs ${declaredTop.key || second.key || "another category"})`
        : "Industry evidence is too weak for automatic overwrite",
      evidence,
      classifier_version: INDUSTRY_CLASSIFIER_VERSION,
      routing: { agent_name: "sales_rep_general", rep_name: "Nolan" },
    };
  }

  const config = INDUSTRIES[top.key];
  return {
    status: "classified",
    industry_key: top.key,
    industry_label: config.label,
    confidence,
    conflict: false,
    reason: `Classified from ${topDecisive.map((hit) => hit.source).join(", ") || "weighted evidence"}`,
    evidence,
    classifier_version: INDUSTRY_CLASSIFIER_VERSION,
    routing: { agent_name: config.agent_name, rep_name: config.rep_name },
  };
}

export function serializeIndustryClassification(classification) {
  return [
    "industry",
    classification.industry_key,
    classification.status,
    `confidence=${classification.confidence}`,
    `version=${classification.classifier_version}`,
    classification.reason,
  ].join(" | ");
}
