import { useMemo, useState } from "react";

function makeFallbackSvg(label = "ClientSurge Systems") {
  const safeLabel = String(label).replace(/[<&>"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f8fcff"/>
          <stop offset="52%" stop-color="#e6f7ff"/>
          <stop offset="100%" stop-color="#dbeafe"/>
        </linearGradient>
        <linearGradient id="line" x1="0" x2="1">
          <stop offset="0%" stop-color="#0088cc"/>
          <stop offset="100%" stop-color="#00aeef"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bg)"/>
      <circle cx="980" cy="110" r="220" fill="#00aeef" opacity="0.12"/>
      <circle cx="120" cy="760" r="280" fill="#003b8f" opacity="0.1"/>
      <rect x="120" y="140" width="960" height="520" rx="36" fill="#ffffff" opacity="0.78"/>
      <path d="M220 490c92-130 180-88 268-150 96-67 158-158 288-80 70 42 106 120 204 76" fill="none" stroke="url(#line)" stroke-width="18" stroke-linecap="round"/>
      <circle cx="224" cy="490" r="24" fill="#0088cc"/>
      <circle cx="488" cy="340" r="24" fill="#00aeef"/>
      <circle cx="776" cy="260" r="24" fill="#003b8f"/>
      <circle cx="980" cy="336" r="24" fill="#00aeef"/>
      <text x="120" y="720" fill="#05132e" font-family="Arial, sans-serif" font-size="42" font-weight="700">${safeLabel}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function LazyImage({
  src,
  alt,
  className,
  fallbackSrc,
  placeholderSrc,
  width = 800,
  height = 600,
  loading = "lazy",
  decoding = "async",
  ...props
}) {
  const fallbackImage = useMemo(() => fallbackSrc || placeholderSrc || makeFallbackSvg(alt), [alt, fallbackSrc, placeholderSrc]);
  const [imageSrc, setImageSrc] = useState(src || fallbackImage);

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => {
        if (imageSrc !== fallbackImage) setImageSrc(fallbackImage);
      }}
      {...props}
    />
  );
}
