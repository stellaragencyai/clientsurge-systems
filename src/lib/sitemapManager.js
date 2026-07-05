/**
 * Sitemap Generation Trigger
 * Fixes Audit Issue #62: No XML sitemap generation
 *
 * Triggers the generateSitemap backend function on a schedule
 * and on content creation events.
 */

import { base44 } from "@/api/base44Client";

/**
 * Trigger sitemap regeneration.
 * Can be called manually or by entity automation on blog post creation.
 */
export async function triggerSitemapGeneration() {
  try {
    await base44.functions.invoke("generateSitemap", {});
    console.log("[SEO] Sitemap regeneration triggered");
    return true;
  } catch (error) {
    console.warn("[SEO] Sitemap generation failed:", error?.message);
    return false;
  }
}