/**
 * utils/ogMetaTags.js — #78 dedup
 * OG/Twitter meta management is now centralized in lib/seo.js → setPageMetadata().
 * This file is kept for backward compatibility. New code should use lib/seo.js directly.
 * @deprecated Use setPageMetadata() from lib/seo.js instead.
 */
export { setPageMetadata as setOgMeta } from "@/lib/seo";