export function normalizeLeadPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export function getLeadDedupKey(lead) {
  const phoneHash = String(lead?.phone_hash || "").trim();
  if (phoneHash) {
    return `hash:${phoneHash}`;
  }

  const phone = normalizeLeadPhone(lead?.phone);
  return phone.length >= 7 ? `phone:${phone}` : null;
}

export function groupDuplicateLeads(leads) {
  const byKey = {};

  for (const lead of leads || []) {
    const key = getLeadDedupKey(lead);
    if (!key) continue;
    byKey[key] ||= [];
    byKey[key].push(lead);
  }

  return Object.fromEntries(
    Object.entries(byKey).filter(([, group]) => group.length > 1)
  );
}

export function selectLeadKeeper(group) {
  return [...group].sort((a, b) =>
    (b.lead_score || 0) - (a.lead_score || 0) ||
    new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
  )[0];
}
