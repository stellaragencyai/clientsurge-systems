import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackCTA } from "@/lib/analytics";

const TARGET_PATHS = new Set(["/", "/med-spa", "/industries", "/contact", "/book"]);
const STORAGE_KEY = "clientsurge-exit-intent-dismissed";
const SESSION_KEY = "clientsurge-exit-intent-session";
const MANUAL_HASH = "#free-audit-popup";

function safeGetSessionItem(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetSessionItem(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in embedded preview environments.
  }
}

function safeGetLocalItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetLocalItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in embedded preview environments.
  }
}

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

  const openPopup = (source = "manual") => {
    setSubmitted(false);
    setError("");
    setOpen(true);
    trackCTA("exit_intent_opened", source);
  };

  useEffect(() => {
    if (!isActivePath) return;
    if (typeof window === "undefined") return;
    if (safeGetSessionItem(SESSION_KEY) === "true") return;
    if (safeGetLocalItem(STORAGE_KEY) === "dismissed") return;

    let timeoutId = window.setTimeout(() => {
      if (window.innerWidth < 768 && window.scrollY > 600) {
        openPopup(pathname || "unknown");
        safeSetSessionItem(SESSION_KEY, "true");
      }
    }, 18000);

    const handleMouseLeave = (event) => {
      if (window.innerWidth < 768) return;
      if (event.clientY > 12) return;
      openPopup(pathname || "unknown");
      safeSetSessionItem(SESSION_KEY, "true");
    };

    const handleScroll = () => {
      if (window.innerWidth >= 768) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable < 0.55) return;
      openPopup(pathname || "unknown");
      safeSetSessionItem(SESSION_KEY, "true");
    };

    document.addEventListener("mouseout", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isActivePath, pathname]);

  useEffect(() => {
    if (!isActivePath) return;
    if (typeof window === "undefined") return;

    const handleManualOpen = () => {
      openPopup("manual_trigger");
    };

    const handleHashOpen = () => {
      if (window.location.hash === MANUAL_HASH) {
        openPopup("manual_hash");
      }
    };

    window.addEventListener("clientsurge:open-audit-popup", handleManualOpen);
    handleHashOpen();

    window.clientsurgePreview = {
      ...(window.clientsurgePreview || {}),
      openAuditPopup: () => {
        if (window.location.hash !== MANUAL_HASH) {
          window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}${MANUAL_HASH}`);
        }
        handleManualOpen();
      },
    };

    window.addEventListener("hashchange", handleHashOpen);

    return () => {
      window.removeEventListener("clientsurge:open-audit-popup", handleManualOpen);
      window.removeEventListener("hashchange", handleHashOpen);
      if (window.clientsurgePreview?.openAuditPopup) {
        const nextHelpers = { ...(window.clientsurgePreview || {}) };
        delete nextHelpers.openAuditPopup;
        window.clientsurgePreview = nextHelpers;
      }
    };
  }, [isActivePath]);

  const handleClose = (persist = false) => {
    setOpen(false);
    setError("");
    if (typeof window !== "undefined" && window.location.hash === MANUAL_HASH) {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
    }
    if (persist && typeof window !== "undefined") {
      safeSetLocalItem(STORAGE_KEY, "dismissed");
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,217,168,0.28),transparent_35%),rgba(15,23,42,0.22)] backdrop-blur-[6px]" onClick={() => handleClose(true)} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,252,246,0.98),rgba(255,248,238,0.95))] shadow-[0_30px_90px_rgba(15,23,42,0.18)] ring-1 ring-black/5 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-28 rounded-full bg-primary/18 blur-3xl" />
        <button
          type="button"
          onClick={() => handleClose(true)}
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white/92 text-slate-600 shadow-sm transition-colors hover:bg-white"
          aria-label="Close popup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-7 pb-5 pt-7 md:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary shadow-sm">
            Before You Go
          </div>
          <h3 className="max-w-md font-display text-3xl font-semibold leading-tight text-slate-900 md:text-[2.25rem]">Want a free lead leak audit instead?</h3>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-slate-600">
            Leave your details and we&apos;ll review where your follow-up and booking flow is likely leaking revenue.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Lead speed", "Booking friction", "Follow-up leaks"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/70 bg-white/78 px-3 py-2 text-center text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
                {item}
              </div>
            ))}
          </div>
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
          <form onSubmit={handleSubmit} className="space-y-4 px-7 pb-7 md:px-8">
            {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Full name</label>
              <input
                value={form.full_name}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                required
                className="h-12 w-full rounded-2xl border border-amber-200/80 bg-white/92 px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                className="h-12 w-full rounded-2xl border border-amber-200/80 bg-white/92 px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="jane@business.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Industry</label>
              <select
                value={form.business_type}
                onChange={(event) => setForm((prev) => ({ ...prev, business_type: event.target.value }))}
                className="h-12 w-full rounded-2xl border border-amber-200/80 bg-white/92 px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5b34_0%,#b77b47_55%,#7a4f2e_100%)] px-5 py-3 text-sm font-semibold text-amber-50 shadow-[0_14px_34px_rgba(154,92,46,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(154,92,46,0.3)] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Get My Free Audit
            </button>
            <p className="text-center text-xs text-slate-500">No spam. No pressure. Just a thoughtful follow-up.</p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
