# Customer Experience QA Tracker

Last updated: 2026-04-23

This is a living frontend QA tracker for the public customer experience and customer-facing portal surfaces.

## How To Use

- `[ ]` = not tested yet
- `[x]` = tested and passed
- add a short note under any failed item when we find a bug
- this file is designed to be updated continuously as we test; it does **not** auto-update on its own without additional automation

## Summary

- Total checks: `250`
- Passed: `0`
- Open: `250`

---

## A. Global Shell, Navigation, Auth, And Session Flow

- [ ] FE-001 Main page loads without console-visible crash
- [ ] FE-002 Main page loads without broken layout flash
- [ ] FE-003 Main page logo is visible and aligned
- [ ] FE-004 Clicking logo returns to top/home correctly
- [ ] FE-005 Desktop navbar renders all expected links
- [ ] FE-006 Mobile navbar opens correctly
- [ ] FE-007 Mobile navbar closes correctly
- [ ] FE-008 Navbar theme toggle renders correctly
- [ ] FE-009 Theme toggle changes theme without breaking layout
- [ ] FE-010 AI Store nav link opens `/store`
- [ ] FE-011 AI Store nav transition feels fast on published site
- [ ] FE-012 Book Demo CTA opens the correct flow
- [ ] FE-013 Login CTA opens the correct login flow
- [ ] FE-014 Industries dropdown opens on desktop
- [ ] FE-015 Industries dropdown closes cleanly
- [ ] FE-016 Industries links navigate correctly
- [ ] FE-017 Sticky navbar behavior feels stable during scroll
- [ ] FE-018 Footer renders without broken links
- [ ] FE-019 Footer legal links resolve correctly
- [ ] FE-020 Footer contact links resolve correctly
- [ ] FE-021 Public route `/` works
- [ ] FE-022 Public route `/store` works
- [ ] FE-023 Public route `/book` works
- [ ] FE-024 Public route `/start` works
- [ ] FE-025 Public route `/industries` works
- [ ] FE-026 Public route `/contact` works
- [ ] FE-027 Public route `/order-success` works when accessed directly
- [ ] FE-028 Public route `/legal/privacy` works
- [ ] FE-029 Public route `/legal/terms` works
- [ ] FE-030 Protected route `/client-portal` redirects correctly when logged out
- [ ] FE-031 Protected route `/admin` blocks non-admin users
- [ ] FE-032 Admin login succeeds with a real admin account
- [ ] FE-033 Admin logout returns user to `/` as logged-out visitor
- [ ] FE-034 Logged-out user cannot still access admin after logout
- [ ] FE-035 Portal login modal opens correctly
- [ ] FE-036 Portal login modal closes correctly
- [ ] FE-037 Forgot-password path is visible where expected
- [ ] FE-038 Fresh user session persists correctly after login
- [ ] FE-039 Hard refresh after login preserves expected user state
- [ ] FE-040 Hard refresh after logout keeps the user logged out

## B. Home Page Hero And Above-The-Fold Experience

