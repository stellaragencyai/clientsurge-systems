import { ArrowUp } from "lucide-react";

const navColumns = [
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
      { label: "How It Works", href: "/how-it-works" },
      { label: "Book a Demo", href: "/book-demo" },
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
      <section className="bg-gradient-to-br from-primary/3 to-primary/5 border-t border-primary/20 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3">
            Ready to Stop Losing Leads?
          </h3>
          <p className="text-muted-foreground text-base mb-8 max-w-xl mx-auto">
            Book a free 30-min demo. No commitment. Live in 5–7 days.
          </p>
          <button
            onClick={() => window.location.href = '/book-demo'}
            style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",transition:"box-shadow 0.3s ease, transform 0.3s ease",border:"none",cursor:"pointer"}} onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
            }} onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)";
            }}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"52px",padding:"0 36px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book Your Free Demo
            </span>
          </button>
        </div>
      </section>

      <footer className="bg-card border-t border-border">

        {/* Footer content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          
          {/* Navigation columns — centered */}
          <div className="flex flex-col md:flex-row justify-center gap-16 md:gap-24 mb-12 text-center">
            {navColumns.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#9a5c2e" }}>{col.title}</p>
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
    </>
  );
}