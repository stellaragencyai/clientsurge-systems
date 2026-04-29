# ClientSurge Website Audit: 25 Bugs/Flaws + Immediate Fixes

## HIGH PRIORITY (Conversion Killers)

### 1. **FLAW: Missing Footer Visibility on Mobile**
- **Issue**: Footer component is fixed/sticky but content gets hidden behind it on small screens, causing unreachable CTAs
- **Fix**: Add `padding-bottom: env(safe-area-inset-bottom) + 80px` to body on mobile; adjust footer z-index layering and make it collapsible on scroll down

### 2. **FLAW: "Book Your Free Demo" Button Text Inconsistent Across Pages**
- **Issue**: Some pages say "Book Demo", others "Book Your Free Demo", others "Get Started" — confuses users on CTAs
- **Fix**: Create a `DemoButtonText` constant exported from one central file; use everywhere

### 3. **BUG: Navbar Logo Click Doesn't Scroll to Top Smoothly on Same Page**
- **Issue**: Logo click triggers scroll but doesn't reset to top if user is already on home page
- **Fix**: Add `window.scrollTo({ top: 0, behavior: 'smooth' })` as fallback when location is "/"

### 4. **FLAW: No Loading State for CTA Modal Opens**
- **Issue**: Clicking "Book Demo" feels laggy/unresponsive; no visual feedback during modal load
- **Fix**: Add a loading skeleton for DemoBookingModal; show spinner on button immediately on click

### 5. **BUG: Dark Mode Toggle Doesn't Persist Across Hard Refresh**
- **Issue**: Theme preference lost if user hard-refreshes or clears localStorage
- **Fix**: Store theme in both localStorage AND as CSS class; read from both on init; add fallback to system preference (prefers-color-scheme)

## MEDIUM PRIORITY (UX Friction)

### 6. **FLAW: Pricing Cards Have Inconsistent Hover Shadows**
- **Issue**: Some cards have blur effects that don't match others; visual hierarchy is muddled
- **Fix**: Standardize all card shadow/blur: use consistent `box-shadow` and `backdropFilter` values across pricing, proof cards, etc.

### 7. **BUG: Problem-Solution Cards Animate on Every Page Load**
- **Issue**: If user scrolls down and comes back up, animations re-trigger, feels glitchy
- **Fix**: Use `useCallback` + ref tracking to ensure animations only fire once per mount

### 8. **FLAW: No Mobile-First Responsive Typography**
- **Issue**: Font sizes use `clamp()` but breakpoints don't match design; text looks too small on tablets
- **Fix**: Audit all `clamp(min, preferred, max)` values; ensure readable 16px+ base on all viewports

### 9. **BUG: Industry Template Pages Don't Share Navbar State**
- **Issue**: Switching industries resets dark mode, scroll position, nav state
- **Fix**: Wrap all pages in a Context provider to persist user state across route changes

### 10. **FLAW: CTA Buttons Missing Focus States for Keyboard Navigation**
- **Issue**: Users tabbing through can't see which button is focused
- **Fix**: Add explicit `focus:ring-2 focus:ring-offset-2 focus:outline-none` to all CTA buttons globally

## PERFORMANCE & SEO

### 11. **BUG: HeroDashboardScreen Component Doesn't Lazy Load**
- **Issue**: Hero section renders a full dashboard mockup immediately, blocking initial paint
- **Fix**: Wrap HeroDashboardScreen in `React.lazy()` + `Suspense` with fallback skeleton

### 12. **FLAW: Open Graph Meta Tags Not Dynamic Per Page**
- **Issue**: All pages share same OG image/description; industry pages look generic in social shares
- **Fix**: Create a `getPageMetadata()` function that returns OG tags based on route; call in each page's useEffect

### 13. **BUG: Animations Cause Layout Shift (CLS)**
- **Issue**: Staggered animations in checklist/cards cause visible jank
- **Fix**: Use `will-change` CSS and `contain: layout` on animated containers; precompute animation space

