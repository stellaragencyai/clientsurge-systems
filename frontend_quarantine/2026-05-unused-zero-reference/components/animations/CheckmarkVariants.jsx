import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

/**
 * Variant 1: Sequential Pop + Bounce
 * Checkmarks pop in sequentially with a playful bounce effect
 */
export function CheckmarkVariant1({ items = [], delay = 0 }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
        duration: 0.6,
      },
    },
  };

  return (
    <motion.div
      className="flex flex-wrap gap-3 justify-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          variants={itemVariants}
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: "rgba(34,197,89,0.1)",
            border: "1px solid rgba(34,197,89,0.3)",
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium text-green-700">{item}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Variant 2: SVG Draw + Glow
 * Checkmarks are drawn with an animated path, then glow
 */
export function CheckmarkVariant2({ items = [], delay = 0 }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="flex flex-wrap gap-3 justify-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          variants={itemVariants}
          whileHover={{
            boxShadow: "0 0 0 8px rgba(34,197,89,0.15), 0 0 20px rgba(34,197,89,0.3)",
            scale: 1.05,
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full cursor-default transition-all"
          style={{
            background: "rgba(34,197,89,0.1)",
            border: "1px solid rgba(34,197,89,0.3)",
          }}
        >
          {/* Animated checkmark icon */}
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            initial="hidden"
            animate="visible"
          >
            <motion.circle
              cx="8"
              cy="8"
              r="7"
              stroke="#22c55e"
              strokeWidth="1.5"
              fill="none"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { duration: 0.5, delay: idx * 0.12 + delay },
                },
              }}
            />
            <motion.path
              d="M5 8L7 10L11 6"
              stroke="#22c55e"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { duration: 0.4, delay: idx * 0.12 + 0.1 + delay },
                },
              }}
            />
          </motion.svg>

          <span className="text-xs font-medium text-green-700">{item}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Variant 3: Fade + Scale + Icon Spin
 * Checkmarks fade in with scale and icon spins for a premium feel
 */
export function CheckmarkVariant3({ items = [], delay = 0 }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      scale: 0.6,
      filter: "blur(8px)",
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 140,
        damping: 20,
        duration: 0.7,
      },
    },
  };

  return (
    <motion.div
      className="flex flex-wrap gap-3 justify-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          variants={itemVariants}
          whileHover={{ scale: 1.08, y: -2 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full group cursor-default transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,89,0.15) 0%, rgba(34,197,89,0.08) 100%)",
            border: "1.5px solid rgba(34,197,89,0.3)",
            boxShadow: "0 4px 12px rgba(34,197,89,0.1)",
          }}
        >
          {/* Spinning checkmark */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              delay: idx * 0.1 + delay + 0.3,
              ease: "easeInOut",
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-green-500 group-hover:text-green-600 transition-colors" />
          </motion.div>

          <span className="text-xs font-medium text-green-700 group-hover:text-green-800 transition-colors">
            {item}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Export all variants as an object for easy selection
export const CheckmarkAnimations = {
  variant1: CheckmarkVariant1,
  variant2: CheckmarkVariant2,
  variant3: CheckmarkVariant3,
};