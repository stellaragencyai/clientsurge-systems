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
        <div className="text-center pb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Revenue You're Missing</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Already Have Great Reviews? You're Sitting on Untapped Revenue.
          </h2>
        </div>
      </div>
      <div className="max-w-5xl mx-auto space-y-20">

        {/* --- High-review angle --- */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            {/* Hook stat */}
            <p
              className="font-titles text-lg font-bold mb-6"
              style={{ color: "#0088CC" }}
            >
              78% of leads go cold in under an hour — most of yours already have.
            </p>

            {/* Structured points */}
            <div className="flex flex-col gap-4">
              {[
                {
                  label: "You already have trust.",
                  body: "Strong reviews mean the hard part is done. The problem isn't getting attention — it's failing to capture it when it arrives.",
                },
                {
                  label: "Interest disappears fast.",
                  body: "Every Google search, missed call, and unread form sits outside a system. Without automation, that intent evaporates.",
                },
                {
                  label: "The fix is a pipeline — not more ads.",
                  body: "Routing existing interest into a response sequence is what turns reviews into revenue.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex gap-4"
                  style={{ borderLeft: "2px solid rgba(0,174,239,0.25)", paddingLeft: "16px" }}
                >
                  <div>
                    <p className="font-titles text-sm font-semibold text-foreground mb-1">
                      {item.label}
                    </p>
                    <p className="font-titles text-sm leading-relaxed" style={{ color: "rgba(27,20,13,0.6)" }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Also included callout */}
            <div
              className="mt-6 rounded-2xl px-5 py-4 leading-relaxed"
              style={{
                background: "rgba(0,174,239,0.06)",
                border: "1px solid rgba(0,174,239,0.14)",
              }}
            >
              <p className="font-titles text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#0088CC" }}>
                Also Included
              </p>
              <p className="font-titles text-sm" style={{ color: "rgba(27,20,13,0.72)" }}>
                If your website is missing or not converting, we build a conversion-focused landing page as part of the full system — so every ad click and Google visit has somewhere to land.
              </p>
            </div>
          </div>

          {/* Revenue Recovery Counter Visual */}
          <div className="flex justify-center scale-[1.05] origin-center">
            <RevenueRecoveryCounter />
          </div>
        </div>

      </div>
    </section>
  );
}