- [ ] FE-041 Hero headline renders correctly
- [ ] FE-042 Hero subheadline renders correctly
- [ ] FE-043 Hero primary CTA is visible
- [ ] FE-044 Hero primary CTA works
- [ ] FE-045 Hero secondary CTA works
- [ ] FE-046 Hero visual loads without broken media
- [ ] FE-047 Hero background does not cause layout jank
- [ ] FE-048 Hero dashboard visual renders correctly
- [ ] FE-049 Hero dashboard screen scales correctly on desktop
- [ ] FE-050 Hero dashboard screen scales correctly on mobile
- [ ] FE-051 Hero trust indicators render correctly
- [ ] FE-052 Mobile call bar renders correctly if present
- [ ] FE-053 Mobile call bar does not overlap hero CTA
- [ ] FE-054 Hero section spacing feels balanced on desktop
- [ ] FE-055 Hero section spacing feels balanced on mobile
- [ ] FE-056 Hero copy does not overclaim unsupported functionality
- [ ] FE-057 Hero CTA copy matches current offer strategy
- [ ] FE-058 Hero animation does not stutter
- [ ] FE-059 Hero section remains readable in dark mode
- [ ] FE-060 Hero section remains readable in light mode
- [ ] FE-061 Trust bar loads correctly
- [ ] FE-062 Guarantee banner loads correctly
- [ ] FE-063 Social proof toasts do not feel broken or spammy
- [ ] FE-064 Exit intent popup opens only when intended
- [ ] FE-065 Exit intent popup closes cleanly
- [ ] FE-066 Exit intent popup CTA works
- [ ] FE-067 Cookie consent banner appears correctly
- [ ] FE-068 Cookie consent accept action works
- [ ] FE-069 Cookie consent dismiss action works
- [ ] FE-070 Cookie consent does not overlap critical CTAs
- [ ] FE-071 Section divider visuals render cleanly
- [ ] FE-072 Fade-in effects do not block interaction
- [ ] FE-073 Stat counters render correct copy
- [ ] FE-074 Stat counters do not jitter on scroll
- [ ] FE-075 Sticky CTA appears at appropriate times
- [ ] FE-076 Sticky CTA does not obscure content
- [ ] FE-077 Sticky CTA click path works
- [ ] FE-078 Demo video section renders cleanly
- [ ] FE-079 Demo video section does not imply hosted videos when not available
- [ ] FE-080 Demo video section CTAs work

## C. Home Page Core Content Sections

- [ ] FE-081 Problem section renders correctly
- [ ] FE-082 Problem solution section renders correctly
- [ ] FE-083 Solution section renders correctly
- [ ] FE-084 Core offer section renders correctly
- [ ] FE-085 Benefits section renders correctly
- [ ] FE-086 How It Works section renders correctly
- [ ] FE-087 Detailed process section renders correctly
- [ ] FE-088 Enhanced system steps render correctly
- [ ] FE-089 System flow diagram renders correctly
- [ ] FE-090 Automation pipeline section renders correctly
- [ ] FE-091 Automation demo section renders correctly
- [ ] FE-092 Automation walkthrough renders correctly
- [ ] FE-093 AI response demo renders correctly
- [ ] FE-094 AI audit section renders correctly
- [ ] FE-095 Before/after section renders correctly
- [ ] FE-096 Missed lead recovery section renders correctly
- [ ] FE-097 Performance pod renders correctly
- [ ] FE-098 Tools strip renders correctly
- [ ] FE-099 Integration partners section renders correctly
- [ ] FE-100 Integrations badges render correctly
- [ ] FE-101 Testimonials section renders correctly
- [ ] FE-102 Founder section renders correctly
- [ ] FE-103 Why us section renders correctly
- [ ] FE-104 Final CTA section renders correctly
- [ ] FE-105 FAQ section renders correctly
- [ ] FE-106 FAQ expand/collapse works
- [ ] FE-107 FAQ copy matches current offer scope
- [ ] FE-108 Lead value calculator renders correctly
- [ ] FE-109 Lead value calculator accepts input correctly
- [ ] FE-110 Lead value calculator outputs sensible values
- [ ] FE-111 Revenue calculator renders correctly
- [ ] FE-112 Revenue calculator accepts input correctly
- [ ] FE-113 Revenue calculator outputs sensible values
- [ ] FE-114 Live automation feed renders without broken state
- [ ] FE-115 Live automation feed does not overclaim real-time production proof
- [ ] FE-116 Live lead pulse renders correctly
- [ ] FE-117 Live lead pulse does not overclaim unsupported automation
- [ ] FE-118 Conversation modal opens correctly if triggered
- [ ] FE-119 Conversation modal closes correctly
- [ ] FE-120 Industry modal opens correctly
- [ ] FE-121 Industry modal closes correctly
- [ ] FE-122 Industry blueprint modal opens correctly
- [ ] FE-123 Industry blueprint modal closes correctly
- [ ] FE-124 Hero-to-pricing navigation works
- [ ] FE-125 Hero-to-book-demo navigation works
- [ ] FE-126 Scroll-linked sections land on the right anchors
- [ ] FE-127 Section copy is consistent with current platform truth
- [ ] FE-128 No home-page section uses stale route labels
- [ ] FE-129 No home-page section uses misleading “always running” claims
- [ ] FE-130 No home-page section uses broken or placeholder visuals

