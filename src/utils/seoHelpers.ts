/**
 * utils/seoHelpers.ts — #79 dedup
 * Core SEO management is in lib/seo.js (setPageMetadata, setJsonLd).
 * This file retains unique helpers not present in lib/seo.js:
 * - ALT_TEXT registry
 * - unsplashOptimised URL builder
 * - META_DESCRIPTIONS per-page map
 */

// Alt text registry for all images (#19)
export const ALT_TEXT = {
  hero_main: "AI automation dashboard showing lead capture and response statistics for Phoenix local businesses",
  testimonial_maria: "Maria R., owner of Sculpt Med Spa in Scottsdale, AZ",
  testimonial_james: "James T., dentist at Desert Dental Group in Phoenix, AZ",
  testimonial_kayla: "Kayla M., owner of Golden Hour Tanning in Tempe, AZ",
  trust_bar_stripe: "Stripe secure payments",
  trust_bar_twilio: "Twilio SMS infrastructure",
  trust_bar_openai: "OpenAI powered AI",
  industry_med_spa: "Med spa treatment room representing AI automation for aesthetic businesses",
  industry_dental: "Modern dental office representing AI patient communication",
  industry_tanning: "Tanning salon representing AI booking automation",
};

// Unsplash optimised URL builder (#64)
export function unsplashOptimised(photoId: string, width = 800, quality = 80): { src: string; srcSet: string } {
  const base = `https://images.unsplash.com/photo-${photoId}`;
  return {
    src: `${base}?w=${width}&q=${quality}&auto=format&fit=crop`,
    srcSet: [400, 800, 1200].map(w => `${base}?w=${w}&q=${quality}&auto=format&fit=crop ${w}w`).join(", "),
  };
}

// Unique meta descriptions per page (#81)
export const META_DESCRIPTIONS: Record<string, string> = {
  "/": "ClientSurge Systems builds AI-powered lead capture and automation systems for Phoenix and Scottsdale local businesses. Respond to every inquiry in under 60 seconds — automatically.",
  "/pricing": "Simple, transparent pricing for AI automation. Starter from $497/mo — no contracts. Built for med spas, dental offices, and service businesses in Phoenix, AZ.",
  "/store": "Browse AI automation services for local businesses. Instant lead response, missed call text-back, follow-up sequences, and more. Starting at $497/month.",
  "/med-spa": "AI lead capture and automation for med spas in Phoenix and Scottsdale. Respond to Botox and filler inquiries in under 60 seconds, 24/7.",
  "/dental": "AI patient communication for dental offices. Never miss a new patient inquiry — automated responses, booking, and follow-up for Arizona dental practices.",
  "/blog": "AI automation insights and guides for Phoenix and Scottsdale local business owners. Learn how to capture more leads and book more appointments.",
  "/contact": "Contact ClientSurge Systems — AI automation for local businesses in Phoenix, AZ. Talk to Nolan about building your automated lead capture system.",
};