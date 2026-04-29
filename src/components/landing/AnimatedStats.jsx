/**
 * Animated Stats
 * Counter animation for statistics as they scroll into view
 */

import { useEffect, useRef, useState } from "react";

function AnimatedCounter({ target, duration = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = Date.now();
          const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            setCount(Math.floor(target * progress));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function AnimatedStats({ stats = [] }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="grid md:grid-cols-3 gap-8 my-12">
      {stats.map((stat, idx) => (
        <div key={idx} className="text-center">
          <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
            {typeof stat.value === "number" ? (
              <>
                <AnimatedCounter target={stat.value} />
                {stat.suffix}
              </>
            ) : (
              stat.value
            )}
          </div>
          <p className="text-muted-foreground text-sm md:text-base">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}