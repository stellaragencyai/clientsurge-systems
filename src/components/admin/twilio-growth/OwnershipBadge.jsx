import { OWNERSHIP_CATEGORIES, getOwnership } from "./ownershipMap";

/**
 * Admin-only ownership badge + next owner action for a capability row.
 */
export default function OwnershipBadge({ capabilityKey, showAction = false }) {
  const ownership = getOwnership(capabilityKey);
  const cat = OWNERSHIP_CATEGORIES[ownership.owner] || OWNERSHIP_CATEGORIES.quality_review;

  return (
    <div className="flex flex-col gap-1">
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap w-fit"
        style={{ color: cat.color, background: `${cat.color}11`, border: `1px solid ${cat.color}30` }}
        title={`Owner: ${cat.label}`}
      >
        {cat.label}
      </span>
      {showAction && ownership.next_owner_action && (
        <p className="text-[11px] text-gray-500 leading-snug">{ownership.next_owner_action}</p>
      )}
    </div>
  );
}