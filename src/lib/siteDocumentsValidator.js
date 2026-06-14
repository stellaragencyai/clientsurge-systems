// Task #49: Validate canonical document URLs
export async function validateDocumentURL(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.status === 200;
  } catch {
    return false;
  }
}

export const CANONICAL_DOCUMENTS = {
  privacy: { url: "https://clientsurge.com/privacy-policy", path: "/privacy-policy" },
  terms: { url: "https://clientsurge.com/terms", path: "/terms" },
  pricing: { url: "https://clientsurge.com/pricing", path: "/pricing" },
  faq: { url: "https://clientsurge.com/faq", path: "/faq" },
};

export async function validateAllDocuments() {
  const results = {};
  for (const [key, doc] of Object.entries(CANONICAL_DOCUMENTS)) {
    results[key] = await validateDocumentURL(doc.url);
  }
  return results;
}