## D. Pricing, Store, Cart, Checkout, And Order Success

- [ ] FE-131 Pricing page section renders correctly on home page
- [ ] FE-132 Starter package card renders correctly
- [ ] FE-133 Growth package card renders correctly
- [ ] FE-134 Pro package card renders correctly
- [ ] FE-135 Package prices match current catalog
- [ ] FE-136 Package CTAs load the bundle into the store correctly
- [ ] FE-137 Pricing section explains package vs custom bundle clearly
- [ ] FE-138 AI Store hero renders correctly
- [ ] FE-139 AI Store stats show 12 public offers
- [ ] FE-140 AI Store stats show 6 self-serve services
- [ ] FE-141 AI Store stats show 3 packaged systems
- [ ] FE-142 Packaged systems section renders correctly
- [ ] FE-143 Package bundle cards load correctly
- [ ] FE-144 Package bundle “Load This Bundle” action works
- [ ] FE-145 Search input on store works
- [ ] FE-146 Category chips on store work
- [ ] FE-147 Product grid renders without layout issues
- [ ] FE-148 Self-serve products show “Add to Cart”
- [ ] FE-149 Manual-review products show consultative wording
- [ ] FE-150 Manual-review products do not enter self-serve cart flow
- [ ] FE-151 Product pricing displays correctly
- [ ] FE-152 Product highlights display correctly
- [ ] FE-153 Product fulfillment labels are honest and current
- [ ] FE-154 Cart sticky summary appears only when items exist
- [ ] FE-155 Cart sticky summary opens the sidebar correctly
- [ ] FE-156 Cart sidebar opens correctly
- [ ] FE-157 Cart sidebar closes correctly
- [ ] FE-158 Cart sidebar item removal works
- [ ] FE-159 Empty-cart state renders correctly
- [ ] FE-160 Checkout form inside cart validates correctly
- [ ] FE-161 Checkout form error state displays correctly
- [ ] FE-162 Checkout button triggers canonical checkout flow
- [ ] FE-163 Checkout does not allow unsupported products through self-serve
- [ ] FE-164 Pricing summary matches selected services
- [ ] FE-165 Bundle discount summary displays correctly
- [ ] FE-166 Interactive stack builder loads when cart has items
- [ ] FE-167 Interactive stack builder stays hidden when cart is empty
- [ ] FE-168 Store page now feels fast on published domain
- [ ] FE-169 Store page still works after hard refresh
- [ ] FE-170 Order success page renders correctly
- [ ] FE-171 Order success page copy is honest about setup/testing/live review
- [ ] FE-172 Order success page points users to the portal correctly
- [ ] FE-173 Order success page CTA buttons work
- [ ] FE-174 Order success page does not promise unproven live metrics
- [ ] FE-175 Store-to-checkout-to-order-success flow feels coherent end to end

## E. Booking, Contact, Lead Capture, Onboarding, Start, Legal, And Industries

