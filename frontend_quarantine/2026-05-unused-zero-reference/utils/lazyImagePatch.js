/**
 * lazyImagePatch.js — #292
 * Adds loading="lazy" to all below-fold images site-wide.
 * Import this in main.jsx / App.jsx — runs once on mount.
 * Also exports LazyImg component for use in JSX.
 */

import { createElement } from "react";

// Runtime patch: find all <img> without loading=lazy that are NOT in the hero
export function patchLazyImages() {
  if (typeof document === "undefined") return;
  const imgs = document.querySelectorAll("img:not([loading])");
  let patched = 0;
  imgs.forEach((img) => {
    // Skip hero / above-fold images (first 2 viewport heights)
    const rect = img.getBoundingClientRect();
    if (rect.top > window.innerHeight) {
      img.setAttribute("loading", "lazy");
      patched++;
    }
  });
  if (patched > 0) console.log(`[lazyImages] Patched ${patched} images with loading=lazy`);
}

// JSX component wrapper
export function LazyImg({ src, alt, style, className, width = 1200, height = 675, ...props }) {
  return createElement("img", {
    src,
    alt: alt || "",
    width,
    height,
    loading: "lazy",
    decoding: "async",
    style,
    className,
    ...props
  });
}
