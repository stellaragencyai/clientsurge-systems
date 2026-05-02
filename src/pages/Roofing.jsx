import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider, useDemoBooking } from "@/components/landing/DemoBookingContext";
import IndustryHero from "@/components/industry/IndustryHero";
import IndustryPainBar from "@/components/industry/IndustryPainBar";
import IndustrySMSDemo from "@/components/industry/IndustrySMSDemo";
import IndustryResults from "@/components/industry/IndustryResults";
import IndustryFAQ from "@/components/industry/IndustryFAQ";

const PAIN_STATS = [
  { icon: "🌩️", value: "70%", label: "Of storm leads never get a second follow-up", sub: "They go cold while you're busy on active jobs" },
  { icon: "💸", value: "$14,000", label: "Average roofing replacement job value", sub: "Every dead lead list is a goldmine sitting untapped" },
  { icon: "🔁", value: "56%", label: "Of old leads convert when properly re-engaged", sub: "The money is already in your database" },
];

const SMS_MESSAGES = [
  { from: "system", text: "Hey Tom — this is Southwest Roofing. We came out and did a free inspection after the hailstorm last month. Insurance claims in your area are moving fast right now. Did you end up filing a claim?", delay: 1000 },
  { from: "lead",   text: "Yeah we filed but haven't heard back from the adjuster yet", delay: 2400 },
  { from: "system", text: "Perfect timing — we work directly with adjusters and can actually help speed that process up at no cost to you. We've helped 40+ homeowners in your zip code get their claims approved this season. Want us to stop by this week? Takes 20 minutes and could put thousands back in your pocket.", delay: 1600 },
  { from: "lead",   text: "Sure that would be great actually", delay: 1800 },
  { from: "system", text: "Awesome! I'll have our project manager reach out in the next hour to find a time that works. You won't pay a dime unless we do the work — and only after insurance approves. Talk soon! 🏠", delay: 1400 },
];

const METRICS = [
  { value: "56%", label: "Of reactivated leads re-engage within 48 hours" },
  { value: "$160K+", label: "Revenue booked from a single reactivation campaign" },
  { value: "0", label: "Hours of manual follow-up required from your team" },
];

const TESTIMONIAL = {
  quote: "We ran reactivation on 200 old storm leads from last season. Booked 11 jobs in one week. That's over $160,000 in contracts from leads we thought were dead. I was floored.",
  name: "Marcus R.",
  business: "StormPro Roofing, Dallas TX",
};

const FAQS = [
  { q: "What if the leads are from 6+ months ago?", a: "That's actually our sweet spot. The reactivation messages are written to acknowledge the time gap naturally — referencing the original storm, insurance timelines, or seasonal urgency. Old leads often respond better because the timing now aligns with when they're ready to move forward." },
  { q: "Do we need a list of leads to get started?", a: "Any list works — spreadsheet, CRM export, even a notes app. We import your existing leads and start the reactivation campaign during setup. We can also run it against any new leads you capture going forward." },
  { q: "Will this work for insurance vs. non-insurance jobs?", a: "Yes. We configure separate message flows for insurance replacement jobs (focused on adjuster coordination and claims) vs. standard repair or replacement jobs (focused on urgency and pricing)." },
  { q: "What if a homeowner says they already went with someone else?", a: "The system gracefully closes that conversation and removes them from the sequence. Only engaged leads move forward — no harassing people who have already decided." },
  { q: "How quickly can we launch a reactivation campaign?", a: "Typically within 5–7 business days. We write the messages, import your leads, configure the sequence, and test it before launch. You approve everything first." },
];

function RoofingInner() {
  const demoBooking = useDemoBooking();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <Navbar />

      <IndustryHero
        image="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1800&q=95"
        eyebrow="AI Automation for Roofing & Restoration"
        headline="You Got the Lead. The Storm Passed. Did You Follow Up?"
        highlightedWord="Did You Follow Up?"
        sub="Most roofing companies capture storm leads and lose 70% of them to slow follow-up. Our reactivation system re-engages every old lead automatically — turning your dead list into booked jobs."
        onBookDemo={demoBooking?.openDemoBooking}
      />

      <IndustryPainBar stats={PAIN_STATS} />

      <IndustrySMSDemo
        messages={SMS_MESSAGES}
        triggerLabel="Simulate Lead Reactivation"
        triggerEvent="Old storm lead identified → Reactivation sequence starts"
        automationName="Old Lead Reactivation Campaign"
        accentColor="#dc2626"
        businessName="Southwest Roofing"
      />

      <IndustryResults
        metrics={METRICS}
        testimonial={TESTIMONIAL}
        onBookDemo={demoBooking?.openDemoBooking}
      />

      <IndustryFAQ faqs={FAQS} />

      <Footer />
    </div>
  );
}

export default function Roofing() {
  return (
    <DemoBookingProvider>
      <RoofingInner />
    </DemoBookingProvider>
  );
}