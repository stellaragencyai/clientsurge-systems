import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  flowBrown,
  flowChipBorder,
  flowInnerFrame,
  flowTextLight,
  flowIconColor,
  flowIconGlow,
  flowHeaderGlass,
} from "./coreOfferStyles";
import { systemsById, coreOfferSectionConfig } from "./coreOfferData";
import { iconMap } from "./coreOfferData";

function DetailBlock({ label, value }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div
        className="px-4 py-3"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(0,174,239,0.16)",
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          {label}
        </p>
      </div>
      <div className="px-4 py-4" style={{ background: "#ffffff" }}>
        <p className="text-sm leading-6 text-foreground/70">{value}</p>
      </div>
    </div>
  );
}

export default function SystemDetailPanel({ systemId, onBookDemo, onPrevious, onNext }) {
  const system = systemsById[systemId];
  if (!system) return null;
  const Icon = iconMap[system.icon];

  return (
    <div
      className="mt-12 md:mt-14 rounded-[24px] px-5 py-6 md:px-7 md:py-7"
      style={{
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div className="grid lg:grid-cols-[280px,1fr] gap-6 md:gap-7">
        <div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(240,249,255,0.98) 0%, rgba(224,242,254,0.92) 100%)",
              border: "1px solid rgba(0,174,239,0.25)",
              boxShadow: `0 8px 20px rgba(0,59,143,0.12), ${flowIconGlow}`,
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: flowHeaderGlass }}
            />
            <Icon className="w-5 h-5 relative z-10" style={{ color: flowIconColor }} />
          </div>

          <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {system.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-foreground/70">
            {system.detail.summary}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <DetailBlock label="What Happens First" value={system.detail.trigger} />
          <DetailBlock label="What The System Does Next" value={system.detail.action} />
          <DetailBlock label="What Your Lead Sees" value={system.detail.leadView} />
          <DetailBlock label="Why This Matters" value={system.detail.businessValue} />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-primary/12">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-4">
          What This Includes
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {system.detail.includes.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                background: flowBrown,
                border: flowChipBorder,
                boxShadow: `${flowInnerFrame}, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-white" />
              <span className="text-sm font-medium" style={{ color: flowTextLight }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground border border-primary/15 bg-white/70 hover:bg-white transition-colors"
        >
          Previous System
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground border border-primary/15 bg-white/70 hover:bg-white transition-colors"
        >
          Next System
        </button>
        <a
          href={coreOfferSectionConfig.primaryCta.href}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          {coreOfferSectionConfig.primaryCta.label}
          <ArrowRight className="w-4 h-4" />
        </a>
        <button
          type="button"
          onClick={onBookDemo}
          style={{
            borderRadius: "9999px",
            padding: "2px",
            background:
              "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)",
            boxShadow: "0 4px 18px rgba(0,174,239,0.35)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              height: "44px",
              padding: "0 24px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "0.95rem",
            }}
          >
            {coreOfferSectionConfig.secondaryCta.label}
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
