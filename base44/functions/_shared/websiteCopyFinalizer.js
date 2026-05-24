export function parseMaybeJson(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function sectionKey(section) {
  return String(section?.type || section?.name || section?.id || "").toLowerCase().replace(/\s+/g, "_");
}

export function inferAffectedWebsiteSections(pages = [], revisionNotes = "") {
  const notes = String(revisionNotes || "").toLowerCase();
  const sections = [];
  for (const page of pages) {
    for (const section of page.sections || []) {
      const key = sectionKey(section);
      const label = String(section.name || section.heading || key).toLowerCase();
      if (key && (notes.includes(key.replace(/_/g, " ")) || notes.includes(key) || notes.includes(label))) {
        sections.push(key);
      }
    }
  }

  const keywordMap = {
    hero: ["hero", "headline", "above the fold"],
    services: ["service", "offer"],
    services_grid: ["service", "offer"],
    cta: ["cta", "call to action", "button"],
    lead_capture_form: ["form", "lead capture"],
    testimonials: ["testimonial", "review"],
    social_proof: ["proof", "review", "testimonial"],
    faq: ["faq", "question"],
  };

  for (const [key, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => notes.includes(keyword))) {
      sections.push(key);
    }
  }

  return [...new Set(sections)];
}

export function mergeFinalizedWebsiteSections(pages = [], finalizedSections = []) {
  const byKey = new Map();
  for (const section of finalizedSections) {
    const key = sectionKey(section) || String(section.section_key || "").toLowerCase();
    if (key) byKey.set(key, section);
  }

  return pages.map((page) => ({
    ...page,
    sections: (page.sections || []).map((section) => {
      const key = sectionKey(section);
      const update = byKey.get(key);
      if (!update) return section;
      return {
        ...section,
        copy_blocks: update.copy_blocks || update.copy || section.copy_blocks,
        cta: update.cta || section.cta,
        finalized_at: new Date().toISOString(),
      };
    }),
  }));
}

export function buildWebsiteCopyFinalizerPrompt({ spec, affectedSections, revisionNotes }) {
  return `Revise only these WebsiteSpec sections: ${affectedSections.join(", ")}.
Client revision notes: ${revisionNotes}
Business: ${spec?.brand?.business_name || "Client business"}
Industry: ${spec?.industry || "local service"}
Return JSON only: {"sections":[{"type":"hero","copy_blocks":{"headline":"...","subheadline":"..."},"cta":"..."}]}.`;
}
