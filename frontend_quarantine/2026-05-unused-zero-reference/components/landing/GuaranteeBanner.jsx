import { Shield, CheckCircle2 } from "lucide-react";

export default function GuaranteeBanner() {
  return (
    <section className="py-12 px-6 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 border-y border-primary/15">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Icon & Text */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mt-1">
              <Shield className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">
                30-Day Money-Back Guarantee
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Not seeing results? We'll refund your setup cost, no questions asked. We're confident because our systems work—this guarantee is just our promise to you.
              </p>
            </div>
          </div>

          {/* Trust checkmarks */}
          <div className="flex flex-col gap-2 md:border-l md:border-primary/20 md:pl-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-foreground">Zero risk guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-foreground">No questions asked</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-foreground">30 days to decide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}