### 14. **FLAW: No Canonical Tags on Dynamic Pages**
- **Issue**: Industry pages (/med-spa, /dental, etc.) might be duplicated or crawled inefficiently
- **Fix**: Add canonical tag in `<head>` pointing to self for each page route

### 15. **BUG: Analytics Events Logged Without Error Handling**
- **Issue**: If analytics fails, it breaks the interaction (missing try/catch)
- **Fix**: Wrap all `trackCTA()` calls in try/catch; log errors but don't stop user action

## VISUAL & DESIGN

### 16. **FLAW: Gradient Text in Headlines Breaks on Dark Mode**
- **Issue**: "Booked Appointments" gradient is brown/gold on white background but invisible on dark
- **Fix**: Create a `@media (prefers-color-scheme: dark)` rule with inverted gradient or solid gold color

### 17. **BUG: Pricing Card "Most Popular" Badge Overlaps Text on Mobile**
- **Issue**: Badge floats above card but truncates/overflows on small screens
- **Fix**: Adjust badge positioning with `top: -10px` max; add `@media (max-width: 640px) { top: 0; position: relative; }`

### 18. **FLAW: Nebula Background Gradients Look Washed Out on Dark Mode**
- **Issue**: Radial gradients (browns/golds) blend into dark background, losing depth
- **Fix**: Increase opacity by 1.5–2x for dark mode; use CSS custom property for toggling

### 19. **BUG: Checkbox Icons in Pricing Features Inconsistent**
- **Issue**: SVG checkmarks have different stroke widths across cards
- **Fix**: Create a single `CheckIcon` component; use everywhere in features lists

### 20. **FLAW: Mobile Navigation Drawer Overlaps Content**
- **Issue**: When menu is open, background content scrolls; creates jarring UX
- **Fix**: Add `overflow: hidden; position: fixed` to body when drawer is open; remove on close

## CONTENT & MESSAGING

### 21. **BUG: Demo Booking Modal Shows Success But Doesn't Redirect**
- **Issue**: Modal submits, shows "success", but user stays on same page with no next step
- **Fix**: After success, auto-close modal + show toast "Check your email" + optionally redirect to /success

### 22. **FLAW: "Book Demo" Button in Footer Has Inconsistent Color**
- **Issue**: Footer demo button uses gradient but Navbar uses solid — inconsistent branding
- **Fix**: Extract button styling to a `ShinyBrownButton` component; use everywhere

### 23. **BUG: Pricing Section Doesn't Show Selected Industry Context**
- **Issue**: User selects "Med Spa" on Industries page, but Pricing doesn't acknowledge it
- **Fix**: Read `sessionStorage[INDUSTRY_SELECTION_STORAGE_KEY]` in Pricing; show banner "Based on Med Spa selection"

### 24. **FLAW: No Scroll Progress Indicator**
- **Issue**: On long pages, user doesn't know how much content is left; increases bounce
- **Fix**: Add a thin progress bar at top: `<div style={{ height: '3px', background: 'primary', width: scrollProgress + '%' }} />`

### 25. **BUG: FAQ Search/Filter Doesn't Reset on Page Leave**
- **Issue**: If user filters FAQ, navigates away, comes back — filter is still active
- **Fix**: Use `useEffect(() => setSearchQuery(''), [location])` to reset state on route change

---

## Implementation Roadmap (Priority Order)

**Phase 1 (Critical, 2–3 hours):**
- #3, #5, #10, #21 (conversion blockers)
- #11, #12 (SEO/performance)

**Phase 2 (High Impact, 3–4 hours):**
- #1, #2, #6, #16, #22 (visual/branding consistency)
- #17, #20 (mobile UX)

**Phase 3 (Polish, 2–3 hours):**
- #7, #8, #13, #24 (animations/performance)
- #15, #23, #25 (state management)

---

## Notes
- Most fixes are < 30 minutes each once scoped
- Many can be batched (e.g., all button styling into one component)
- Test on real devices, not just devtools (dark mode, mobile Safari, etc.)