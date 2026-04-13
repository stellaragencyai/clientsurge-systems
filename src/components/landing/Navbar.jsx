import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-background/85 backdrop-blur-lg border-b border-border/50 shadow-sm"
        : "bg-transparent border-b border-transparent"
    }`}>
      <div className="w-full px-8 h-16 flex items-center justify-between">
        {/* Logo — pinned left */}
        <a href="#" className="font-display text-xl font-semibold tracking-tight text-foreground shrink-0">
          Apex<span className="text-primary">Flow</span>
        </a>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA — pinned right */}
        <div className="hidden md:block shrink-0">
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
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a href="#book-demo" onClick={() => setOpen(false)}>
            <Button className="rounded-full w-full text-sm font-medium">
              Book a Demo
            </Button>
          </a>
        </div>
      )}
    </nav>
  );
}