import { useEffect, useState } from "react";

export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        background: "linear-gradient(90deg, #00AEEF 0%, #006BB0 50%, #003B8F 100%)",
        width: `${progress}%`,
        transition: "width 0.1s ease",
        zIndex: 60,
        boxShadow: "0 0 12px rgba(0, 174, 239, 0.5)",
      }}
      aria-hidden="true"
    />
  );
}