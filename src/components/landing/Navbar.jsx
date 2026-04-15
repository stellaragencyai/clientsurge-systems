import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import LeadCaptureModal from "../forms/LeadCaptureModal";
import ClientLoginModal from "./ClientLoginModal";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Services", href: "#services" },
    { label: "Industries", href: "#industries" },
    { label: "Med Spa", href: "/med-spa", external: true },
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
    <nav className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? "bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-lg"
        : "bg-white/15 backdrop-blur-md border-b border-white/20"
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
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                className="text-base font-medium text-foreground hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ) : (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => scrollTo(e, l.href)}
              className="text-base font-medium text-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </a>
            )
          ))}
        </div>

        {/* CTA — pinned right */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Client Login
          </button>
          <button
            onClick={() => setShowLeadModal(true)}
            style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 14px rgba(120,70,20,0.35)",transition:"box-shadow 0.3s ease, transform 0.3s ease",border:"none",cursor:"pointer"}}
          >
            <span style={{display:"flex",alignItems:"center",gap:"6px",height:"36px",padding:"0 20px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"600",fontSize:"0.875rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book a Demo
            </span>
          </button>
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
          <button onClick={() => { setOpen(false); setShowLoginModal(true); }} className="block text-sm text-muted-foreground hover:text-foreground py-2">
            Client Login
          </button>
          <button onClick={() => { setOpen(false); setShowLeadModal(true); }} style={{display:"block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 14px rgba(120,70,20,0.35)",border:"none",cursor:"pointer",width:"100%"}}>
            <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",height:"40px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"600",fontSize:"0.875rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book a Demo
            </span>
          </button>
        </div>
      )}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={() => {
          setShowLeadModal(false);
          window.location.href = '/book';
        }}
      />
      {showLoginModal && <ClientLoginModal onClose={() => setShowLoginModal(false)} />}
    </nav>
  );
}