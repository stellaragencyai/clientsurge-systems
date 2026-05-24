/**
 * DarkModeToggle.jsx — #26
 * ☀️/🌙 toggle for Navbar desktop + mobile menu.
 * Persists preference to localStorage.
 */
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle({ compact = false }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("cs_theme") !== "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("cs-light", !dark);
    localStorage.setItem("cs_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 9999,
        padding: compact ? "5px 8px" : "6px 12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 5,
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
        fontWeight: 600,
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
    >
      {dark
        ? <><Sun style={{ width: 13, height: 13 }} />{!compact && " Light"}</>
        : <><Moon style={{ width: 13, height: 13 }} />{!compact && " Dark"}</>
      }
    </button>
  );
}
