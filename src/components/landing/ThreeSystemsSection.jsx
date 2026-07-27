import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
  Globe,
  Server,
} from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import MoneyBackGuarantee from "./MoneyBackGuarantee";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";
import CSButton from "@/components/design-system/CSButton";
import IndustryContextBanner from "./IndustryContextBanner";

const COVERAGE_STAGES = [
  "Lead",
  "Response",
  "Follow-Up",
  "Booking",
  "Reactivation",
  "Reviews",
];

const PACKAGES = [
  {
    name: "Starter",
    title: "Starter System",
    tagline: "Response Foundation",
    bestFor: "Solo & startup teams",
    subtitle: "Best for businesses that need instant response and missed-call recovery first.",
    description: "Capture every new inquiry and missed call before leads disappear. The essential response foundation.",
    featureIntro: "Start with the two response automations that stop new leads and missed calls from going cold.",
    price: "$249",
    setupPrice: "$399",
    automationCount: 2,
    coverageCount: 2,
    websiteScope: "Connects to your existing site",
    hostingScope: "Uses your current hosting",
    qaScope: "Launch-Proof QA: lead path + response flow tested",
    automations: [
      "Instant Lead Response",
      "Missed-Call Text-Back",
    ],
    cta: "Add to Cart",
    packageId: "starter_system",
    highlight: false,
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.20)",
    accentBorderHover: "rgba(0,174,239,0.55)",
  },
  {
    name: "Growth",
    title: "Growth System",
    tagline: "Most Popular",
    bestFor: "Growing service teams",
    subtitle: "Best for steady lead flow that needs response, recovery, nurture, and booking.",
    description: "Automated follow-up and booking handoff working together — our most popular package.",
    featureIntro: "Includes the Starter automations, then adds nurture and booking handoff.",
    price: "$499",
    setupPrice: "$649",
    automationCount: 4,
    coverageCount: 4,
    websiteScope: "Connects to your existing site",
    hostingScope: "Uses your current hosting",
    qaScope: "Launch-Proof QA: lead path, response flow, booking handoff + proof logs",
    automations: [
      "Instant Lead Response",
      "Missed-Call Text-Back",
      "14-Day Nurture Sequence",
      "AI Booking Agent Handoff",
    ],
    cta: "Add to Cart",
    packageId: "growth_system",
    highlight: true,
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.58)",
    accentBorderHover: "rgba(0,174,239,0.58)",
  },
  {
    name: "Pro",
    title: "Pro System",
    tagline: "Full Revenue Layer",
    bestFor: "Multi-location & crews",
    subtitle: "Best for teams that want the full response, reactivation, review, and website layer.",
    description: "The full revenue operating layer — website, reactivation, reviews, reporting, and expanded automation. Done-for-you.",
    featureIntro: "Includes the Growth automations, then adds reactivation and review automation.",
    price: "$999",
    setupPrice: "$1,249",
    automationCount: 6,
    coverageCount: 6,
    websiteScope: "Full website build & design included",
    hostingScope: "Hosting included for your website",
    qaScope: "Launch-Proof QA + proof logs + priority setup",
    automations: [
      "Instant Lead Response",
      "Missed-Call Text-Back",
      "14-Day Nurture Sequence",
      "AI Booking Agent Handoff",
      "Lead Reactivation Engine",
      "Review Request Automation",
    ],
    cta: "Add to Cart",
    packageId: "pro_system",
    highlight: false,
    accent: "#003B8F",
    accentBorder: "rgba(0,59,143,0.18)",
    accentBorderHover: "rgba(0,174,239,0.55)",
  },
];

const DEFAULT_PACKAGE_ID = "growth_system";
const getPackageCheckoutPath = (packageId) => `/product-signup?package=${encodeURIComponent(packageId)}`;

