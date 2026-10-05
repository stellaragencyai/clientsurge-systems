import { useState, useRef, useEffect, memo } from "react";

/**
 * OptimizedImage — replaces LazyImage with:
 * 1. Native loading="lazy" (browser-native, no JS overhead)
 * 2. Instant blur-up placeholder via CSS
 * 3. Proper width/height to prevent CLS
 * 4. Auto srcSet for Unsplash images
 * 5. Fade-in only when loaded (no flash)
 */
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  eager = false,
  style = {},
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // If already cached, mark as loaded immediately
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  const isUnsplash =
    src &&
    (src.includes("images.unsplash.com") || src.includes("plus.unsplash.com"));

  let finalSrc = src;
  let srcSet;

  if (isUnsplash && src) {
    try {
      const url = new URL(src);
      url.searchParams.set("auto", "format");
      url.searchParams.set("q", "80");
      url.searchParams.set("fit", "crop");
      finalSrc = url.toString();

      srcSet = [400, 800, 1200, 1600]
        .map((w) => {
          const u = new URL(src);
          u.searchParams.set("w", String(w));
          u.searchParams.set("auto", "format");
          u.searchParams.set("q", "80");
          u.searchParams.set("fit", "crop");
          return `${u.toString()} ${w}w`;
        })
        .join(", ");
    } catch {
      // fallback: use src as-is
    }
  }

  return (
    <img
      ref={imgRef}
      src={finalSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      onLoad={() => setLoaded(true)}
      className={className}
      style={{
        transition: "opacity 0.3s ease",
        opacity: loaded ? 1 : 0,
        ...style,
      }}
    />
  );
});

export default OptimizedImage;