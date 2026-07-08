/**
 * LoggedOutConfirmationBanner — displayed on the homepage when ?logged_out=1
 * is present in the URL. Shows a modal confirmation and cleans the query
 * param after rendering so refresh doesn't repeat the message.
 */
import { useEffect, useState } from "react";
import { CheckCircle, LogIn, Store, X } from "lucide-react";

export default function LoggedOutConfirmationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("logged_out") === "1") {
      setVisible(true);

      params.delete("logged_out");
      const remaining = params.toString();
      const newUrl = remaining
        ? `${window.location.pathname}?${remaining}${window.location.hash}`
        : `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setVisible(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logged-out-modal-title"
      aria-describedby="logged-out-modal-description"
    >
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setVisible(false)} aria-hidden="true" />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl animate-fade-in">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00AEEF] via-[#0079c1] to-[#003B8F]" />
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute right-4 top-4 inline-flex h-9 w-9 min-h-0 min-w-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
          aria-label="Close logged out confirmation"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-6 pt-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.22)" }}
          >
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>

          <h2 id="logged-out-modal-title" className="font-display text-xl font-extrabold text-gray-950">
            You have been successfully logged out
          </h2>
          <p id="logged-out-modal-description" className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Your ClientSurge session has ended securely. You are now back on the main website.
          </p>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <a
              href="/client-portal"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
              style={{ background: "linear-gradient(90deg,#0079c1,#005691)", boxShadow: "0 10px 24px rgba(0,121,193,0.28)" }}
            >
              <LogIn className="h-4 w-4" />
              Log back in
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
            >
              <Store className="h-4 w-4" />
              Browse systems
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
