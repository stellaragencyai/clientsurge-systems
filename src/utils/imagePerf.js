/**
 * imagePerf.js — #6 #7
 * Utilities for image performance optimization.
 * #6: LazyImage component with explicit width/height
 * #7: injectHeroPreload() — adds <link rel="preload"> for hero image
 */

// #7: Call once in index.html or App.jsx useEffect
export function injectHeroPreload(heroSrc) {
  if (!heroSrc) return;
  const existing = document.querySelector('link[data-hero-preload]');
  if (existing) return; // already injected
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroSrc;
  link.setAttribute('data-hero-preload', 'true');
  document.head.prepend(link); // prepend = higher priority
}

// #6: LazyImage — always use below the fold
export function LazyImage({ src, alt, width, height, className, style }) {
  return (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      decoding="async"
      width={width}
      height={height}
      className={className}
      style={{ ...style, maxWidth: "100%", height: "auto" }}
    />
  );
}