export default function ThreeSystemsSection() {
  const sectionRef = useRef(null);
  const [activePackageId, setActivePackageId] = useState(DEFAULT_PACKAGE_ID);
  const [motionReady, setMotionReady] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const activePackage = PACKAGES.find((pkg) => pkg.packageId === activePackageId) || PACKAGES[1];

  useEffect(() => {
    setMotionReady(true);

    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setHasEntered(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasEntered(true);
        observer.disconnect();
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const resetCoverage = () => setActivePackageId(DEFAULT_PACKAGE_ID);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="nebula-pricing pt-10 md:pt-14 pb-16 md:pb-24 px-5 sm:px-6 overflow-visible"
    >
      <style>{`
        .nebula-pricing {
          background:
            radial-gradient(circle at 50% 15%, rgba(0,174,239,0.12), transparent 30%),
            linear-gradient(180deg, #f8fdff 0%, #f3fbff 54%, #ffffff 100%);
        }
        .csp-coverage-shell {
          max-width: 1040px;
          margin: 0 auto 40px;
          padding: 20px 24px 18px;
          border: 1px solid hsla(199, 100%, 47%, 0.16);
          border-radius: var(--radius);
          background: rgba(255,255,255,0.76);
          box-shadow: 0 14px 42px rgba(15,23,42,0.055), inset 0 1px 0 rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .csp-coverage-shell.is-motion-ready {
          transition: opacity 0.58s cubic-bezier(0.16, 1, 0.3, 1), transform 0.58s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .csp-coverage-shell.is-motion-ready:not(.is-visible) {
          opacity: 0;
          transform: translateY(16px);
        }
        .csp-coverage-shell.is-motion-ready.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .csp-coverage-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }
        .csp-coverage-kicker {
          color: hsl(var(--muted-foreground));
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          line-height: 1;
          text-transform: uppercase;
        }
        .csp-coverage-plan {
          color: hsl(var(--primary));
          font-size: 0.78rem;
          font-weight: 800;
          line-height: 1.2;
          transition: opacity 0.2s ease;
        }
        .csp-coverage-scroll {
          overflow-x: auto;
          scrollbar-width: none;
        }
        .csp-coverage-scroll::-webkit-scrollbar {
          display: none;
        }
        .csp-coverage-track {
          display: grid;
          min-width: 650px;
          grid-template-columns: repeat(6, minmax(96px, 1fr));
          padding-top: 2px;
        }
        .csp-coverage-stage {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: hsl(var(--muted-foreground));
          font-size: 0.69rem;
          font-weight: 700;
          line-height: 1.2;
          text-align: center;
          transition: color 0.32s ease;
        }
        .csp-coverage-node {
          position: relative;
          z-index: 2;
          width: 20px;
          height: 20px;
          border: 2px solid hsla(215, 16%, 47%, 0.24);
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 3px 10px rgba(15,23,42,0.07);
          transition: border-color 0.32s ease, box-shadow 0.32s ease, transform 0.32s ease;
        }
        .csp-coverage-node::after {
          content: "";
          position: absolute;
          inset: 4px;
          border-radius: inherit;
          background: #00AEEF;
          opacity: 0;
          transform: scale(0.25);
          transition: opacity 0.32s ease, transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .csp-coverage-segment {
          position: absolute;
          z-index: 1;
          top: 9px;
          left: calc(50% + 10px);
          width: calc(100% - 20px);
          height: 2px;
          overflow: hidden;
          background: hsla(215, 16%, 47%, 0.17);
        }
        .csp-coverage-segment::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, hsl(var(--primary)) 0%, var(--cs-electric-navy) 100%);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.44s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .csp-coverage-stage.is-active {
          color: hsl(var(--foreground));
        }
        .csp-coverage-stage.is-active .csp-coverage-node {
          border-color: rgba(0,174,239,0.72);
          box-shadow: 0 0 0 4px rgba(0,174,239,0.09), 0 5px 14px rgba(0,121,193,0.15);
          transform: translateY(-1px);
        }
        .csp-coverage-stage.is-active .csp-coverage-node::after {
          opacity: 1;
          transform: scale(1);
        }
        .csp-coverage-segment.is-active::after {
          transform: scaleX(1);
        }
        .csp-card-stage {
          position: relative;
          display: flex;
          height: 100%;
          flex-direction: column;
        }
        .csp-card-stage.is-motion-ready {
          transition:
            opacity 0.68s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.68s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--csp-delay, 0ms);
        }
        .csp-card-stage.is-motion-ready:not(.is-visible) {
          opacity: 0;
          transform: translateY(26px) scale(0.992);
        }
        .csp-card-stage.is-motion-ready.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .csp-card {
          position: relative;
          display: flex;
          min-height: 890px;
          height: 100%;
          flex-direction: column;
          overflow: hidden;
          border-radius: var(--radius);
          font-family: 'Montserrat', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.25s ease;
        }
        .csp-card-inner {
          display: flex;
          min-height: 100%;
          flex: 1;
          flex-direction: column;
          padding: 44px 40px 30px;
        }
        .csp-header {
          min-height: 120px;
        }
        .csp-title {
          margin: 0;
          color: hsl(var(--foreground));
          font-family: 'Montserrat', system-ui, sans-serif;
          font-size: clamp(1.45rem, 2vw, 1.72rem);
          font-weight: 500;
          line-height: 1.18;
          letter-spacing: -0.018em;
        }
        .csp-popular-line {
          margin-top: 10px;
          color: hsl(var(--primary));
          font-size: 0.84rem;
          font-weight: 900;
          line-height: 1.2;
        }
        .csp-subtitle {
          margin: 10px 0 0;
          max-width: 330px;
          color: hsl(var(--muted-foreground));
          font-size: 0.9rem;
          font-weight: 500;
          line-height: 1.42;
        }
        .csp-price-zone {
          margin-top: 22px;
        }
        .csp-price-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          line-height: 1;
        }
        .csp-price {
          color: hsl(var(--foreground));
          font-family: 'Montserrat', 'Inter', system-ui, sans-serif;
          font-size: clamp(2.75rem, 4.25vw, 3.35rem);
          font-weight: 700;
          line-height: 0.98;
          letter-spacing: -0.052em;
        }
        .csp-period {
          padding-bottom: 0.38rem;
          color: hsl(var(--muted-foreground));
          font-size: 0.88rem;
          font-weight: 500;
          letter-spacing: -0.015em;
        }
        .csp-setup {
          margin-top: 9px;
          color: hsl(var(--primary));
          font-size: 0.78rem;
          font-weight: 700;
          line-height: 1.3;
        }
        .csp-contract {
          margin-top: 12px;
          color: hsl(var(--muted-foreground));
          font-size: 0.78rem;
          font-weight: 500;
          line-height: 1.42;
        }
        .csp-best-for {
          display: inline-flex;
          align-items: center;
          margin-top: 10px;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          background: hsla(199, 100%, 47%, 0.08);
          border: 1px solid hsla(199, 100%, 47%, 0.22);
          color: hsl(var(--primary));
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .csp-divider {
          width: 100%;
          height: 1px;
          margin: 28px 0;
          background: rgba(0,174,239,0.14);
        }
        .csp-description {
          margin: 0;
          color: hsl(var(--muted-foreground));
          font-size: 0.95rem;
          font-weight: 500;
          line-height: 1.58;
        }
        .csp-feature-intro {
          margin-top: 18px;
          color: hsl(var(--muted-foreground));
          font-size: 0.95rem;
          font-weight: 650;
          line-height: 1.58;
        }
        .csp-feature-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin: 24px 0 0;
          padding: 0;
          list-style: none;
        }
        .csp-feature-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: hsl(var(--muted-foreground));
          font-size: 0.91rem;
          font-weight: 500;
          line-height: 1.42;
        }
        .csp-feature-row svg {
          width: 16px;
          height: 16px;
          flex: 0 0 16px;
          margin-top: 2px;
        }
        .csp-ops {
          display: flex;
          flex-direction: column;
          gap: 11px;
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid rgba(0,174,239,0.12);
        }
        .csp-ops-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: hsl(var(--muted-foreground));
          font-size: 0.755rem;
          font-weight: 500;
          line-height: 1.45;
        }
        .csp-ops-row svg {
          width: 14px;
          height: 14px;
          flex: 0 0 14px;
          margin-top: 2px;
          color: hsl(var(--primary));
        }
        .csp-cta-note {
          margin: auto 0 0;
          padding-top: 30px;
          color: hsl(var(--muted-foreground));
          font-size: 0.72rem;
          font-weight: 500;
          line-height: 1.35;
          text-align: center;
        }
        .csp-cta {
          display: inline-flex;
          position: relative;
          width: 100%;
          height: 54px;
          margin-top: 11px;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          isolation: isolate;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.25s ease, background 0.25s ease, border-color 0.25s ease;
        }
        .csp-cta svg {
          transition: transform 0.2s ease;
        }
        .csp-cta:active {
          transform: scale(0.98);
        }
        @media (max-width: 1023px) {
          .csp-coverage-shell {
            margin-bottom: 34px;
          }
          .csp-card {
            min-height: 840px;
          }
          .csp-card-inner {
            padding: 40px 30px 28px;
          }
          .csp-header {
            min-height: auto;
          }
        }
        @media (max-width: 767px) {
          .csp-coverage-shell {
            margin-bottom: 28px;
            padding: 18px 16px 16px;
            border-radius: var(--radius);
          }
          .csp-coverage-meta {
            align-items: flex-start;
            flex-direction: column;
            gap: 7px;
            margin-bottom: 14px;
          }
          .csp-coverage-track {
            min-width: 620px;
          }
          .csp-card {
            min-height: auto;
          }
          .csp-card-inner {
            padding: 38px 28px 26px;
          }
          .csp-cta-note {
            margin-top: 28px;
            padding-top: 0;
          }
        }
        @media (pointer: fine) {
          .csp-card:hover {
            border-color: rgba(0,174,239,0.72) !important;
            transform: translateY(-4px);
            box-shadow: 0 18px 46px rgba(0,174,239,0.16), 0 0 0 1px rgba(0,174,239,0.10), 0 6px 14px rgba(0,0,0,0.05) !important;
          }
          .csp-cta:hover {
            transform: translateY(-2px);
          }
          .csp-cta:hover svg {
            transform: translateX(4px);
          }
          .csp-cta[data-highlight="false"]:hover {
            border-color: rgba(0,174,239,0.55) !important;
            background: rgba(0,174,239,0.055) !important;
            box-shadow: 0 10px 24px rgba(0,174,239,0.16) !important;
          }
          .csp-cta[data-highlight="true"]:hover {
            box-shadow: 0 16px 34px rgba(0,92,170,0.34), 0 0 0 1px rgba(0,174,239,0.10) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .csp-coverage-shell,
          .csp-coverage-stage,
          .csp-coverage-node,
          .csp-coverage-node::after,
          .csp-coverage-segment::after,
          .csp-card-stage,
          .csp-card,
          .csp-cta,
          .csp-cta svg {
            transition: none !important;
          }
          .csp-coverage-shell,
          .csp-card-stage {
            opacity: 1 !important;
            transform: none !important;
          }
          .csp-card:hover,
          .csp-cta:hover,
          .csp-cta:hover svg {
            transform: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <CSSectionHeader
          eyebrow="AI Systems Storefront"
          title="Pick Your AI System — Add to Cart and Check Out"
          subtitle="Starter fixes response gaps. Growth adds follow-up and booking. Pro adds the full lead recovery layer. No demos, no sales calls — just add to cart and we handle the rest."
          align="center"
        />

        <IndustryContextBanner />

        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Nothing goes live until the lead path, response flow, booking handoff, and proof logs are tested.
          </p>
        </div>

        <div
          className={`csp-coverage-shell ${motionReady ? "is-motion-ready" : ""} ${hasEntered ? "is-visible" : ""}`}
          aria-label={`${activePackage.title} system coverage`}
        >
          <div className="csp-coverage-meta">
            <span className="csp-coverage-kicker">System coverage</span>
            <span className="csp-coverage-plan">{activePackage.title}</span>
          </div>
          <div className="csp-coverage-scroll">
            <div className="csp-coverage-track">
              {COVERAGE_STAGES.map((stage, index) => {
                const isActive = index < activePackage.coverageCount;
                const segmentIsActive = index < activePackage.coverageCount - 1;

                return (
                  <div
                    key={stage}
                    className={`csp-coverage-stage ${isActive ? "is-active" : ""}`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span className="csp-coverage-node" aria-hidden="true" />
                    <span>{stage}</span>
                    {index < COVERAGE_STAGES.length - 1 && (
                      <span
                        className={`csp-coverage-segment ${segmentIsActive ? "is-active" : ""}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative pt-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8 items-stretch">
            {PACKAGES.map((pkg, index) => {
              const isGrowth = pkg.highlight;
              const isVisible = hasEntered;

              return (
                <div
                  key={pkg.name}
                  className={`csp-card-stage ${motionReady ? "is-motion-ready" : ""} ${isVisible ? "is-visible" : ""}`}
                  style={{ ["--csp-delay"]: `${index * 110}ms` }}
                  onMouseEnter={() => setActivePackageId(pkg.packageId)}
                  onMouseLeave={resetCoverage}
                  onFocusCapture={() => setActivePackageId(pkg.packageId)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) resetCoverage();
                  }}
                  onTouchStart={() => setActivePackageId(pkg.packageId)}
                >
                  {isGrowth && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-black whitespace-nowrap"
                        style={{
                          background: "var(--cs-gradient)",
                          color: "#ffffff",
                          boxShadow: "var(--cs-glow-md)",
                          letterSpacing: "0.01em",
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Most Popular
                      </span>
                    </div>
                  )}

                  <div
                    className="csp-card"
                    data-growth={isGrowth ? "true" : "false"}
                    style={{
                      background: isGrowth
                        ? "linear-gradient(155deg, hsla(199, 100%, 47%, 0.06) 0%, hsla(199, 100%, 47%, 0.03) 46%, hsl(var(--card)) 100%)"
                        : "linear-gradient(155deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)",
                      border: isGrowth
                        ? "1.5px solid hsla(199, 100%, 47%, 0.60)"
                        : `1.5px solid ${pkg.accentBorder}`,
                      boxShadow: isGrowth
                        ? "var(--cs-glow-lg)"
                        : "var(--cs-glow-sm)",
                    }}
                  >
                    <div className="csp-card-inner">
                      <div className="csp-header">
                        <h3 className="csp-title">{pkg.title}</h3>
                        {isGrowth && <p className="csp-popular-line">Most Popular</p>}
                        <p className="csp-subtitle">{pkg.subtitle}</p>
                      </div>

                      <div className="csp-price-zone">
                        <div className="csp-price-row" aria-label={`${pkg.price} USD per month`}>
                          <span className="csp-price">{pkg.price}</span>
                          <span className="csp-period">/mo USD</span>
                        </div>
                        <p className="csp-setup">{pkg.setupPrice} one-time setup</p>
                        <p className="csp-contract">No long-term contracts. Cancel anytime.</p>
                        <span className="csp-best-for">Best for: {pkg.bestFor}</span>
                      </div>

                      <div className="csp-divider" aria-hidden="true" />

                      <p className="csp-description">{pkg.description}</p>
                      <div className="csp-feature-intro">{pkg.featureIntro}</div>

                      <ul className="csp-feature-list">
                        {pkg.automations.map((item) => (
                          <li key={item} className="csp-feature-row">
                            <CheckCircle2
                              aria-hidden="true"
                              style={{ color: "hsl(var(--primary))", strokeWidth: 2.6 }}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="csp-ops">
                        <div className="csp-ops-row">
                          <Zap aria-hidden="true" />
                          <span><strong>{pkg.automationCount} automations</strong> included in this system.</span>
                        </div>
                        <div className="csp-ops-row">
                          <Globe aria-hidden="true" />
                          <span><strong>Website:</strong> {pkg.websiteScope}</span>
                        </div>
                        <div className="csp-ops-row">
                          <Server aria-hidden="true" />
                          <span><strong>Hosting:</strong> {pkg.hostingScope}</span>
                        </div>
                        <div className="csp-ops-row">
                          <ShieldCheck aria-hidden="true" />
                          <span><strong>QA:</strong> {pkg.qaScope}</span>
                        </div>
                      </div>

                      <p className="csp-cta-note">
                        {pkg.setupPrice} setup &middot; {pkg.price}/mo &middot; cancel anytime
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          trackCTA(`package_${pkg.name.toLowerCase()}`, "three_systems_section", { package_id: pkg.packageId });
                          window.location.href = getPackageCheckoutPath(pkg.packageId);
                        }}
                        className="csp-cta"
                        style={isGrowth
                          ? {
                              background: "var(--cs-gradient)",
                              color: "#fff",
                              border: "1px solid hsla(199, 100%, 47%, 0.15)",
                              boxShadow: "var(--cs-glow-md)",
                            }
                          : {
                              background: "hsla(0, 0%, 100%, 0.72)",
                              color: "hsl(var(--primary))",
                              border: "1.5px solid hsla(199, 100%, 47%, 0.35)",
                              boxShadow: "var(--cs-glow-sm)",
                            }
                        }
                        data-highlight={isGrowth ? "true" : "false"}
                      >
                        {pkg.cta} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-10 mb-2">
          <p className="text-sm text-foreground/85 max-w-2xl mx-auto leading-relaxed">
            <strong>Not sure which system fits?</strong> Most service businesses start with Growth because it adds nurture and booking to the response foundation.
          </p>
        </div>

        <MoneyBackGuarantee />

        <div className="text-center mt-6 space-y-4">
          <CSButton
            to="/store"
            variant="primary"
            size="md"
            iconRight={ArrowRight}
            onClick={() => trackCTA("browse_automation_store", "three_systems_section")}
          >
            Browse the Automation Store
          </CSButton>
          <div>
            <Link to="/automations" onClick={() => trackCTA("view_automations", "three_systems_section")} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
              View Automation Stack
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-foreground/70 mt-6 mx-auto" style={{ maxWidth: "420px" }}>
          All packages include done-for-you setup. No long-term contracts. Cancel anytime. Secure checkout via Stripe.
        </p>
      </div>
    </section>
  );
}
