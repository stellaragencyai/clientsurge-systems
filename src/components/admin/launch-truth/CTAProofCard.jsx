import { Globe, CheckCircle2, XCircle } from "lucide-react";

const CTA_ROUTES = [
  { route: "/", page: "Homepage", cta: "Get Your Free Audit", destination: "/contact" },
  { route: "/pricing", page: "Pricing", cta: "Compare Packages / Get Started", destination: "/product-signup or checkout" },
  { route: "/book", page: "Book / Free Audit", cta: "Book Free Audit", destination: "Calendly / booking page" },
  { route: "/store", page: "Store", cta: "Browse All Systems", destination: "Checkout flow" },
  { route: "/contact", page: "Contact", cta: "Contact form submit", destination: "Form submission → confirmation" },
  { route: "/automations", page: "Automations", cta: "Explore Automations", destination: "/store or /contact" },
];

export default function CTAProofCard({ publicSiteData, onRerun, loading }) {
  const ctaChecks = publicSiteData?.cta_checks || [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">C. Public Website / CTA Proof</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Verify each public CTA routes correctly on both desktop and mobile. Take screenshots and record proof notes below.
        Do not mark proof complete until both desktop and mobile are verified.
      </p>

      {/* CTA Proof Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Route / Page</th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground">CTA Label</th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Expected Destination</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground">Desktop</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground">Mobile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CTA_ROUTES.map((row, i) => {
              const check = ctaChecks[i] || {};
              return (
                <tr key={i} className="hover:bg-muted/10">
                  <td className="px-2 py-2">
                    <span className="font-medium text-foreground">{row.route}</span>
                    <span className="text-muted-foreground block text-[10px]">{row.page}</span>
                  </td>
                  <td className="px-2 py-2 text-foreground">{row.cta}</td>
                  <td className="px-2 py-2 text-muted-foreground">{row.destination}</td>
                  <td className="px-2 py-2 text-center">
                    {check.desktop_proof ? <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 mx-auto" />}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {check.mobile_proof ? <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 mx-auto" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Industry pages note */}
      <div className="rounded-lg border border-border bg-muted/10 p-3">
        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Industry Pages (if applicable)</p>
        <p className="text-xs text-muted-foreground">
          Also verify CTAs on industry pages: /roofing, /hvac, /dental, /med-spa, /chiropractic, /contractors, /plumbing, /real-estate, /personal-injury.
          Each should route to /contact, /pricing, or /book.
        </p>
      </div>

      {/* Proof notes */}
      <div className="rounded-lg border border-border bg-muted/10 p-3">
        <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Proof Notes / Screenshot References</p>
        <p className="text-xs text-muted-foreground">
          Record screenshot filenames or notes here (e.g., "homepage-cta-desktop.png — verified 2026-06-25").
          Both desktop and mobile must be verified per route before marking this gate as proof_passed.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {ctaChecks.every(c => c.desktop_proof && c.mobile_proof) ? (
          <span className="text-green-700 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> All CTAs verified on desktop and mobile</span>
        ) : (
          <span className="text-yellow-700 font-semibold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {ctaChecks.filter(c => !c.desktop_proof || !c.mobile_proof).length} CTA(s) still need desktop/mobile verification</span>
        )}
      </div>
    </div>
  );
}