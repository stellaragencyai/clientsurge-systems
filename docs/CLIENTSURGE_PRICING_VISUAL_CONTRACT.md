# ClientSurge Pricing Visual Contract

## Locked reference

The current ClientSurge pricing section is the canonical visual reference for the future pricing/storefront experience.

The future pricing page may change:

- Package names
- Prices
- Setup fees
- Package descriptions
- Feature lists
- Operational details
- Checkout behavior

The future pricing page must not casually change:

- Typography character and hierarchy
- Three-card composition
- Container proportions
- Growth/package emphasis treatment
- White and pale-blue surface balance
- Rounded pill actions
- Most Popular badge treatment
- Price scale and weight
- Fine blue borders and restrained shadows
- System coverage strip pattern

## Canonical commerce blue

The approved primary commerce action is a left-to-right gradient sampled from the current pricing reference:

- Start: `#0094D8`
- End: `#005CB9`
- Semantic solid midpoint: `#0079C9`
- CSS token: `--cs-commerce-blue-gradient`

This exact gradient is required for:

- Primary Add to Cart actions
- Most Popular badge
- Storefront priority actions
- Selected commerce states where a filled action is appropriate

Do not substitute generic royal blue, violet-blue, indigo, or the former `#0969E8` action color on pricing surfaces.

## Card rules

- Default cards use white surfaces with fine cool-blue borders.
- The recommended card uses a pale-blue-to-white surface, commerce-blue border, and slightly stronger shadow.
- The recommended card remains structurally aligned with the other plans; emphasis must not distort the comparison.
- Secondary Add to Cart buttons remain white with commerce-blue outlines.
- Price typography is dark navy, heavy, tightly tracked, and visually dominant.
- Green check icons remain reserved for included capabilities.

## Implementation assets

- `src/styles/clientsurge-os-tokens.css`
- `src/styles/clientsurge-os-pricing.css`
- `src/components/design-system/CSPricingPrimitives.jsx`

## Governance

Any future redesign that changes the pricing composition or canonical commerce blue requires an explicit product decision. It must not happen incidentally during dashboard, authentication, activation, or marketing-site refactoring.