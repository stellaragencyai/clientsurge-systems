import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackCTA } from "@/lib/analytics";

const TARGET_PATHS = new Set(["/", "/med-spa", "/industries", "/contact", "/book"]);
const STORAGE_KEY = "clientsurge-exit-intent-dismissed";
const SESSION_KEY = "clientsurge-exit-intent-session";

export default function ExitIntentPopup({ pathname }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    business_type: "Med Spas & Aesthetic Clinics",
  });

  const isActivePath = useMemo(() => TARGET_PATHS.has(pathname), [pathname]);

  useEffect(() => {
    if (!isActivePath) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SESSION_KEY) === "true") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "dismissed") return;

    let timeoutId = window.setTimeout(() => {
      if (window.innerWidth < 768 && window.scrollY > 600) {
        setOpen(true);
        window.sessionStorage.setItem(SESSION_KEY, "true");
      }
    }, 18000);

    const handleMouseLeave = (event) => {
      if (window.innerWidth < 768) return;
      if (event.clientY > 12) return;
      setOpen(true);
      window.sessionStorage.setItem(SESSION_KEY, "true");
      trackCTA("exit_intent_opened", pathname || "unknown");
    };

    const handleScroll = () => {
      if (window.innerWidth >= 768) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable < 0.55) return;
      setOpen(true);
      window.sessionStorage.setItem(SESSION_KEY, "true");
      trackCTA("exit_intent_opened", pathname || "unknown");
    };

    document.addEventListener("mouseout", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isActivePath, pathname]);

  const handleClose = (persist = false) => {
    setOpen(false);
    setError("");
    if (persist && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await base44.functions.invoke("submitContactInquiry", {
        full_name: form.full_name,
        email: form.email,
        phone: "",
        business_type: form.business_type,
        message: `Exit-intent lead capture from ${pathname}. Requested a free lead leak audit.`,
        website_url: "",
      });

      if (!result.data?.success) {
        throw new Error(result.data?.error || "Exit-intent capture failed");
      }

      setSubmitted(true);
      trackCTA("exit_intent_submitted", pathname || "unknown");
      window.setTimeout(() => handleClose(true), 1800);
    } catch (submitError) {
      setError("We couldn't save your request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !isActivePath) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => handleClose(true)} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/40 bg-white/88 shadow-[0_30px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => handleClose(true)}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/80 text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Close popup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-7 pb-5 pt-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Before You Go</p>
          <h3 className="font-display text-3xl font-semibold text-foreground">Want a free lead leak audit instead?</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Leave your details and we&apos;ll review where your follow-up and booking flow is likely leaking revenue.
          </p>
        </div>

        {submitted ? (
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-foreground">Audit request saved</p>
            <p className="mt-2 text-sm text-muted-foreground">We&apos;ll follow up by email with next steps.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-7 pb-7">
            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/60">Full name</label>
              <input
                value={form.full_name}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                required
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/60">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="jane@business.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/60">Industry</label>
              <select
                value={form.business_type}
                onChange={(event) => setForm((prev) => ({ ...prev, business_type: event.target.value }))}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>Med Spas & Aesthetic Clinics</option>
                <option>Dental & Orthodontics</option>
                <option>Chiropractic & Physical Therapy</option>
                <option>HVAC, Plumbing & Home Services</option>
                <option>Roofing & Restoration</option>
                <option>Contractors & Trades</option>
                <option>Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Get My Free Audit
            </button>
            <p className="text-center text-xs text-muted-foreground">No spam. No pressure. Just a thoughtful follow-up.</p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
