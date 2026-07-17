import { useEffect } from "react";
import Navbar from "./Navbar";
import "./premium-navbar.css";
import "./premium-navbar-polish.css";

const SCROLLED_CLASS = "cs-premium-nav-scrolled";

export default function PremiumNavbar() {
  useEffect(() => {
    const root = document.documentElement;
    let frameId = null;

    const syncScrollState = () => {
      frameId = null;
      root.classList.toggle(SCROLLED_CLASS, window.scrollY > 48);
    };

    const onScroll = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(syncScrollState);
    };

    syncScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      root.classList.remove(SCROLLED_CLASS);
    };
  }, []);

  return <Navbar />;
}
