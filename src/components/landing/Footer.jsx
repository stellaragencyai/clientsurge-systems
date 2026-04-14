import { ArrowUp } from "lucide-react";

const navColumns = [
  {
    title: "What We Help You Do",
    links: [
      { label: "Capture leads instantly", href: "#how-it-works" },
      { label: "Convert more inquiries", href: "#services" },
      { label: "Recover missed calls", href: "#services" },
      { label: "Automate follow-up", href: "#services" },
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
    title: "Learn More",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Why ApexFlow", href: "#services" },
      { label: "Book a Demo", href: "#book-demo" },
    ],
  },
  {
    title: "Legal & Policies",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
];

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* Final CTA Section */}
      <section className="bg-card border-t border-border py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Ready to stop losing leads?
          </h3>
          <button
            onClick={() => window.location.href = '/start'}
            style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",transition:"box-shadow 0.3s ease, transform 0.3s ease",border:"none",cursor:"pointer"}} onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
            }} onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)";
            }}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 32px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book a 10-Min Demo
            </span>
          </button>
        </div>
      </section>

      <footer className="bg-card border-t border-border">

        {/* Footer content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          
          {/* Top section: Brand + Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            {/* Brand column */}
            <div className="md:col-span-1">
              <a href="#" className="font-display text-lg font-semibold text-foreground hover:text-primary transition-colors block mb-2">
                Apex<span className="text-primary">Flow</span>
              </a>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automation systems built to increase bookings.
              </p>
              <button
                onClick={scrollTop}
                className="mt-4 w-8 h-8 rounded-full border border-border bg-background hover:border-primary hover:bg-primary/5 flex items-center justify-center text-foreground transition-all"
                aria-label="Back to top"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation columns */}
            {navColumns.map((col) => (
              <div key={col.title} className="md:col-span-1">
                <p className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">{col.title}</p>
                <ul className="space-y-2.5">
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

          {/* Bottom section: Trust signals + Copyright */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-muted-foreground text-center md:text-left">
              Built for service businesses • Designed for real results • No complex setup required
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ApexFlow. All rights reserved.
            </p>
          </div>
        </div>

    </footer>
    </>
  );
}