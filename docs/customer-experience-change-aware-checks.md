# Customer Experience Change-Aware Checks

Generated: 2026-04-23T23:35:45.132Z

This file is generated from current website-facing changes in git. It adds QA tasks that should be reviewed because the related customer-facing files changed.

- Current branch: `codex/sync-base44-main`
- Tracking branch: `origin/codex/sync-base44-main`
- Changed customer-facing files detected: `27`
- Generated change-aware tasks: `82`

## Changed Customer-Facing Files

- `src/components/landing/Hero.jsx`
- `src/components/landing/HeroDashboardScreen.jsx`
- `src/components/landing/Pricing.jsx`
- `src/pages/Home.jsx`
- `src/App.jsx`
- `src/components/forms/PortalLoginModal.jsx`
- `src/components/forms/SignupModal.jsx`
- `src/components/landing/AutomationPipelineSection.jsx`
- `src/components/landing/CoreOffer.jsx`
- `src/components/landing/FAQ.jsx`
- `src/components/landing/Footer.jsx`
- `src/components/landing/Industries.jsx`
- `src/components/landing/IndustryBlueprintModal.jsx`
- `src/components/landing/IntegrationPartners.jsx`
- `src/components/landing/Navbar.jsx`
- `src/components/landing/ProblemSolution.jsx`
- `src/components/landing/TrustBar.jsx`
- `src/components/portal/BuildTracker.jsx`
- `src/components/portal/PlanManager.jsx`
- `src/components/portal/SupportChat.jsx`
- `src/components/store/CartSidebar.jsx`
- `src/components/store/ProductCard.jsx`
- `src/lib/AuthContext.jsx`
- `src/pages/Book.jsx`
- `src/pages/ClientPortal.jsx`
- `src/pages/OrderSuccess.jsx`
- `src/pages/Store.jsx`

## Generated QA Tasks

### CA-001 - Page/component still loads cleanly
- File: `src/components/landing/Hero.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-002 - Copy still matches platform truth
- File: `src/components/landing/Hero.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-003 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/Hero.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-004 - Page/component still loads cleanly
- File: `src/components/landing/HeroDashboardScreen.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-005 - Copy still matches platform truth
- File: `src/components/landing/HeroDashboardScreen.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-006 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/HeroDashboardScreen.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-007 - Page/component still loads cleanly
- File: `src/components/landing/Pricing.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-008 - Copy still matches platform truth
- File: `src/components/landing/Pricing.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-009 - Pricing packages still match the store and deployment truth
- File: `src/components/landing/Pricing.jsx`
- Why: Pricing changes can drift from the canonical catalog.
- What to check:
  - Verify Starter, Growth, and Pro render correctly.
  - Verify bundle CTA opens the correct package in the store.
  - Verify pricing copy still matches the canonical install model.

