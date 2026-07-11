import {
  INDUSTRIES,
  buildIndustryDataQualityFlags,
  classifyLeadIndustry as classifyBaseIndustry,
  serializeIndustryClassification,
} from "./industryClassifier.ts";

export { INDUSTRIES, buildIndustryDataQualityFlags, serializeIndustryClassification };

export const INDUSTRY_CLASSIFIER_VERSION = "2026-07-11.v3";

const EXPLICIT_NAME_RULES = [
  {
    key: "dental",
    patterns: [
      "dental", "dentist", "dentistry", "orthodont", "endodont", "periodont",
      "prosthodont", "oral surgery", "maxillofacial", "dentures", "tooth doctor",
      "braces", " dds", " dmd",
    ],
  },
  {
    key: "physical_therapy",
    patterns: [
      "physical therapy", "physical therapist", "physiotherapy", "occupational therapy",
      "sports rehabilitation", "rehabilitation clinic", "rehab clinic",
    ],
  },
  {
    key: "chiropractic",
    patterns: ["chiropractic", "chiropractor", "chiropractic clinic", "spinal adjustment"],
  },
  {
    key: "med_spa",
    patterns: [
      "med spa", "medspa", "medical spa", "aesthetic medicine", "aesthetics clinic",
      "injectables", "botox", "dermal filler", "cosmetic surgery", "plastic surgeon",
      "laser hair removal", "skin bar", "skin clinic", "body contouring",
    ],
  },
  {
    key: "beauty",
    patterns: [
      "nail salon", "nails salon", "nail spa", "nails spa", "nails and spa",
      "nail studio", "nail bar", "nail lounge", "nails and lashes", "barber shop",
      "barbershop", "hair salon", "beauty salon", "beauty bar", "lash studio",
      "eyelash", "eyebrow threading", "brow studio", "tanning salon", "spray tanning",
      "massage therapy", "massage studio", "day spa", "permanent makeup",
    ],
  },
  {
    key: "hvac",
    patterns: ["hvac", "heating and air", "air conditioning", "ac repair", "furnace repair", "heat pump"],
  },
  {
    key: "plumbing",
    patterns: ["plumbing", "plumber", "drain cleaning", "sewer service", "water heater repair", "hydro jetting"],
  },
  {
    key: "electrical",
    patterns: ["electrician", "electrical contractor", "electrical services", "panel upgrade", "electrical repair"],
  },
  {
    key: "roofing_restoration",
    patterns: ["roofing", "roof repair", "roof replacement", "storm restoration", "water damage restoration", "fire damage restoration"],
  },
];

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

function explicitNameMatches(businessName) {
  const text = ` ${normalize(businessName)} `;
  const matches = [];
  for (const rule of EXPLICIT_NAME_RULES) {
    const phrases = rule.patterns.filter((pattern) => text.includes(normalize(pattern)));
    if (phrases.length > 0) matches.push({ key: rule.key, phrases });
  }
  return matches;
}

function explicitResult(key, reason, base, status = "classified") {
  const config = INDUSTRIES[key];
  const confidence = status === "classified" ? 99 : Math.min(base?.confidence || 60, 67);
  return {
    ...base,
    status,
    industry_key: key,
    industry_label: config?.label || base?.industry_label || "Needs Manual Review",
    confidence,
    conflict: status !== "classified",
    reason,
    classifier_version: INDUSTRY_CLASSIFIER_VERSION,
    routing: status === "classified"
      ? { agent_name: config.agent_name, rep_name: config.rep_name }
      : { agent_name: "sales_rep_general", rep_name: "Nolan" },
  };
}

export function classifyLeadIndustry(lead) {
  const base = classifyBaseIndustry(lead);
  if (base.status === "excluded_test") {
    return { ...base, classifier_version: INDUSTRY_CLASSIFIER_VERSION };
  }

  const matches = explicitNameMatches(lead?.business_name);
  if (matches.length === 0) {
    return { ...base, classifier_version: INDUSTRY_CLASSIFIER_VERSION };
  }

  const distinctKeys = [...new Set(matches.map((match) => match.key))];

  // Dental and licensed rehabilitation identities are unambiguous even when a
  // generic word such as "aesthetic" or "wellness" also appears in the name.
  const precedenceKey = ["dental", "physical_therapy", "chiropractic"]
    .find((key) => distinctKeys.includes(key));
  const selectedKey = precedenceKey || (distinctKeys.length === 1 ? distinctKeys[0] : null);

  if (!selectedKey) {
    return explicitResult(
      base.industry_key,
      `Conflicting explicit business-name identities: ${distinctKeys.join(", ")}`,
      base,
      "review_required",
    );
  }

  const contradictoryWebsiteEvidence = Array.isArray(base.evidence)
    ? base.evidence.some((item) =>
      item?.source === "website" &&
      item?.key !== selectedKey &&
      Number(item?.points || 0) >= 8
    )
    : false;

  if (contradictoryWebsiteEvidence) {
    return explicitResult(
      selectedKey,
      `Explicit business name indicates ${selectedKey}, but website evidence indicates another industry`,
      base,
      "review_required",
    );
  }

  const matchedPhrases = matches
    .filter((match) => match.key === selectedKey)
    .flatMap((match) => match.phrases);

  return explicitResult(
    selectedKey,
    `Explicit business-name identity: ${matchedPhrases.join(", ")}`,
    base,
  );
}
