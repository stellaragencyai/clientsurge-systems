import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * LineDrawAccordion - Accordion with line-draw animations & smooth reveal
 * Perfect for FAQs with elegant, modern feel
 */
export default function LineDrawAccordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      className="space-y-3 max-w-3xl"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;

        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="rounded-xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1.5px solid rgba(154,92,46,0.15)",
              boxShadow: "0 4px 14px rgba(111,67,31,0.06)",
            }}
          >
            <motion.button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : idx)}
              whileHover={{
                backgroundColor: "rgba(154,92,46,0.03)",
              }}
              className="w-full px-6 py-5 flex items-center justify-between gap-4 border-none bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
            >
              <div className="text-left flex-1">
                <motion.p
                  className="font-semibold text-foreground text-base"
                  animate={{ color: isOpen ? "#9a5c2e" : "hsl(var(--foreground))" }}
                  transition={{ duration: 0.3 }}
                >
                  {item.question}
                </motion.p>
              </div>

              {/* Animated chevron */}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                style={{ flexShrink: 0 }}
              >
                <ChevronDown className="w-5 h-5 text-primary" />
              </motion.div>
            </motion.button>

            {/* Animated divider line */}
            <motion.div
              className="h-px mx-6"
              initial={{ scaleX: 0, originX: 0 }}
              animate={isOpen ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(154,92,46,0.4) 50%, transparent 100%)",
              }}
            />

            {/* Content reveal */}
            <motion.div
              initial={false}
              animate={isOpen ? { height: "auto" } : { height: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 25,
              }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed"
              >
                {item.answer}
              </motion.div>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}