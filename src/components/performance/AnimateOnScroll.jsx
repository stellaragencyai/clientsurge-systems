import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

/**
 * AnimateOnScroll — wraps any children with a scroll-triggered fade+slide.
 * Uses IntersectionObserver so animations only play when the element
 * actually enters the viewport. Respects prefers-reduced-motion.
 *
 * Props:
 *   y        — vertical offset to animate from (default: 24)
 *   delay    — stagger delay in seconds (default: 0)
 *   duration — animation duration in seconds (default: 0.52)
 *   once     — only animate once (default: true)
 */
const AnimateOnScroll = memo(function AnimateOnScroll({
  children,
  y = 24,
  delay = 0,
  duration = 0.52,
  className,
  style,
}) {
  const reduceMotion = useReducedMotion();
  const [ref, isVisible] = useIntersectionObserver();

  if (reduceMotion) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
});

export default AnimateOnScroll;