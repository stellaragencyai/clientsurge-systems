import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";

const INDUSTRY_LABELS = {
  "med-spa": "Med Spa",
  dental: "Dental",
  hvac: "HVAC",
  plumbing: "Plumbing",
  roofing: "Roofing",
  chiropractic: "Chiropractic",
  contractors: "Contractors",
  "real-estate": "Real Estate",
  "personal-injury": "Personal Injury",
  "property-services": "Property Services",
};

/**
 * Industry Context Banner — shows when a user has selected an industry
 * on the Industries page, acknowledging their selection on Pricing.
 * Fixes FLAW #23.
 */
export default function IndustryContextBanner() {
  const [industry, setIndustry] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const slug = window.sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
    if (slug && INDUSTRY_LABELS[slug]) {
      setIndustry(slug);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.id && INDUSTRY_LABELS[e.detail.id]) {
        setIndustry(e.detail.id);
        setDismissed(false);
      }
    };
    window.addEventListener("clientsurge:industry-selected", handler);
    return () => window.removeEventListener("clientsurge:industry-selected", handler);
  }, []);

  if (!industry || dismissed) return null;

  const label = INDUSTRY_LABELS[industry];

  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <div
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
        style={{
          background: "rgba(0,174,239,0.08)",
          border: "1px solid rgba(0,174,239,0.25)",
          color: "#0079c1",
        }}
      >
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>Based on your <strong>{label}</strong> selection</span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-[#00AEEF]/10 transition-colors"
          style={{ minHeight: "unset", minWidth: "unset" }}
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}