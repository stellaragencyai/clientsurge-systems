import { useEffect, useState } from "react";

export default function ParallaxHeadline({ text, className = "", style = {} }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * 0.5);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const words = text.split(" ");

  return (
    <h1 className={className} style={style}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            transform: `translateY(${offset * (0.3 + i * 0.15)}px)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          {word}{" "}
        </span>
      ))}
    </h1>
  );
}