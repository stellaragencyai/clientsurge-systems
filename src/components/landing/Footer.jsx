import { ArrowUp } from "lucide-react";

const navColumns = [
  {
    title: "Industries",
    links: [
      { label: "Med Spas & Clinics", href: "/med-spa" },
      { label: "Real Estate", href: "/#industries" },
      { label: "HVAC & Home Services", href: "/#industries" },
    ],
  },
  {
    title: "Learn More",
    links: [
      { label: "How It Works", href: "/#how-it-works-section" },
      { label: "Book a Demo", href: "/book" },
    ],
  },
  {
    title: "Legal & Policies",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
];

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-card border-t border-border">

        {/* Footer content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          
          {/* Navigation columns — centered */}
          <div className="flex flex-col md:flex-row justify-center gap-20 md:gap-36 mb-12 text-center">
            {navColumns.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#9a5c2e" }}>{col.title}</p>
                <ul className="space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-8" />

          {/* Bottom section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-muted-foreground text-center md:text-left">
              ClientSurge Systems · Phoenix, Arizona · <a href="mailto:system@clientsurgesystems.com" className="hover:text-primary transition-colors">system@clientsurgesystems.com</a>
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ClientSurge Systems. All rights reserved.
            </p>
            <button
              onClick={scrollTop}
              className="w-8 h-8 rounded-full border border-border bg-background hover:border-primary hover:bg-primary/5 flex items-center justify-center text-foreground transition-all"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

    </footer>
  );
}