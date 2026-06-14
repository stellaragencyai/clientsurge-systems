/**
 * Optimized image component with aspect ratio locking to prevent CLS
 * Prevents Cumulative Layout Shift during lazy loading
 */

export default function OptimizedImage({
  src,
  alt,
  width = 600,
  height = 400,
  className = "",
  style = {},
  srcSet,
  sizes,
  loading = "lazy",
  decoding = "async",
  ...props
}) {
  const aspectRatio = (height / width) * 100;
  
  return (
    <div style={{ paddingBottom: `${aspectRatio}%`, position: "relative", ...style }}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        srcSet={srcSet}
        sizes={sizes}
        loading={loading}
        decoding={decoding}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        {...props}
      />
    </div>
  );
}