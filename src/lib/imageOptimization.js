const UNSPLASH_HOSTS = new Set(["images.unsplash.com", "plus.unsplash.com"]);
const DEFAULT_WIDTHS = [640, 960, 1200, 1600];
const DEFAULT_QUALITY = 80;

export function optimizeImageUrl(src, { width, quality = DEFAULT_QUALITY, fit = "crop" } = {}) {
  if (!src || typeof src !== "string") return src;

  try {
    const url = new URL(src);
    if (!UNSPLASH_HOSTS.has(url.hostname)) return src;

    if (width) url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality));
    if (fit) url.searchParams.set("fit", fit);
    url.searchParams.set("auto", "format");

    return url.toString();
  } catch {
    return src;
  }
}

export function buildResponsiveImageProps(src, { widths = DEFAULT_WIDTHS, quality, fit, sizes } = {}) {
  const srcSet = widths
    .map((width) => `${optimizeImageUrl(src, { width, quality, fit })} ${width}w`)
    .join(", ");

  return {
    src: optimizeImageUrl(src, { width: widths[Math.min(1, widths.length - 1)], quality, fit }),
    srcSet,
    sizes: sizes || "(max-width: 768px) 100vw, 50vw",
  };
}
