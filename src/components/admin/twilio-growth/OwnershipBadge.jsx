import { getOwnership, OWNER_CATEGORIES } from "./capabilityOwnership";

/**
 * Compact ownership badge for capability rows.
 * Shows the owner category label. Admin-only — informational, does not override computed status.
 */
export default function OwnershipBadge({ capKey, size = "sm" }) {
  const { owner } = getOwnership(capKey);
  const cat = OWNER_CATEGORIES[owner] || OWNER_CATEGORIES.trust_review;
  const sizeClass = size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClass} flex-shrink-0`}
      style={{
        color: cat.color,
        background: `${cat.color}11`,
        border: `1px solid ${cat.color}30`,
      }}
      title={`Owner: ${cat.label} — ${cat.description}`}
    >
      {cat.label}
    </span>
  );
}