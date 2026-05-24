/**
 * ogMetaTags.js — #57
 * Sets og:image + og:title + og:description dynamically per page.
 * Import and call setOgMeta() from any page component.
 */

const DEFAULT_OG_IMAGE = "https://clientsurgesystems.com/og-image.png";

export function setOgMeta({ title, description, image, url } = {}) {
  const metas = {
    "og:title":       title || "ClientSurge Systems — AI Automation for Local Businesses",
    "og:description": description || "We build AI-powered lead capture and automation systems for Med Spas, Dental, and Tanning Salons in Phoenix, AZ.",
    "og:image":       image || DEFAULT_OG_IMAGE,
    "og:url":         url || window.location.href,
    "og:type":        "website",
    "twitter:card":   "summary_large_image",
    "twitter:image":  image || DEFAULT_OG_IMAGE,
  };

  Object.entries(metas).forEach(([property, content]) => {
    let el = document.querySelector(`meta[property="${property}"]`) ||
             document.querySelector(`meta[name="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(property.startsWith('twitter') ? 'name' : 'property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  });

  if (title) document.title = title;
}