### CA-010 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/Pricing.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-011 - Page/component still loads cleanly
- File: `src/pages/Home.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-012 - Copy still matches platform truth
- File: `src/pages/Home.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-013 - Marketing sections still feel polished and trustworthy
- File: `src/pages/Home.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-014 - Page/component still loads cleanly
- File: `src/App.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-015 - Copy still matches platform truth
- File: `src/App.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-016 - Route/auth protection still behaves correctly
- File: `src/App.jsx`
- Why: Core routing or auth shell changed.
- What to check:
  - Verify public routes still load when logged out.
  - Verify `/client-portal` redirects unauthenticated users correctly.
  - Verify `/admin` still blocks non-admin users.
  - Verify logout returns the user to the homepage in a logged-out state.

### CA-017 - Page/component still loads cleanly
- File: `src/components/forms/PortalLoginModal.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-018 - Copy still matches platform truth
- File: `src/components/forms/PortalLoginModal.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-019 - Lead/demo capture flow still works cleanly
- File: `src/components/forms/PortalLoginModal.jsx`
- Why: Booking/contact/forms changes affect a primary conversion path.
- What to check:
  - Open the related page or modal.
  - Verify form fields, validation, and close behavior.
  - Verify the flow still routes users into the expected booking/contact path.

### CA-020 - Page/component still loads cleanly
- File: `src/components/forms/SignupModal.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-021 - Copy still matches platform truth
- File: `src/components/forms/SignupModal.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-022 - Lead/demo capture flow still works cleanly
- File: `src/components/forms/SignupModal.jsx`
- Why: Booking/contact/forms changes affect a primary conversion path.
- What to check:
  - Open the related page or modal.
  - Verify form fields, validation, and close behavior.
  - Verify the flow still routes users into the expected booking/contact path.

### CA-023 - Page/component still loads cleanly
- File: `src/components/landing/AutomationPipelineSection.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-024 - Copy still matches platform truth
- File: `src/components/landing/AutomationPipelineSection.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-025 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/AutomationPipelineSection.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-026 - Page/component still loads cleanly
- File: `src/components/landing/CoreOffer.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-027 - Copy still matches platform truth
- File: `src/components/landing/CoreOffer.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-028 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/CoreOffer.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-029 - Page/component still loads cleanly
- File: `src/components/landing/FAQ.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-030 - Copy still matches platform truth
- File: `src/components/landing/FAQ.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-031 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/FAQ.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-032 - Page/component still loads cleanly
- File: `src/components/landing/Footer.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-033 - Copy still matches platform truth
- File: `src/components/landing/Footer.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-034 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/Footer.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-035 - Page/component still loads cleanly
- File: `src/components/landing/Industries.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-036 - Copy still matches platform truth
- File: `src/components/landing/Industries.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-037 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/Industries.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-038 - Page/component still loads cleanly
- File: `src/components/landing/IndustryBlueprintModal.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-039 - Copy still matches platform truth
- File: `src/components/landing/IndustryBlueprintModal.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-040 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/IndustryBlueprintModal.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-041 - Page/component still loads cleanly
- File: `src/components/landing/IntegrationPartners.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-042 - Copy still matches platform truth
- File: `src/components/landing/IntegrationPartners.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-043 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/IntegrationPartners.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-044 - Page/component still loads cleanly
- File: `src/components/landing/Navbar.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-045 - Copy still matches platform truth
- File: `src/components/landing/Navbar.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-046 - Navigation flow still feels fast and correct
- File: `src/components/landing/Navbar.jsx`
- Why: Navbar changes affect first-click experience across the site.
- What to check:
  - Click AI Store and confirm navigation is fast on the published site.
  - Verify Login and Book Demo buttons still open the right flows.
  - Verify desktop and mobile nav both still work.

### CA-047 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/Navbar.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-048 - Page/component still loads cleanly
- File: `src/components/landing/ProblemSolution.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-049 - Copy still matches platform truth
- File: `src/components/landing/ProblemSolution.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-050 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/ProblemSolution.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-051 - Page/component still loads cleanly
- File: `src/components/landing/TrustBar.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-052 - Copy still matches platform truth
- File: `src/components/landing/TrustBar.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-053 - Marketing sections still feel polished and trustworthy
- File: `src/components/landing/TrustBar.jsx`
- Why: Homepage or vertical-page changes need truthfulness and presentation checks.
- What to check:
  - Verify section layout on desktop and mobile.
  - Verify CTA buttons still go to the intended destination.
  - Verify no section implies unsupported live capabilities.

### CA-054 - Page/component still loads cleanly
- File: `src/components/portal/BuildTracker.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-055 - Copy still matches platform truth
- File: `src/components/portal/BuildTracker.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-056 - Portal experience still works for a real customer
- File: `src/components/portal/BuildTracker.jsx`
- Why: Portal changes affect the logged-in client experience directly.
- What to check:
  - Verify portal login, logout, and tab switching.
  - Verify Build Progress labels remain honest.
  - Verify plan/billing visibility still makes sense.

### CA-057 - Page/component still loads cleanly
- File: `src/components/portal/PlanManager.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-058 - Copy still matches platform truth
- File: `src/components/portal/PlanManager.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-059 - Portal experience still works for a real customer
- File: `src/components/portal/PlanManager.jsx`
- Why: Portal changes affect the logged-in client experience directly.
- What to check:
  - Verify portal login, logout, and tab switching.
  - Verify Build Progress labels remain honest.
  - Verify plan/billing visibility still makes sense.

### CA-060 - Page/component still loads cleanly
- File: `src/components/portal/SupportChat.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-061 - Copy still matches platform truth
- File: `src/components/portal/SupportChat.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-062 - Portal experience still works for a real customer
- File: `src/components/portal/SupportChat.jsx`
- Why: Portal changes affect the logged-in client experience directly.
- What to check:
  - Verify portal login, logout, and tab switching.
  - Verify Build Progress labels remain honest.
  - Verify plan/billing visibility still makes sense.

### CA-063 - Page/component still loads cleanly
- File: `src/components/store/CartSidebar.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-064 - Copy still matches platform truth
- File: `src/components/store/CartSidebar.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-065 - Store, cart, and bundle flows still work end to end
- File: `src/components/store/CartSidebar.jsx`
- Why: Store-facing changes can break pricing, search, cart behavior, or checkout entry.
- What to check:
  - Verify store hero stats and package section still render.
  - Verify search and category filters still work.
  - Verify Add to Cart, sticky summary, sidebar open/close, and package load flow.
  - Verify manual-review offers still stay consultative and do not enter self-serve checkout.

### CA-066 - Page/component still loads cleanly
- File: `src/components/store/ProductCard.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-067 - Copy still matches platform truth
- File: `src/components/store/ProductCard.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-068 - Store, cart, and bundle flows still work end to end
- File: `src/components/store/ProductCard.jsx`
- Why: Store-facing changes can break pricing, search, cart behavior, or checkout entry.
- What to check:
  - Verify store hero stats and package section still render.
  - Verify search and category filters still work.
  - Verify Add to Cart, sticky summary, sidebar open/close, and package load flow.
  - Verify manual-review offers still stay consultative and do not enter self-serve checkout.

### CA-069 - Page/component still loads cleanly
- File: `src/lib/AuthContext.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-070 - Copy still matches platform truth
- File: `src/lib/AuthContext.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-071 - Route/auth protection still behaves correctly
- File: `src/lib/AuthContext.jsx`
- Why: Core routing or auth shell changed.
- What to check:
  - Verify public routes still load when logged out.
  - Verify `/client-portal` redirects unauthenticated users correctly.
  - Verify `/admin` still blocks non-admin users.
  - Verify logout returns the user to the homepage in a logged-out state.

### CA-072 - Page/component still loads cleanly
- File: `src/pages/Book.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-073 - Copy still matches platform truth
- File: `src/pages/Book.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-074 - Lead/demo capture flow still works cleanly
- File: `src/pages/Book.jsx`
- Why: Booking/contact/forms changes affect a primary conversion path.
- What to check:
  - Open the related page or modal.
  - Verify form fields, validation, and close behavior.
  - Verify the flow still routes users into the expected booking/contact path.

### CA-075 - Page/component still loads cleanly
- File: `src/pages/ClientPortal.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-076 - Copy still matches platform truth
- File: `src/pages/ClientPortal.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-077 - Portal experience still works for a real customer
- File: `src/pages/ClientPortal.jsx`
- Why: Portal changes affect the logged-in client experience directly.
- What to check:
  - Verify portal login, logout, and tab switching.
  - Verify Build Progress labels remain honest.
  - Verify plan/billing visibility still makes sense.

### CA-078 - Page/component still loads cleanly
- File: `src/pages/OrderSuccess.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-079 - Copy still matches platform truth
- File: `src/pages/OrderSuccess.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-080 - Page/component still loads cleanly
- File: `src/pages/Store.jsx`
- Why: This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.
- What to check:
  - Open the affected page or trigger the affected component.
  - Confirm no broken layout, blank state, or obvious visual crash.
  - Confirm the changed surface still works on desktop.

### CA-081 - Copy still matches platform truth
- File: `src/pages/Store.jsx`
- Why: Customer-facing copy should stay honest after every content or UX change.
- What to check:
  - Check that the changed surface does not overclaim live readiness or unsupported integrations.
  - Check that CTA language still matches the actual flow.
  - Check that labels are consistent with the canonical admin/portal/store naming.

### CA-082 - Store, cart, and bundle flows still work end to end
- File: `src/pages/Store.jsx`
- Why: Store-facing changes can break pricing, search, cart behavior, or checkout entry.
- What to check:
  - Verify store hero stats and package section still render.
  - Verify search and category filters still work.
  - Verify Add to Cart, sticky summary, sidebar open/close, and package load flow.
  - Verify manual-review offers still stay consultative and do not enter self-serve checkout.

