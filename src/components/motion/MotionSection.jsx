/**
 * MotionSection Component
 * Wraps all site sections to apply automatic scroll-triggered reveal animations.
 * Ensures consistent "premium cinematic" feel across pages.
 */

import { motion } from "framer-motion";
import { fadeRevealVariants } from "@/components/motion/MotionVariants";
import { useInView } from "@/hooks/useInView";

export default function MotionSection({
  children,
  className = "",
  variant = "fadeReveal",
  delay = 0,
  ...props
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const variants = {
    fadeReveal: fadeRevealVariants,
    // Add more variants as needed
  };

  const selectedVariant = variants[variant] || fadeRevealVariants;

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={selectedVariant}
      transition={{
        ...selectedVariant.visible.transition,
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}