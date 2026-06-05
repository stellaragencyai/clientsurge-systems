# Booking Production Sync Checklist

## Safety
- [x] Work from `C:/Users/nolan/Code/ClientSurge/clientsurge-systems`
- [x] Do not submit a real production booking without explicit approval
- [x] Do not send CRM campaign emails or contact real leads
- [x] Do not print secrets or private lead data
- [x] Do not redesign or rename the booking system
- [x] Keep public language as Free Automation Audit

## Phase 1 - Source Of Truth
- [x] Inspect `src/components/forms/DemoBookingModal.jsx`
- [x] Inspect `src/components/forms/DemoBookingInline.jsx`
- [x] Inspect `src/pages/Book.jsx`
- [x] Inspect `base44/functions/scheduleDemoBooking/entry.ts`
- [x] Confirm date/time scheduler fields
- [x] Confirm industry context support
- [x] Confirm source page, UTM, and referrer tracking
- [x] Confirm CRM `Booked` / `Audit Booked`
- [x] Confirm notification side-effect handling
- [x] Confirm missing-provider failures are warnings, not booking crashes
- [x] Fix remaining public/internal audit-language stragglers found in source

## Phase 2 - Booking-Only Release Isolation
- [x] Run `git status --short`
- [x] Run `git diff --stat`
- [x] Identify booking-related files only
- [x] Exclude unrelated dirty files
- [x] Stage only booking-related files if release is safe

## Phase 3 - Production Mismatch Fix
- [x] `/book` source renders current scheduler
- [x] Homepage CTA opens scheduler modal with date/time
- [x] Roofing CTA preserves roofing context
- [x] HVAC CTA preserves HVAC context
- [x] Dental CTA preserves dental context
- [x] Modal captures all required fields
- [x] Public FAQ uses audit language, not demo-call language
- [x] Mobile modal works after cookie dismissal

## Phase 4 - Local Verification
- [x] `npm install`
- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] Targeted booking tests

## Local Rendered Smoke
- [x] `/book` scheduler visible
- [x] Homepage modal has date/time and consent
- [x] Roofing modal has date/time, consent, and roofing context
- [x] HVAC modal has date/time, consent, and HVAC context
- [x] Dental modal has date/time, consent, and dental context
- [x] Mobile modal opens after cookie dismissal
- [x] Console clean in rendered smoke

## Phase 5 - Release
- [x] Commit booking-only release
- [x] Push to `origin main`
- [x] Wait for GitHub gate
- [x] Publish to Base44

## Phase 6 - Production Verification Without Submission
- [x] `/book` loads current scheduler (via Cloudflare bridge while Base44 asset remains stale)
- [x] Date/time fields visible
- [x] Homepage CTA opens scheduler
- [x] Roofing context preserved
- [x] HVAC context preserved
- [x] Dental context preserved
- [x] Consent visible
- [x] Source metadata present in frontend payload path
- [x] FAQ audit language verified
- [x] Mobile works after cookie dismissal
- [ ] Console clean (booking clean; one unrelated homepage Unsplash request blocked by ORB)

## Phase 6A - Cloudflare Fallback Bridge
- [x] Confirm Base44 publish left production stale
- [x] Identify stale booking UI source in Cloudflare fallback patch
- [x] Patch fallback modal to submit `scheduleDemoBooking`
- [x] Patch fallback modal to capture date/time and consent
- [x] Patch fallback modal to preserve industry/source/UTM/referrer metadata
- [x] Patch `/book` fallback scheduler behavior
- [x] Update Cloudflare worker tests
- [x] Run Cloudflare worker tests
- [x] Dry-run Cloudflare deploy
- [x] Deploy Cloudflare fallback bridge
- [x] Verify live production after deploy

## Phase 7 - Approved Test Booking
- [ ] Prepare exact test data
- [ ] Wait for explicit approval
- [ ] Submit approved production test booking
- [ ] Verify CRM record
- [ ] Verify `Audit Booked` stage
- [ ] Verify confirmation email
- [ ] Verify prep email if expected
- [ ] Verify SMS if configured
- [ ] Verify admin alert
- [ ] Verify calendar/event behavior

## Notes
- Production was previously verified stale: live `/book` showed the old contact-note/openings flow and live modals had no date/time fields.
- Current checkout is behind `origin/main` by 1 and has unrelated dirty files. Booking release must be isolated carefully.
- Booking source files match `origin/main`; the production mismatch is a publish/live-bundle drift, not missing scheduler source on `origin/main`.
- Patched source stragglers: FAQ demo-call wording, `IndustryHero` Free Demo fallback, `IndustryResults` Free demo note, SMS confirmation demo wording.
- Patched confirmation/admin notification payload compatibility for date/time, industry, website, and source metadata.
- Local rendered smoke passed on `http://127.0.0.1:5173`.
- Release will use a clean temporary worktree from `origin/main` to avoid staging unrelated dirty files.
- Clean release worktree validation passed: build, lint, typecheck, targeted booking tests, full Node/Deno test suite.
- Booking-only commit created: `fca12420`.
- Pushed `fca12420` to `origin/main`.
- GitHub gate wait script timed out after 10 minutes without a result.
- Direct GitHub check-run proof passed: `Verify main before Base44 publish` for `fca12420`.
- Base44 publish API returned OK, but live asset hash did not move from `/assets/index-CfqyupK0.js`.
- Production verification after Base44 publish still stale: `/book` old openings flow, modal missing date/time and consent, industry contexts not prefilled.
- Next bridge check: existing Cloudflare fallback layer.
- Cloudflare fallback script confirmed as the live stale modal source; it currently posts to `submitContactInquiry` and lacks scheduler date/time/consent fields.
- Cloudflare fallback bridge patched in clean release worktree; focused worker test passed 35/35.
- Cloudflare dry-run passed with Wrangler 4.98.0.
- Cloudflare Worker deploy completed: version `a826c406-bede-460d-887d-8f0e59ef9d4e`.
- Follow-up Cloudflare selector/language patch committed as `94dcaa6d` and deployed as Worker version `96da088f-c513-49a8-b3a6-550af9d3ad52`.
- Final stale modal wrapper claim patch committed as `702e5e5e` and deployed as Worker version `a38eb4a3-ae3d-4e15-bccd-be6b399b8aea`.
- `/book` scheduler visibility patch committed as `062d2c01` and deployed as Worker version `be9b60ed-0968-4580-b1cd-0109b8b97ea7`.
- Production security verifier after final deploy: 36 pass, 0 warn, 0 fail.
- No-submit Playwright smoke intercepted `scheduleDemoBooking` payloads for home, roofing, HVAC, dental, and `/book`; no production booking was submitted.
- Live payloads captured required fields: name, email, phone, business, website, industry, issue, date/time, consent, source page, UTM where supplied, and referrer.
- Mobile homepage CTA opened the scheduler after cookie dismissal with date/time/consent visible.
- Remaining non-booking console/network issue: homepage Unsplash image blocked by ORB.
- This checklist is a progress artifact and should not be included in the app release unless explicitly requested.
