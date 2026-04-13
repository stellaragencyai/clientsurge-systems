export default function MedSpaPain() {
  return (
    <section className="py-20 md:py-28 px-6 bg-[#1C1C1C]">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-[#C9A96E] tracking-widest uppercase mb-6">
          The Cost of Delay
        </p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-snug mb-8">
          Every Delayed Response
          <br />
          <span className="text-[#C9A96E]">Costs You a Client</span>
        </h2>

        <div className="space-y-5 text-left max-w-xl mx-auto">
          {[
            {
              stat: "78%",
              text: "of clients book with the first business to respond — not the best one.",
            },
            {
              stat: "10×",
              text: "higher conversion rate when you reply within 5 minutes vs. 60 minutes.",
            },
            {
              stat: "$0",
              text: "of recovered revenue from leads that went cold — because no one followed up.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10"
            >
              <span className="flex-shrink-0 font-display text-3xl font-semibold text-[#C9A96E] leading-none">
                {item.stat}
              </span>
              <p className="text-[#D6D6D6] text-sm leading-relaxed mt-1">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[#9B9B9B] text-base leading-relaxed">
          Your competitors are getting faster. If your response isn't immediate,
          the lead goes elsewhere — and they may never come back.
        </p>
      </div>
    </section>
  );
}