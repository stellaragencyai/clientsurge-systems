/**
 * Dark Mode Toggle Component
 * Fixes Audit Issue #58: No dark mode toggle in admin dashboard
 *
 * Uses next-themes to manage theme state.
 */

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "cs-theme";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(stored || (prefersDark ? "dark" : "light"));
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      if (theme === "dark") {
        document.documentElement.setAttribute("data-client-surge-dark-disabled", "false");
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.removeAttribute("data-client-surge-dark-disabled");
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, [theme, mounted]);

  const toggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}