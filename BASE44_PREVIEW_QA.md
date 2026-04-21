# Base44 Preview QA

## Goal
Confirm that the Base44-connected website launches, renders key pages, and keeps the lead funnel operational after repo syncs.

## Before Opening Preview
1. Confirm the latest branch has been pushed to the Base44-connected remote.
2. Confirm `npm run build` passes locally.
3. Confirm there are no unresolved merge markers in `src/` or `base44/functions/`.

## Pages To Check First
1. `/`
2. `/med-spa`
3. `/contact`
4. `/book`
5. `/admin`

## Homepage QA
1. Hero renders without layout breakage.
2. Navbar links scroll correctly to `How It Works`, `Pricing`, and `FAQ`.
3. Primary CTA opens the booking flow.
4. Final CTA loads the inline booking form.
5. Footer links route correctly.
6. No duplicate sticky CTA overlays appear.

## Lead Funnel QA
1. Submit the homepage final CTA booking form.
2. Submit the modal demo booking flow from the hero.
3. Submit the `/contact` form.
4. Confirm each action:
   - returns a success state
   - creates or updates the right lead record
   - does not create obvious duplicate demo rows

## Admin QA
1. Open `/admin`.
2. Confirm recent leads load.
3. Confirm intake metadata is visible:
   - `lead_capture`
   - `contact_inquiry`
   - `demo_booking`
4. Confirm Integration Health loads recent `CommunicationEvent` activity.
5. Open one lead detail page and confirm email history renders.

## If Preview Still Fails
Capture:
1. Base44 build log
2. Browser console error
3. Network error if the page shell loads but data does not
4. The exact route that fails

## Most Likely Remaining Failure Types
1. Base44 env/config mismatch
2. Runtime error from newer frontend code
3. Missing entity field in staging data
4. Function invocation failure from credentials/provider config
