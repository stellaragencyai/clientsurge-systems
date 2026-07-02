# ClientSurge Design Tokens

These tokens define the visual language for ClientSurge Systems across website, client portal, admin dashboard, emails, reports, and docs.

## Color Tokens

| Token | Value | Use |
|---|---:|---|
| `cs.black` | `#000000` | Primary text, premium panels, footer blocks |
| `cs.white` | `#FFFFFF` | Cards, page panels, contrast background |
| `cs.page` | `#F7FBFE` | Soft app/page background |
| `cs.electric` | `#00AEEF` | Primary brand accent, rails, highlights |
| `cs.deepBlue` | `#0088CC` | Primary CTA gradient start |
| `cs.navy` | `#005691` | CTA gradient end, strong labels |
| `cs.softBlue` | `#EEF9FF` | Highlight cards, selected states |
| `cs.borderBlue` | `#C9E7FB` | Card borders, dividers |
| `cs.body` | `#262626` | Body copy |
| `cs.muted` | `#4B5563` | Secondary copy |
| `cs.footerBlue` | `#DFF6FF` | Footer text on black panels |
| `status.trusted` | `#16A34A` | Verified success |
| `status.warning` | `#D97706` | Needs attention |
| `status.blocked` | `#DC2626` | Cannot proceed |
| `status.unknown` | `#6B7280` | Unknown/no evidence |
| `status.pending` | `#2563EB` | Async/pending |

## Typography

- Headline font stack: `Montserrat, Arial, sans-serif`
- Body font stack: `Inter, Arial, Helvetica, sans-serif`
- H1: 34–56px depending on surface
- H2: 28–38px
- H3/card title: 16–22px
- Body: 15–18px
- Metadata labels: 11–12px, uppercase, heavy weight, wide letter spacing

## Spacing

- Page padding desktop: 48–80px
- Page padding mobile: 20–28px
- Card padding: 20–32px
- Section gap: 32–56px
- Component gap: 12–24px
- Dense table row padding: 8–12px

## Radius

- Small controls: 8px
- Standard cards: 16px
- Premium shells: 18–24px
- Pills/buttons: 999px

## Shadows

- Premium card shadow: `0 20px 58px rgba(0,136,204,0.16)`
- CTA shadow: `0 8px 24px rgba(0,121,193,0.36)`
- Dark panel shadow: `0 12px 32px rgba(0,0,0,0.16)`

## Core Components

### Premium Card

- White background
- Blue border
- 16–24px radius
- Optional left electric-blue accent rail
- Strong title, muted body

### Status Badge

- Pill shape
- Uppercase label
- Status color mapped to taxonomy
- Must reflect actual data state, never static decoration

### Primary CTA

- Deep-blue to navy gradient
- White text
- Heavy font weight
- Pill radius
- Action-specific label, not generic `Click here`

### Proof Panel

Every proof panel must show:

- Status
- Source
- Checked time
- Evidence summary
- Next action if not trusted

### Empty State

Every empty state must show:

- What is missing
- Why it matters
- What the user/admin should do next

### Error State

Every error state must show:

- What failed
- Whether user action is required
- Retry action if safe
- Support escalation if not recoverable

## Forbidden Legacy Presentation

Do not use:

- Old brown theme colors
- Emoji-led headings
- Unbranded generic cards
- Static green checks without proof
- Random one-off CTA styles
- Dense admin tables without summary cards

## Adoption Rule

New UI, email, report, and admin components should either:

1. Use these tokens directly, or
2. Import from a shared component built from these tokens.

No new isolated visual systems.