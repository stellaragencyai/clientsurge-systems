import { useEffect, useState, useRef } from "react";

export default function TypingEffect({ text, speed = 50, className = "", style = {} }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const elementRef = useRef(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasTriggered.current) {
        hasTriggered.current = true;
        let index = 0;
        const interval = setInterval(() => {
          if (index <= text.length) {
            setDisplayedText(text.substring(0, index));
            index++;
          } else {
            setIsComplete(true);
            clearInterval(interval);
          }
        }, speed);
      }
    }, { threshold: 0.5 });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [text, speed]);

  return (
    <span ref={elementRef} className={className} style={style}>
      {displayedText}
      {!isComplete && <span style={{ animation: "blink 0.7s infinite" }}>|</span>}
      <style>{`@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}`}</style>
    </span>
  );
}