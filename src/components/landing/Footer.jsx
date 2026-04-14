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

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-foreground text-background">

      {/* Nav columns */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {navColumns.map((col) => (
            <div key={col.title} className="flex flex-col items-center text-center">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-5">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-xs font-medium text-background/50 hover:text-background transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row inside footer */}
        <div className="mt-10 pt-6 border-t border-background/10 flex items-center justify-between gap-4">
          <a href="#" className="font-display text-sm font-semibold text-background/40 hover:text-primary transition-colors">
            Apex<span className="text-primary">Flow</span>™
          </a>
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} ApexFlow. All rights reserved.
          </p>
          <button
            onClick={scrollTop}
            className="w-7 h-7 rounded-full border border-background/20 flex items-center justify-center text-background/40 hover:text-background hover:border-background/50 transition-all"
            aria-label="Back to top"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>

    </footer>
  );
}