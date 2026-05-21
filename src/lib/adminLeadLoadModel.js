export function buildAdminLeadRows(rawLeads = [], sortConfig = { field: "lead_score", direction: "desc" }) {
  const multiplier = sortConfig.direction === "asc" ? 1 : -1;

  return [...rawLeads].sort((left, right) => {
    if (sortConfig.field === "lead_score") {
      return ((left.lead_score ?? -1) - (right.lead_score ?? -1)) * multiplier;
    }

    const leftValue = new Date(left.updated_date || left.created_date || 0).getTime();
    const rightValue = new Date(right.updated_date || right.created_date || 0).getTime();
    return (leftValue - rightValue) * multiplier;
  });
}
