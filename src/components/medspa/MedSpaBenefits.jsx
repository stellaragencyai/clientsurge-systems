const benefits = [
  {
    title: "More Consultations Booked",
    desc: "Leads are followed up instantly and consistently — so more of them convert to scheduled appointments.",
  },
  {
    title: "Fewer Missed Leads",
    desc: "Every form, call, and message gets an immediate response. Nothing slips through.",
  },
  {
    title: "Faster Response Than Your Competitors",
    desc: "Reply in seconds — not hours. First to respond wins the booking.",
  },
  {
    title: "Less Pressure on Your Front Desk",
    desc: "Your team stops chasing leads and starts focusing on clients already in your space.",
  },
  {
    title: "Higher Conversion From the Same Traffic",
    desc: "You're already spending on marketing. We help you convert more of it — without increasing your ad spend.",
  },
  {
    title: "Revenue From Leads You Already Have",
    desc: "We reactivate your existing database. Past inquiries become new appointments.",
  },
];

export default function MedSpaBenefits() {
  return (
    <section className="py-20 md:py-28 px-6 bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold text-[#A8874A] tracking-widest uppercase mb-4">
            What You Get
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1C1C]">
            What Changes When You Automate
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-1 rounded-full bg-[#C9A96E] self-stretch" />
              <div>
                <h3 className="text-sm font-semibold text-[#1C1C1C] mb-1">{b.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}