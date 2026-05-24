import { motion } from "framer-motion";

/**
 * FloatingStatCards - Animated stat display with floating motion & morphing backgrounds
 * Perfect for displaying key metrics with visual polish
 */
export default function FloatingStatCards({ stats = [] }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          variants={itemVariants}
          whileHover={{ y: -8, scale: 1.02 }}
          className="relative rounded-2xl overflow-hidden p-6"
          style={{
            background: stat.gradient || "linear-gradient(135deg, rgba(154,92,46,0.1) 0%, rgba(200,150,92,0.05) 100%)",
            border: "1.5px solid rgba(154,92,46,0.2)",
            boxShadow: "0 10px 32px rgba(111,67,31,0.08)",
          }}
        >
          {/* Morphing animated background blob */}
          <motion.div
            className="absolute inset-0 opacity-30 blur-2xl"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(200,150,92,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(154,92,46,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(200,150,92,0.4) 0%, transparent 50%)",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <p className="text-xs font-bold text-primary tracking-[0.2em] uppercase mb-3">
              {stat.label}
            </p>
            <motion.p
              className="text-3xl md:text-4xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {stat.value}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
          </div>

          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
            whileHover={{ opacity: 0.1 }}
            transition={{ duration: 0.6 }}
            style={{ pointerEvents: "none" }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}