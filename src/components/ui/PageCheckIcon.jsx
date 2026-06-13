/**
 * Unified check icon for pricing feature lists (#19 — inconsistent checkmarks).
 * Single source of truth for all feature-list checks across pricing cards.
 */
export default function PageCheckIcon({ className = "w-4 h-4 flex-shrink-0 mt-0.5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" />
      <path
        d="M8 12l3 3 5-5"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}