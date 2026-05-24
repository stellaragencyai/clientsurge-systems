import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  const springProgress = useSpring(progress, { stiffness: 200, damping: 30, mass: 0.5 });

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 h-1 z-[49]"
      style={{
        background: "linear-gradient(90deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
        width: springProgress,
        scaleX: 1,
        transformOrigin: "left",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ opacity: { duration: 0.3 } }}
    />
  );
}
