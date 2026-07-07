/**
 * LoggedOutConfirmationBanner — displayed on the homepage when ?logged_out=1
 * is present in the URL. Shows a polished confirmation and cleans the query
 * param after rendering so refresh doesn't repeat the banner.
 *
 * Buttons: "Log back in" → /login, "Browse systems" → /store
 */
import { useEffect, useState } from "react";
import { CheckCircle, LogIn, Store } from "lucide-react";

export default function LoggedOutConfirmationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("logged_out") === "1") {
      setVisible(true);
      // Clean the query param so refresh doesn't repeat forever
      params.delete("logged_out");
      const remaining = params.toString();
      const newUrl = remaining
        ? `${window.location.pathname}?${remaining}${window.location.hash}`
        : `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] bg-white border-b border-gray-100 shadow-md animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">You have been logged out</p>
            <p className="text-xs text-gray-500">
              Your ClientSurge portal session ended. You are back on the main website.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
            style={{ background: "linear-gradient(90deg,#0079c1,#005691)" }}
          >
            <LogIn className="w-3.5 h-3.5" />
            Log back in
          </a>
          <a
            href="/store"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
          >
            <Store className="w-3.5 h-3.5" />
            Browse systems
          </a>
        </div>
      </div>
    </div>
  );
}