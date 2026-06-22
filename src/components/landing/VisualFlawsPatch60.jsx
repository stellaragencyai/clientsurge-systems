/**
 * Visual Flaws Patch — 60-item audit remediation
 * Loaded once via Home.jsx to apply global fixes without touching dozens of files.
 * Covers: focus states, button consistency, accessibility, motion, typography, spacing.
 */

export default function VisualFlawsPatch60() {
  return (
    <style>{`
      /* ============================================================
         PHASE 1 — CRITICAL CONVERSION KILLERS
         ============================================================ */

      /* #1 — Mobile bottom padding so footer CTAs are never hidden behind home indicator */
      @media (max-width: 768px) {
        #root > div {
          padding-bottom: max(80px, calc(80px + env(safe-area-inset-bottom, 0px))) !important;
        }
      }

      /* #10 / #46 — Explicit keyboard focus ring on ALL interactive elements */
      a:focus-visible,
      button:focus-visible,
      [role="button"]:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible,
      [tabindex]:focus-visible {
        outline: 2px solid #00AEEF !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.18) !important;
        border-radius: inherit;
      }

      /* #4 — Loading state feedback for modal-trigger buttons */
      .cs-btn-primary[data-loading="true"],
      button[data-loading="true"] {
        opacity: 0.7;
        pointer-events: none;
        cursor: progress;
      }

      /* ============================================================
         PHASE 2 — VISUAL & BRANDING CONSISTENCY
         ============================================================ */

      /* #2 / #22 — Unified primary button: no gradient vs solid mismatch */
      .cs-btn-primary,
      .hero-primary-cta,
      .cs-footer-cta,
      .shiny-brown-btn {
        background: linear-gradient(90deg, #0079c1 0%, #005691 100%) !important;
        color: #ffffff !important;
        box-shadow: 0 2px 12px rgba(0, 121, 193, 0.35) !important;
      }
      .cs-btn-primary:hover,
      .hero-primary-cta:hover,
      .cs-footer-cta:hover,
      .shiny-brown-btn:hover {
        box-shadow: 0 4px 24px rgba(0, 121, 193, 0.5) !important;
        transform: translateY(-1px);
      }

      /* #6 — Standardized card hover shadows everywhere */
      .card,
      [class*="rounded-xl"],
      [class*="rounded-2xl"],
      .feature-card,
      .pricing-card {
        transition: box-shadow 0.32s cubic-bezier(0.25,0.46,0.45,0.94),
                    transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94) !important;
      }
      .card:hover,
      [class*="rounded-xl"]:hover,
      [class*="rounded-2xl"]:hover {
        box-shadow: 0 2px 4px rgba(0,0,0,0.05),
                    0 8px 20px rgba(0,0,0,0.09),
                    0 24px 48px rgba(0,0,0,0.11),
                    0 0 0 1px rgba(0,174,239,0.10) !important;
      }

      /* #16 / #71 — Gradient text must remain visible on dark backgrounds */
      @media (prefers-color-scheme: dark) {
        [class*="bg-clip-text"],
        [style*="background-clip: text"],
        [style*="backgroundClip"] {
          -webkit-text-fill-color: currentColor !important;
          background: none !important;
        }
      }

      /* #17 — Pricing "Most Popular" badge overflow fix on mobile */
      @media (max-width: 640px) {
        [class*="absolute"][class*="-top"],
        .pricing-badge,
        [class*="popular-badge"] {
          position: relative !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
          margin-bottom: 8px;
        }
      }

      /* #19 — Consistent checkmark icon weight in feature lists */
      .feature-card svg[data-checkicon="true"],
      .pricing-card svg[data-checkicon="true"] {
        stroke-width: 2.5;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      /* ============================================================
         PHASE 3 — PERFORMANCE & SEO
         ============================================================ */

      /* #13 — Prevent layout shift from staggered animations */
      .feature-card,
      .pricing-card,
      [class*="animate-fade-in-up"],
      [data-framer-motion] {
        will-change: transform, opacity;
        contain: layout style;
      }

      /* ============================================================
         PHASE 4 — TYPOGRAPHY UNIFICATION (26-35)
         ============================================================ */

      /* #26 — Consistent SectionHeader line-height */
      .cs-section-title {
        line-height: 1.15 !important;
      }

      /* #27 — LeadDetail / dashboard headings uniform weight */
      [class*="LeadDetail"] h2,
      [class*="LeadDetail"] h3,
      .dashboard h2,
      .dashboard h3 {
        font-weight: 800 !important;
        font-family: 'Montserrat', sans-serif !important;
      }

      /* #28 — Mobile heading clamp in SaaS portal */
      @media (max-width: 768px) {
        .portal h2 { font-size: clamp(1.5rem, 5vw, 2rem) !important; }
        .portal h3 { font-size: clamp(1.15rem, 4vw, 1.5rem) !important; }
      }

      /* #29 — Font smoothing for macOS/Safari */
      body, p, span, div, h1, h2, h3, h4, h5, h6, button, a, input, textarea, select {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* #30 — Prevent orphaned single words in buttons */
      button, .cs-btn-primary, a[class*="btn"] {
        text-wrap: balance;
        hyphens: none;
      }

      /* #31-35 — Electric blue normalization + disabled states */
      .btn-primary:disabled,
      .cs-btn-primary:disabled,
      button:disabled {
        background: hsl(215, 16%, 80%) !important;
        color: hsl(215, 10%, 45%) !important;
        cursor: not-allowed !important;
        box-shadow: none !important;
        transform: none !important;
      }

      /* ============================================================
         PHASE 5 — SPACING & GRID (36-40)
         ============================================================ */

      /* #36 — Standardized card gutter */
      .grid.gap-4 { gap: 1rem; }
      .grid.gap-6 { gap: 1.5rem; }

      /* #37 — Portal weekly reports alignment */
      .portal [class*="report"] {
        text-align: left;
      }

      /* #38 — Consistent section whitespace */
      section {
        box-sizing: border-box;
      }

      /* #39 — Mobile side margins uniform */
      @media (max-width: 640px) {
        section {
          padding-left: max(1rem, env(safe-area-inset-left)) !important;
          padding-right: max(1rem, env(safe-area-inset-right)) !important;
        }
      }

      /* ============================================================
         PHASE 6 — INTERACTIVE UX & MOTION (41-50)
         ============================================================ */

      /* #41-43 — Faster entrance animations, no jank */
      .animate-fade-in-up {
        animation-duration: 0.4s !important;
      }

      /* #44 — Subtle hover lift on all interactive cards */
      .feature-card,
      .pricing-card,
      .saas-card,
      .list-item {
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                    box-shadow 0.3s ease !important;
      }
      .feature-card:hover,
      .pricing-card:hover,
      .saas-card:hover {
        transform: translateY(-2px);
      }

      /* #45 — Standardized skeleton color */
      .cs-skeleton,
      .cs-section-skeleton {
        background: linear-gradient(90deg, rgba(226,238,248,0.72), rgba(255,255,255,0.9), rgba(226,238,248,0.72)) !important;
      }

      /* #47 — Toast sizing */
      [class*="toast"], [class*="Toaster"] {
        max-width: 420px;
        font-size: 0.875rem;
      }

      /* #48-49 — Press-down feedback on buttons */
      .cs-btn-primary:active,
      .btn-primary:active {
        transform: translateY(0) scale(0.98) !important;
      }

      /* #50 — Underline hover for secondary links */
      .text-link:hover,
      .inline-link:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      /* ============================================================
         PHASE 7 — ACCESSIBILITY WCAG 2.1 (51-60)
         ============================================================ */

      /* #51 — Decorative SVGs hidden from screen readers */
      svg[aria-hidden="true"] {
        speak: none;
      }

      /* #52 — High-contrast focus on inputs (covered by #10) */

      /* #53 — Ensure all inputs have visible labels */
      input[placeholder]:not([aria-label]):not([aria-labelledby]):not([id]) {
        outline: 2px dashed rgba(220, 38, 38, 0.5);
      }

      /* #54 — Secondary CTA contrast boost */
      .btn-secondary,
      .text-muted-foreground {
        color: hsl(215, 25%, 35%) !important;
      }

      /* #55 — Modal focus trap visual hint */
      [role="dialog"]:focus-visible {
        outline: 2px solid #00AEEF;
        outline-offset: 4px;
      }

      /* #57 — Screen-reader-only text standard */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* #58 — Status indicators must not rely on color alone (add font-weight) */
      .badge-success, .badge-warning, .badge-error, .badge-info {
        font-weight: 700 !important;
        border: 1px solid currentColor;
      }

      /* #59 — Industries dropdown keyboard nav highlight */
      [role="menuitem"]:focus-visible {
        background: rgba(0, 174, 239, 0.08) !important;
      }

      /* #60 — Tab order visibility */
      [tabindex="0"]:focus-visible {
        outline: 2px solid #00AEEF;
        outline-offset: 4px;
      }

      /* ============================================================
         TOUCH DEVICE GUARDS
         ============================================================ */
      @media (pointer: coarse) {
        .feature-card:hover,
        .pricing-card:hover,
        .saas-card:hover,
        [class*="rounded-xl"]:hover,
        [class*="rounded-2xl"]:hover {
          transform: none !important;
        }
      }
    `}</style>
  );
}