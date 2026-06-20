import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const STEPS = [
  "Browse Systems",
  "Choose Package",
  "Guided AI Intake",
  "Remote Setup",
  "Testing",
  "Launch",
];

export default function HomepageHowItWorksTeaser() {
  return (
    <section className="py-16 px-6 bg-muted/30 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <p className="cs-eyebrow mb-2">How It Works</p>
          <h2 className="font-titles text-foreground text-2xl md:text-3xl font-bold">
            From Choosing a System to Going Live
          </h2>
        </div>

        {/* Process Steps */}
        <div className="flex flex-wrap items-center justify-center gap-0 mb-8">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 px-3 py-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #0088CC, #005691)" }}
                >
                  {i + 1}
                </div>
                <span className="text-xs font-semibold text-foreground text-center whitespace-nowrap">{step}</span>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mb-4 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto mb-6">
          Every system is remotely installed, configured, tested, and launched for your business — no technical setup required on your end.
        </p>

        <div className="text-center">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            See How It Works <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}