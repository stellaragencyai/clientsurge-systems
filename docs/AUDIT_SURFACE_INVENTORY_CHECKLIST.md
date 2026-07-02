# ClientSurge Surface Inventory Audit Checklist

Use this checklist before redesigning or rebuilding any major ClientSurge area.

## Website Surfaces

- Home page
- Pricing page
- Industry pages
- Free audit flow
- Contact form
- Checkout handoff
- Trust/security pages
- Blog/help/education pages
- Error pages
- Mobile navigation
- Footer

For each page record:

- URL
- Primary conversion goal
- Current visual quality score /10
- Current trust score /10
- Broken or confusing sections
- Data/proof claims shown
- CTA quality
- Mobile quality
- Brand consistency issues
- Immediate fix

## Client Portal Surfaces

- Login/signup
- Portal dashboard
- Setup/onboarding
- Credentials submission
- Installation progress
- Automation status
- Reports
- Billing
- Support
- Activity feed
- Documents
- Notifications

For each surface record:

- User goal
- Required data sources
- Current status states
- Missing proof states
- Friction points
- Trust gaps
- Support deflection opportunities

## Admin Surfaces

- Admin overview
- Lead dashboard
- CRM
- Client list
- Order list
- Automation tracking
- Install queue
- Email operations
- SMS/Twilio operations
- Resend operations
- Stripe operations
- Analytics/GA4
- Release status
- Proof center
- System health

For each surface record:

- Owner
- Source of truth
- Last verified data source
- What can be trusted
- What is stale/unknown
- What actions are dangerous
- What actions require confirmation
- What proof should be added

## Communications Surfaces

- Transactional emails
- Lifecycle emails
- Nurture emails
- Reports
- SMS templates
- Voice greetings
- AI voice prompts
- Internal alerts
- Support replies

For each message record:

- Sender identity
- Reply-to
- Template version
- Category
- Trigger
- Recipient
- Data dependencies
- CommunicationEvent logging
- Delivery provider
- Unsubscribe/opt-out requirement

## Stripe/Billing Surfaces

- Checkout page
- Payment success
- Payment failure
- Subscription update
- Invoices
- Receipts
- Billing portal
- Failed-payment emails
- Cancellation flow

For each surface record:

- Is Stripe-hosted or ClientSurge-owned?
- Can it be customized safely?
- Does it match ClientSurge brand?
- Is pricing accurate?
- Is test/live mode clear?
- Does it log proof after payment?

## Scorecard

Use this scoring system:

| Score | Meaning |
|---:|---|
| 10 | Premium, clear, proof-backed, conversion-ready |
| 8 | Strong but could be refined |
| 6 | Functional but visibly immature |
| 4 | Confusing, inconsistent, or trust-damaging |
| 2 | Broken or likely losing customers |
| 0 | Not present |

## Output Format

Create an audit table with:

- Surface
- Current score
- Customer impact
- Business risk
- Main flaw
- Root cause
- Immediate fix
- Larger system fix
- Owner
- Priority

## Priority Rules

Fix first:

1. Broken conversion paths
2. Payment/order/onboarding handoff gaps
3. Paying-client portal trust gaps
4. Admin data/proof inaccuracies
5. Brand inconsistencies on high-traffic pages
6. Low-risk cosmetic cleanup