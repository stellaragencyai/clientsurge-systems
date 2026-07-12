import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import DemoBookingInline from "@/components/forms/DemoBookingInline";

const AUDIT_CONTEXT = {
  roofing: {
    eyebrow: "Free Roofing Automation Audit",
    heading: "Find the missed calls and estimate requests costing you roofing jobs.",
    intro: "Request a preferred time and ClientSurge will review storm leads, missed calls, inspection handoff, and quote follow-up.",
    checks: ["Roofing lead capture and missed-call recovery", "Estimate request and inspection follow-up gaps"],
    label: "Roofing Automation Audit",
    interest: "roofing_automation_audit",
    industry: "Roofing & Restoration",
  },
  dental: {
    eyebrow: "Free Dental Automation Audit",
    heading: "Find the new-patient inquiries and follow-ups your front desk cannot chase.",
    intro: "Request a preferred time and ClientSurge will review patient inquiry response, missed calls, appointment handoff, and nurture.",
    checks: ["New-patient lead and missed-call review", "Front desk follow-up and booking handoff gaps"],
    label: "Dental Automation Audit",
    interest: "dental_automation_audit",
    industry: "Dental & Orthodontics",
  },
  hvac: {
    eyebrow: "Free HVAC Automation Audit",
    heading: "Find the missed and after-hours service calls costing you HVAC jobs.",
    intro: "Request a preferred time and ClientSurge will review missed-call text-back, emergency lead response, and service booking handoff.",
    checks: ["Missed-call and emergency response review", "After-hours capture and service handoff gaps"],
    label: "HVAC Automation Audit",
    interest: "hvac_automation_audit",
    industry: "HVAC",
  },
  med_spa: {
    eyebrow: "Free Med Spa Automation Audit",
    heading: "Find the treatment inquiries and booking gaps costing you consultations.",
    intro: "Request a preferred time and ClientSurge will review consultation capture, missed calls, treatment nurture, and booking handoff.",
    checks: ["Consultation and treatment inquiry review", "Lead nurture and booking handoff gaps"],
    label: "Med Spa Automation Audit",
    interest: "med_spa_automation_audit",
    industry: "Med Spas & Aesthetic Clinics",
  },
  plumbing: {
    eyebrow: "Free Plumbing Automation Audit",
    heading: "Find the missed calls and urgent service requests costing you plumbing jobs.",
    intro: "Request a preferred time and ClientSurge will review missed-call recovery, urgent intake, dispatch context, and follow-up.",
    checks: ["Missed-call and urgent-response review", "Dispatch handoff and follow-up gaps"],
    label: "Plumbing Automation Audit",
    interest: "plumbing_automation_audit",
    industry: "Plumbing & Drain Services",
  },
  default: {
    eyebrow: "Free Automation Audit",
    heading: "Find the lead-response and follow-up gaps costing you opportunities.",
    intro: "Request a preferred time and ClientSurge will review your lead capture, missed-call, follow-up, and booking handoff process.",
    checks: ["Lead capture and missed-call review", "Highest-priority automation opportunities"],
    label: "Automation Audit",
    interest: "automation_audit",
    industry: "",
  },
};

function normalizeIndustrySlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (slug.includes("roof")) return "roofing";
  if (slug.includes("hvac")) return "hvac";
  if (slug.includes("plumb")) return "plumbing";
  if (slug.includes("dental") || slug.includes("orthodont")) return "dental";
  if (slug.includes("med_spa") || slug.includes("aesthetic")) return "med_spa";
  return slug;
}

export default function DemoBookingModal({ isOpen = true, onClose, prefillIndustry = "", industrySlug = "" }) {
  const context = useMemo(() => {
    const key = normalizeIndustrySlug(industrySlug || prefillIndustry);
    return AUDIT_CONTEXT[key] || AUDIT_CONTEXT.default;
  }, [industrySlug, prefillIndustry]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const release = acquireBodyScrollLock("audit-request-modal");
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      release?.();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/75 px-4 py-6 backdrop-blur-sm md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={context.eyebrow}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[#07152c] shadow-2xl">
        <button
          type="button"
          onClick={() => onClose?.()}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close audit request"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
          <section className="border-b border-white/10 bg-gradient-to-br from-[#003B8F] via-[#005da8] to-[#00AEEF] p-7 text-white md:p-10 lg:border-b-0 lg:border-r">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">{context.eyebrow}</p>
            <h2 className="mt-4 font-titles text-3xl font-bold leading-tight md:text-4xl">{context.heading}</h2>
            <p className="mt-5 text-sm leading-relaxed text-blue-50 md:text-base">{context.intro}</p>

            <div className="mt-7 space-y-3">
              {context.checks.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-semibold">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-white/15 bg-slate-950/20 p-4 text-sm leading-relaxed text-blue-50">
              You are requesting a preferred time, not receiving an instant calendar confirmation. ClientSurge confirms the appointment by email within one business day.
            </div>
          </section>

          <section className="bg-white p-5 md:p-8">
            <DemoBookingInline
              theme="light"
              mode="audit"
              prefillIndustry={prefillIndustry || context.industry}
              serviceInterest={context.interest}
              serviceLabel={context.label}
            />
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
