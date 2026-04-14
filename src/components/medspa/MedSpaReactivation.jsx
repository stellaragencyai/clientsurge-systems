import { ArrowRight, RotateCcw } from "lucide-react";

export default function MedSpaReactivation() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left content */}
          <div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <RotateCcw className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Revenue You Already Have</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              Turn Old Leads Into New Revenue
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-5">
              Most med spas have hundreds — sometimes thousands — of past inquiries that never converted. People who were interested, asked a question, and then went quiet.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              Many of them are still looking. They just haven't heard from you with the right message at the right time. Our re-engagement campaigns bring those leads back into your booking flow — without any extra work on your end.
            </p>
            <div className="p-5 bg-primary/5 border border-primary/15 rounded-xl">
              <p className="text-sm font-semibold text-foreground">
                Easy extra bookings. Zero extra work.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                These are leads you already paid to attract. It's worth re-engaging them.
              </p>
            </div>
          </div>

          {/* Right: image */}
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=85"
              alt="Med spa client returning"
              className="w-full h-96 object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
}