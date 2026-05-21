import { useState, useEffect } from 'react';

export default function LazyImage({ src, alt, className, placeholderSrc, width = 1200, height = 675 }) {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || null);
  const [imageRef, setImageRef] = useState(null);

  useEffect(() => {
    let observer;

    if (imageRef && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(imageRef);
    } else {
      // Fallback for older browsers
      setImageSrc(src);
    }

    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, src]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
    />
  );
}
