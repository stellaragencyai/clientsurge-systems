import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider, useDemoBooking } from "@/components/landing/DemoBookingContext";
import IndustryHero from "@/components/industry/IndustryHero";
import IndustryPainBar from "@/components/industry/IndustryPainBar";
import IndustrySMSDemo from "@/components/industry/IndustrySMSDemo";
import IndustryResults from "@/components/industry/IndustryResults";
import IndustryFAQ from "@/components/industry/IndustryFAQ";

const PAIN_STATS = [
  { icon: "📄", value: "80%", label: "Of estimates never get a follow-up beyond the first send", sub: "You built the quote — then crickets" },
  { icon: "🤝", value: "2.4x", label: "More jobs won by contractors who follow up 3+ times", sub: "Persistence beats price almost every time" },
  { icon: "⏳", value: "4 days", label: "Before a prospect picks another contractor", sub: "If you're not following up, someone else is" },
];

const SMS_MESSAGES = [
  { from: "system", text: "Hi Lisa! Just checking in on the kitchen remodel estimate we sent over on Monday. Any questions I can answer? We can typically start within 2 weeks of signing and have June dates still open.", delay: 1000 },
  { from: "lead",   text: "We're still deciding between a couple contractors", delay: 2200 },
  { from: "system", text: "Totally understand — it's a big decision! Happy to hop on a quick 10-minute call to walk through exactly what's included in our quote and answer anything. We also offer a 5-year workmanship warranty that most others don't. Would tomorrow morning work?", delay: 1500 },
  { from: "lead",   text: "Yeah tomorrow at 9am works", delay: 1800 },
  { from: "system", text: "Perfect — locking you in for 9am tomorrow. I'll send a calendar invite right now. Looking forward to earning your business, Lisa! 🔨", delay: 1200 },
];

const METRICS = [
  { value: "2.4x", label: "More estimates converted to signed contracts" },
  { value: "$6,800", label: "Average additional monthly revenue from follow-up" },
  { value: "100%", label: "Of estimates followed up — zero manual effort" },
];

const TESTIMONIAL = {
  quote: "I used to lose jobs I should have won just because I forgot to follow up or felt awkward reaching out again. Now the system does it and my close rate went from about 25% to over 60%. Game changer.",
  name: "Ryan K.",
  business: "Summit General Contractors, Scottsdale AZ",
};

const FAQS = [
  { q: "Does this work with how I currently send estimates?", a: "Yes. Whether you use Jobber, Housecall Pro, QuickBooks, or email directly from your phone — we connect to your workflow. When an estimate goes out, the follow-up sequence starts automatically." },
  { q: "What if the customer says they went with someone else?", a: "The system gracefully closes the conversation and stops following up. No awkward repeated messages to people who have already decided. Only warm leads stay in the sequence." },
  { q: "Can I customize how many times it follows up and when?", a: "Absolutely. During setup we configure the timing and number of follow-up touches based on your average sales cycle. Some contractors prefer 3 touches over 7 days, others want 5 touches over 14 days." },
  { q: "Will it sound like a robot?", a: "Not at all. The messages are written in your voice — casual, professional, whatever fits your brand. We write them during onboarding and you approve every message before it goes live." },
  { q: "What types of contracting businesses does this work for?", a: "General contractors, remodelers, painters, electricians, plumbers, landscapers, flooring companies — any trade where you send quotes and wait for a response. If you're losing jobs to slow follow-up, this fixes it." },
];

function ContractorsInner() {
  const demoBooking = useDemoBooking();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <Navbar />

      <IndustryHero
        image="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1800&q=95"
        eyebrow="AI Automation for Contractors & Trades"
        headline="You Sent the Estimate. They Went Silent. That Job Is Gone."
        highlightedWord="That Job Is Gone."
        sub="Our AI follows up on every estimate automatically — 3 personalized touches over 7 days — so you win jobs without chasing people or feeling awkward about it."
        onBookDemo={demoBooking?.openDemoBooking}
      />

      <IndustryPainBar stats={PAIN_STATS} />

      <IndustrySMSDemo
        messages={SMS_MESSAGES}
        triggerLabel="Simulate Estimate Follow-Up"
        triggerEvent="Estimate sent → No reply after 48hrs → Follow-up sequence starts"
        automationName="Estimate Follow-Up Sequence"
        accentColor="#16a34a"
        businessName="Summit Contractors"
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

export default function Contractors() {
  return (
    <DemoBookingProvider>
      <ContractorsInner />
    </DemoBookingProvider>
  );
}