- [ ] FE-176 Book page loads correctly
- [ ] FE-177 Demo booking inline form renders correctly
- [ ] FE-178 Demo booking modal renders correctly
- [ ] FE-179 Demo booking date picker works
- [ ] FE-180 Demo booking slot loading works
- [ ] FE-181 Demo booking submission works
- [ ] FE-182 Demo booking success state is clear
- [ ] FE-183 Contact page loads correctly
- [ ] FE-184 Contact form submits correctly
- [ ] FE-185 Contact form validation is clear
- [ ] FE-186 Start page loads correctly
- [ ] FE-187 Start page CTA flow works
- [ ] FE-188 Lead capture page loads correctly
- [ ] FE-189 Landing lead capture form renders correctly
- [ ] FE-190 Lead capture modal renders correctly
- [ ] FE-191 Lead capture form submits correctly
- [ ] FE-192 Lead capture success state is clear
- [ ] FE-193 Signup modal renders correctly
- [ ] FE-194 Signup modal submits correctly
- [ ] FE-195 Onboarding page loads correctly
- [ ] FE-196 Onboarding form submits correctly
- [ ] FE-197 Onboarding page copy matches current platform promises
- [ ] FE-198 Industries page loads correctly
- [ ] FE-199 Industries page anchor navigation works
- [ ] FE-200 Industry-specific cards render correctly
- [ ] FE-201 Legal privacy page loads correctly
- [ ] FE-202 Legal terms page loads correctly
- [ ] FE-203 Legal pages are readable on mobile
- [ ] FE-204 Success page loads correctly
- [ ] FE-205 Success page copy is not stale
- [ ] FE-206 Portal login modal works from public surfaces
- [ ] FE-207 Login modal closes cleanly
- [ ] FE-208 Public forms do not visually break in dark mode
- [ ] FE-209 Public forms do not visually break in light mode
- [ ] FE-210 Public page CTAs consistently route to the intended destination

## F. Customer Portal And Customer-Facing Account Experience

- [ ] FE-211 Client portal loads for a valid portal user
- [ ] FE-212 Client portal blocks non-owned access correctly
- [ ] FE-213 Portal top-level layout renders cleanly
- [ ] FE-214 Build tracker renders cleanly
- [ ] FE-215 Build tracker labels are honest and current
- [ ] FE-216 Build tracker does not overclaim “fully live” unsupported states
- [ ] FE-217 Build tracker timeline/status is readable on mobile
- [ ] FE-218 Plan manager renders correctly
- [ ] FE-219 Plan manager shows current plan correctly
- [ ] FE-220 Plan manager shows billing state correctly
- [ ] FE-221 Plan manager shows renewal date correctly
- [ ] FE-222 Upgrade request action works
- [ ] FE-223 Downgrade request action works
- [ ] FE-224 Cancel request action works
- [ ] FE-225 Support chat renders correctly
- [ ] FE-226 Support chat opens correctly
- [ ] FE-227 Portal login experience feels coherent for a first-time QA user
- [ ] FE-228 Portal hard refresh preserves expected access
- [ ] FE-229 Portal logout path works if exposed to the user
- [ ] FE-230 Password recovery path for portal users is understandable

## G. Med Spa Funnel And Vertical-Specific Experience

- [ ] FE-231 Med Spa page loads correctly
- [ ] FE-232 Med Spa navbar works correctly
- [ ] FE-233 Med Spa hero renders correctly
- [ ] FE-234 Med Spa problem section renders correctly
- [ ] FE-235 Med Spa solution section renders correctly
- [ ] FE-236 Med Spa benefits section renders correctly
- [ ] FE-237 Med Spa pricing preview renders correctly
- [ ] FE-238 Med Spa demo section renders correctly
- [ ] FE-239 Med Spa demo modal opens correctly
- [ ] FE-240 Med Spa FAQ works correctly
- [ ] FE-241 Med Spa testimonials render correctly
- [ ] FE-242 Med Spa social proof renders correctly
- [ ] FE-243 Med Spa reactivation section renders correctly
- [ ] FE-244 Med Spa ROI block renders correctly
- [ ] FE-245 Med Spa why-it-works section renders correctly

## H. Cross-Device, Trust, And Finish-Level Checks

- [ ] FE-246 Home page looks correct on mobile
- [ ] FE-247 Store page looks correct on mobile
- [ ] FE-248 Client portal looks correct on mobile
- [ ] FE-249 Primary customer journey has no obviously stale copy
- [ ] FE-250 Primary customer journey feels polished enough for real QA and real clients

---

## Bug Notes

Use this section to record discovered issues as we test.

- `YYYY-MM-DD` - `FE-___` - Description:
