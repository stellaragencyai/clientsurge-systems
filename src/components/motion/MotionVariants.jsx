/**
 * Reusable Framer Motion Variants
 * All animation presets used across the app.
 */

import { MOTION_CONFIG, TRANSITIONS } from "@/lib/motionConfig";

/**
 * FadeReveal: Smooth fade-in with slight upward movement
 */
export const fadeRevealVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITIONS.fadeReveal,
  },
};

/**
 * StaggerContainer: Parent wrapper for staggered children
 */
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: TRANSITIONS.staggerContainer,
  },
};

/**
 * StaggerItem: Child variant (used within staggerContainer)
 */
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_CONFIG.duration.normal,
      ease: MOTION_CONFIG.easing.premium,
    },
  },
};

/**
 * SmoothMorph: Hover/interaction scale effect
 */
export const smoothMorphVariants = {
  rest: {
    scale: 1,
    transition: TRANSITIONS.smoothMorph,
  },
  hover: {
    scale: 1.02,
    transition: TRANSITIONS.smoothMorph,
  },
};

/**
 * DataFlow: SVG stroke animation (for path drawing)
 */
export const dataFlowVariants = {
  hidden: {
    strokeDashoffset: 1000,
  },
  visible: {
    strokeDashoffset: 0,
    transition: {
      duration: MOTION_CONFIG.duration.verySlow,
      ease: MOTION_CONFIG.easing.smooth,
    },
  },
};

/**
 * SkeletonPulse: Loading skeleton animation
 */
export const skeletonPulseVariants = {
  pulse: {
    backgroundPosition: ["0% 0%", "100% 100%"],
    transition: {
      duration: 1.5,
      ease: MOTION_CONFIG.easing.smooth,
      repeat: Infinity,
    },
  },
};