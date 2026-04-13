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

      {/* Main footer grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Brand column — spans 2 */}
          <div className="lg:col-span-2 space-y-5">
            <a href="#" className="font-display text-2xl font-semibold tracking-tight text-background">
              Apex<span className="text-primary">Flow</span>
            </a>
            <p className="text-sm text-background/55 leading-relaxed max-w-xs">
              ApexFlow builds done-for-you automation systems that help appointment-based businesses respond faster, follow up smarter, and book more clients — without adding headcount.
            </p>

            {/* Contact */}
            <div className="space-y-2">
              <a href="mailto:hello@apexflow.io" className="flex items-center gap-2 text-xs text-background/50 hover:text-background transition-colors">
                <Mail className="w-3.5 h-3.5" />
                hello@apexflow.io
              </a>
              <a href="tel:+18005550000" className="flex items-center gap-2 text-xs text-background/50 hover:text-background transition-colors">
                <Phone className="w-3.5 h-3.5" />
                +1 (800) 555-0000
              </a>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
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

          {/* Nav columns */}
          {navColumns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold text-background/40 uppercase tracking-widest mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-background/60 hover:text-background transition-colors"
                    >
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
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/35">
            © {new Date().getFullYear()} ApexFlow™. All rights reserved. ApexFlow is a registered trademark.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {legal.map((l) => (
              <a key={l.label} href={l.href} className="text-xs text-background/35 hover:text-background/60 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <button
            onClick={scrollTop}
            className="w-8 h-8 rounded-full border border-background/15 flex items-center justify-center text-background/40 hover:text-background hover:border-background/40 transition-all"
            aria-label="Back to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </footer>
  );
}