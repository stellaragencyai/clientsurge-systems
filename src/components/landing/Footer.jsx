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
    <footer className="bg-foreground text-background">

      {/* Top CTA strip */}
      <div className="border-b border-background/10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-background/90">Ready to stop losing leads?</p>
            <p className="text-xs text-background/50 mt-0.5">Book a free demo — live in 5–7 days, no contracts.</p>
          </div>
          <a
            href="#book-demo"
            className="shrink-0 inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors"
          >
            Book a Free Demo
          </a>
        </div>
      </div>

      {/* Nav columns — spread full width */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-0">
          {navColumns.map((col) => (
            <div key={col.title} className="flex flex-col items-center text-center">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-6">{col.title}</p>
              <ul className="space-y-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm font-medium text-background/85 hover:text-background transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="max-w-6xl mx-auto px-6 py-6">

          {/* Follow us row — centered */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <p className="text-xs font-semibold text-background/40 uppercase tracking-widest">Follow Us</p>
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full border border-background/15 flex items-center justify-center text-background/50 hover:text-background hover:border-background/40 transition-all"
                >
                  <s.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Bottom legal row */}
          <div className="border-t border-background/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Branding — bottom left, small */}
            <a href="#" className="font-display text-sm font-semibold tracking-tight text-background/50">
              Apex<span className="text-primary">Flow</span>™
            </a>

            {/* Legal links — center */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {legal.map((l) => (
                <a key={l.label} href={l.href} className="text-xs text-background/35 hover:text-background/60 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>

            {/* Copyright + scroll top — right */}
            <div className="flex items-center gap-4">
              <p className="text-xs text-background/35">© {new Date().getFullYear()} ApexFlow. All rights reserved.</p>
              <button
                onClick={scrollTop}
                className="w-7 h-7 rounded-full border border-background/15 flex items-center justify-center text-background/40 hover:text-background hover:border-background/40 transition-all"
                aria-label="Back to top"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </footer>
  );
}