import { motion } from "framer-motion";

/**
 * GlowRevealProducts - Product cards with staggered scale + glow reveal animations
 * Perfect for showcasing products/services with premium feel
 */
export default function GlowRevealProducts({ products = [] }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      filter: "blur(10px)",
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 25,
        duration: 0.7,
      },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {products.map((product, idx) => (
        <motion.div
          key={idx}
          variants={itemVariants}
          whileHover={{
            scale: 1.05,
            y: -6,
            boxShadow: "0 0 0 1px rgba(200,150,92,0.4), 0 0 40px rgba(200,150,92,0.25), inset 0 0 20px rgba(200,150,92,0.1)",
          }}
          whileTap={{ scale: 0.98 }}
          className="group relative rounded-2xl overflow-hidden cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,245,239,0.9) 100%)",
            border: "1.5px solid rgba(154,92,46,0.15)",
            boxShadow: "0 8px 28px rgba(111,67,31,0.09)",
            transition: "all 0.3s ease",
          }}
        >
          {/* Glow effect background */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle at center, rgba(200,150,92,0.2) 0%, transparent 70%)",
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-6">
            {product.icon && (
              <motion.div
                initial={{ opacity: 0, rotate: -20 }}
                whileInView={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.2 }}
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
              >
                {product.icon}
              </motion.div>
            )}

            <motion.h3
              className="text-lg font-bold text-foreground mb-2"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {product.title}
            </motion.h3>

            <motion.p
              className="text-sm text-muted-foreground leading-relaxed mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {product.description}
            </motion.p>

            {/* Animated underline */}
            <motion.div
              className="h-0.5 bg-gradient-to-r from-primary to-primary/40 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />

            {product.cta && (
              <motion.div
                className="mt-4 text-xs font-semibold text-primary"
                initial={{ opacity: 0, y: 5 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {product.cta} →
              </motion.div>
            )}
          </div>

          {/* Corner accent */}
          <motion.div
            className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-primary/10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}