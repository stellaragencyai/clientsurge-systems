/**
 * PortalSupportPill — Enhancement #12
 * Sticky bottom-right "Need help?" pill that navigates to Support.
 * Raises above mobile bottom navigation to avoid collision.
 */
import { LifeBuoy } from "lucide-react";

export default function PortalSupportPill({ onNavigate }) {
  return (
    <button
      onClick={onNavigate}
      className="fixed right-4 z-20 lg:bottom-6 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
      style={{
        background: "linear-gradient(90deg,#0079c1,#005691)",
        boxShadow: "0 4px 20px rgba(0,121,193,0.4)",
        bottom: "calc(var(--cs-floating-bottom, 92px) + 4px)",
      }}
      aria-label="Get help — go to Support"
    >
      <LifeBuoy className="w-4 h-4" />
      <span className="hidden sm:inline">Need help?</span>
      <span className="sm:hidden">Help</span>
    </button>
  );
}