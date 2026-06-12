/**
 * Global Motion Configuration
 * Unified easing curves, durations, and animation presets for the entire app.
 * Ensures consistent "premium cinematic" feel across all pages.
 */

export const MOTION_CONFIG = {
  // Premium easing curve (used across all animations)
  easing: {
    premium: [0.22, 1, 0.36, 1], // cubic-bezier(0.22, 1, 0.36, 1)
    smooth: [0.4, 0, 0.2, 1],     // ease-in-out
    snappy: [0.23, 1, 0.32, 1],   // bouncy
  },

  // Standard durations
  duration: {
    fast: 0.3,
    normal: 0.5,
    slow: 0.8,
    verySlow: 1.2,
  },

  // Stagger delays for sequential animations
  stagger: {
    item: 0.08,      // Per-item stagger (cards, grid items)
    section: 0.15,   // Section-level stagger
  },

  // Scroll reveal thresholds
  scrollReveal: {
    amount: 0.3, // How much of the element needs to be in view (0-1)
  },
};

/**
 * Transition objects for Framer Motion
 */
export const TRANSITIONS = {
  fadeReveal: {
    duration: MOTION_CONFIG.duration.normal,
    ease: MOTION_CONFIG.easing.premium,
  },
  staggerContainer: {
    duration: MOTION_CONFIG.duration.slow,
    ease: MOTION_CONFIG.easing.premium,
    staggerChildren: MOTION_CONFIG.stagger.item,
  },
  smoothMorph: {
    type: "spring",
    stiffness: 300,
    damping: 25,
  },
};