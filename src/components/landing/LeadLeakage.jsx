import { useDemoBooking } from "./DemoBookingContext";
import RevenueRecoveryCounter from "./visuals/RevenueRecoveryCounter";

export default function LeadLeakage() {
  const demoBooking = useDemoBooking();

  return (
    <section
      id="lead-leakage"
      className="pt-16 md:pt-28 pb-32 md:pb-40 px-6"
      style={{
        background: "#ffffff",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center pt-10 pb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Revenue You're Missing</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Already Have Great Reviews?{" "}
            <span style={{ background: "linear-gradient(135deg, #7a3f1a 0%, #c8965c 52%, #9a5c2e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              You're Sitting on Untapped Revenue.
            </span>
          </h2>
        </div>
      </div>
      <div className="max-w-5xl mx-auto space-y-20">

        {/* --- High-review angle --- */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="mt-5 text-muted-foreground text-base leading-relaxed">
              A business with strong reviews already has trust. The opportunity is not getting more attention — it is capturing and converting the attention you already have.
            </p>
            <p className="mt-4 text-muted-foreground text-base leading-relaxed">
              When someone finds you on Google, checks your reviews, calls you, messages you, or clicks your page — that interest should enter a system automatically. Right now, most of it disappears.
            </p>
            <div
              className="mt-6 rounded-2xl px-5 py-4 text-sm text-foreground/80 leading-relaxed"
              style={{
                background: "rgba(154,92,46,0.06)",
                border: "1px solid rgba(154,92,46,0.14)",
              }}
            >
              <span className="font-semibold text-foreground">On landing pages:</span>{" "}
              If your website is missing, weak, or not converting, we can include a conversion-focused landing page as part of the full system — so every ad click and Google visit has somewhere to land and something to do.
            </div>
          </div>

          {/* Revenue Recovery Counter Visual */}
          <div className="flex justify-center scale-200 origin-center">
            <RevenueRecoveryCounter />
          </div>
        </div>

      </div>
    </section>
  );
}