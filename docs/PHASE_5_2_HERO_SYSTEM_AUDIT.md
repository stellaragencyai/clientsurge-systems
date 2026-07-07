# Phase 5.2 — Hero System Audit & Consolidation Recommendation

## Current State (3 Hero Components)

### 1. CinematicHero.jsx (Homepage)
- **Purpose**: Main storefront hero with logo marquee, automation pills, social proof metrics
- **Animations**: Framer Motion (entrance, floating orbs)
- **Background**: Radial gradient white→light-blue + animated blur orbs
- **CTAs**: `cs-btn-primary` class (✅ already migrated), custom inline-styled Link for secondary
- **Unique**: Logo marquee animation, automation pill list, 4-stat social proof bar
- **Issues**: Secondary CTA uses inline styles instead of CSButton

### 2. HeroSection.jsx (Generic/Reusable)
- **Purpose**: Generic hero with parallax scroll, badge, optional background image
- **Animations**: Manual parallax via scrollY state (not framer-motion)
- **Background**: Supports `backgroundType: "gradient" | "image"`
- **CTAs**: Custom inline-styled button with gradient border, shadcn `Button` for secondary
- **Unique**: Parallax depth layers, trust badges row, video support
- **Issues**: Primary CTA uses 15 lines of inline styles, secondary uses shadcn Button (not CSButton)

### 3. IndustryHero.jsx (Industry Pages)
- **Purpose**: Cinematic wallpaper hero for industry landing pages
- **Animations**: None (static)
- **Background**: backgroundImage URL with gradient overlays
- **CTAs**: `cs-btn-primary` with white background override, inline-styled secondary/fallback
- **Unique**: Dual-mode (cinematic wallpaper vs gradient fallback), text shadows for image overlay
- **Issues**: Primary CTA overrides cs-btn-primary with white bg (intentional for dark hero), secondary/fallback use inline styles

---

## Duplicate Code Identified

| Pattern | CinematicHero | HeroSection | IndustryHero |
|---------|:---:|:---:|:---:|
| CTA button wrapper | ✅ | ✅ (different) | ✅ (different) |
| Badge/eyebrow element | ✅ | ✅ | ✅ |
| Social proof / trust badges | ✅ | ✅ | ❌ |
| Background gradient logic | ✅ | ✅ | ✅ |
| Text shadow for image overlay | ❌ | ✅ | ✅ |
| Parallax / scroll effect | ✅ (motion) | ✅ (manual) | ❌ |

---

## Recommendation: 3 Atomic Hero Components

### CSHero (Homepage / Storefront)
```
Purpose: Primary landing hero with animated background, social proof, logo strip
Props: eyebrow, title, subtitle, primaryCTA, secondaryCTA, pills[], metrics[], logos[]
Animations: Framer Motion entrance + ambient floating orbs (reduced-motion aware)
Background: Light radial gradient + optional animated orbs
CTAs: CSButton primary + CSButton outline
```

### CSProductHero (Generic / Reusable)
```
Purpose: Reusable hero for product pages, landing pages, generic sections
Props: badge, title, titleHighlight, subtitle, description, primaryCTA, secondaryCTA, trustBadges[], stats[], backgroundType, backgroundImage
Animations: Framer Motion parallax (replace manual scrollY)
Background: Gradient or image with overlay
CTAs: CSButton primary + CSButton outline
```

### CSIndustryHero (Industry Pages)
```
Purpose: Cinematic wallpaper hero for industry-specific landing pages
Props: eyebrow, headline, subheadline, description, backgroundImage, primaryCTA, secondaryCTA, fallbackCTA
Animations: Subtle entrance (fade-in only, no parallax — photo is the star)
Background: Full-bleed image with gradient overlays for text contrast
CTAs: CSButton primary (white variant for dark bg) + CSButton ghost (outline on dark)
Text: White text with text-shadow for legibility on photos
```

---

## Migration Priority

1. **CinematicHero → CSHero**: Already close — swap inline Link to CSButton, extract metrics/logos as props
2. **HeroSection → CSProductHero**: Replace manual parallax with framer-motion, swap shadcn Button → CSButton
3. **IndustryHero → CSIndustryHero**: Standardize CTA buttons, extract overlay gradient as shared constant

## Blockers Before Merge
- CinematicHero has homepage-specific logo marquee logic (needs to stay as a child component or slot)
- HeroSection parallax approach differs from framer-motion pattern used elsewhere
- IndustryHero white-on-dark CTA variant doesn't exist in CSButton yet (needs `variant="light"` or inline override)

## Recommendation
**Do NOT merge in Phase 5.2.** Create the 3 atomic hero components in a future sprint after:
1. CSButton gets a `variant="light"` option for dark backgrounds
2. Logo marquee is extracted as a standalone `CSLogoMarquee` component
3. Parallax is standardized on framer-motion across all heroes