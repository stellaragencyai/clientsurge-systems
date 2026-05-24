import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

/**
 * StaggeredFadeUp - Sequential fade-in with stagger delay
 * Elements slide up from 50px below with blur effect, animating in sequence
 */
export default function StaggeredFadeUp({ 
  children, 
  staggerDelay = 0.1,
  duration = 0.6,
  blur = 7
}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      filter: `blur(${blur}px)`,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="visible"
      animate={inView ? "visible" : "hidden"}
      style={{ width: "100%" }}
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={itemVariants}>{children}</motion.div>
      )}
    </motion.div>
  );
}
