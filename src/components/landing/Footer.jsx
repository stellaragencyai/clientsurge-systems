import { ArrowUp } from "lucide-react";

const navColumns = [
  {
    title: "Company",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Why ApexFlow", href: "#services" },
      { label: "Book a Demo", href: "#book-demo" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Instant Lead Response", href: "#services" },
      { label: "Automated Follow-Up", href: "#services" },
      { label: "Lead Reactivation", href: "#services" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Med Spas & Clinics", href: "/med-spa" },
      { label: "Real Estate", href: "#industries" },
      { label: "HVAC & Home Services", href: "#industries" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Disclaimer", href: "#" },
    ],
  },
];

const colBgs = [
  "bg-white",
  "bg-secondary/60",
  "bg-white",
  "bg-secondary/60",
];

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="text-foreground border-t border-border">

      {/* Nav columns — alternating background per column */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {navColumns.map((col, idx) => (
          <div key={col.title} className={`${colBgs[idx]} px-8 py-10 flex flex-col items-center text-center border-r last:border-r-0 border-border`}>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-5">{col.title}</p>
            <ul className="space-y-3">
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

      {/* Bottom bar */}
      <div className="bg-foreground/5 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <a href="#" className="font-display text-sm font-semibold tracking-tight text-foreground/60 hover:text-primary transition-colors flex-shrink-0">
            Apex<span className="text-primary">Flow</span>™
          </a>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            © {new Date().getFullYear()} ApexFlow. All rights reserved.
          </p>
          <button
            onClick={scrollTop}
            className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all hover:bg-primary/5 flex-shrink-0"
            aria-label="Back to top"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>

    </footer>
  );
}