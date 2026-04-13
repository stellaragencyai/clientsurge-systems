import { Twitter, Linkedin, Instagram, Facebook, ArrowUp, Mail, Phone } from "lucide-react";

const navColumns = [
  {
    title: "Company",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Why ApexFlow", href: "#services" },
      { label: "Industries", href: "#industries" },
      { label: "FAQ", href: "#faq" },
      { label: "Book a Demo", href: "#book-demo" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Instant Lead Response", href: "#services" },
      { label: "Automated Follow-Up", href: "#services" },
      { label: "Missed Call Text-Back", href: "#services" },
      { label: "Booking Flow Automation", href: "#services" },
      { label: "Lead Reactivation", href: "#services" },
      { label: "CRM Pipeline Automation", href: "#services" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Med Spas & Clinics", href: "/med-spa" },
      { label: "Wellness Studios", href: "#industries" },
      { label: "Real Estate", href: "#industries" },
      { label: "HVAC & Home Services", href: "#industries" },
      { label: "Contractors & Trades", href: "#industries" },
      { label: "Local Service Businesses", href: "#industries" },
    ],
  },
];

const socials = [
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
];

const legal = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookie Policy", href: "#" },
  { label: "Disclaimer", href: "#" },
];

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-white text-foreground border-t border-border">

      {/* Nav columns — spread full width */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-0">
          {navColumns.map((col) => (
            <div key={col.title} className="flex flex-col items-center text-center">
              <p className="text-base font-display font-semibold text-primary uppercase tracking-widest mb-4">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar — improved with pinned left/right, separators, gradient */}
      <div className="border-t border-border bg-gradient-to-r from-background via-background/95 to-background">
        <div className="max-w-6xl mx-auto px-6 py-5">

          {/* Bottom legal row — logo pinned left, copyright pinned right */}
          <div className="flex items-center justify-between gap-4">
            {/* Logo pinned far left */}
            <a href="#" className="font-display text-sm font-semibold tracking-tight text-foreground/60 hover:text-primary transition-colors flex-shrink-0">
              Apex<span className="text-primary">Flow</span>™
            </a>

            {/* Legal links — center with separators */}
            <div className="hidden md:flex items-center gap-4 flex-1 px-6 justify-center">
              {legal.map((l, idx) => (
                <div key={l.label} className="flex items-center gap-4">
                  <a href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </a>
                  {idx < legal.length - 1 && <span className="w-px h-3 bg-border/60" />}
                </div>
              ))}
            </div>

            {/* Copyright + scroll top — pinned far right */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <p className="text-xs text-muted-foreground whitespace-nowrap">© {new Date().getFullYear()} ApexFlow. All rights reserved.</p>
              <button
                onClick={scrollTop}
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all hover:bg-primary/5"
                aria-label="Back to top"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Mobile legal links */}
          <div className="md:hidden flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
            {legal.map((l) => (
              <a key={l.label} href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </div>

        </div>
      </div>

    </footer>
  );
}