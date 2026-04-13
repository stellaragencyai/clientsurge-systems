import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Services", href: "#services" },
    { label: "Industries", href: "#industries" },
    { label: "FAQ", href: "#faq" },
  ];

  const scrollTo = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (!el) return;
    const start = window.scrollY;
    const target = el.getBoundingClientRect().top + window.scrollY - 64;
    const distance = target - start;
    const duration = 900;
    let startTime = null;
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, start + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-background/85 backdrop-blur-lg border-b border-border/50 shadow-sm"
        : "bg-transparent border-b border-transparent"
    }`}>
      <div className="w-full px-8 h-16 flex items-center justify-between">
        {/* Logo — pinned left */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            const start = window.scrollY;
            const distance = -start;
            const duration = 900;
            let startTime = null;
            const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const step = (timestamp) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              window.scrollTo(0, start + distance * ease(progress));
              if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }}
          className="font-display text-2xl font-semibold tracking-tight text-foreground shrink-0 bg-none border-none cursor-pointer hover:text-primary transition-colors"
          style={{ fontSize: "1.75rem" }}
        >
          Apex<span className="text-primary">Flow</span>
        </button>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => scrollTo(e, l.href)}
              className="text-base font-medium text-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA — pinned right */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/admin")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Login
          </button>
          <a href="#book-demo">
            <Button className="rounded-full px-6 text-sm font-medium">
              Book a Demo
            </Button>
          </a>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background border-b border-border px-6 pb-6 pt-2 space-y-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block text-sm text-muted-foreground hover:text-foreground"
              onClick={(e) => scrollTo(e, l.href)}
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => navigate("/admin")}
            className="block w-full text-left text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            Login
          </button>
          <a href="#book-demo" onClick={(e) => scrollTo(e, "#book-demo")}>
            <Button className="rounded-full w-full text-sm font-medium">
              Book a Demo
            </Button>
          </a>
        </div>
      )}
    </nav>
  );
}