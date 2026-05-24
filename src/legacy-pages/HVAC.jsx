import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider, useDemoBooking } from "@/components/landing/DemoBookingContext";
import IndustryHero from "@/components/industry/IndustryHero";
import IndustryPainBar from "@/components/industry/IndustryPainBar";
import IndustrySMSDemo from "@/components/industry/IndustrySMSDemo";
import IndustryResults from "@/components/industry/IndustryResults";
import IndustryFAQ from "@/components/industry/IndustryFAQ";

const PAIN_STATS = [
  { icon: "📵", value: "62%", label: "Of callers won't leave a voicemail", sub: "They move on to the next company immediately" },
  { icon: "🏃", value: "3 calls", label: "Average number of companies a customer contacts", sub: "First to respond wins the job" },
  { icon: "💰", value: "$2,800", label: "Average HVAC service job value", sub: "Every missed call = real money walked out the door" },
];

const SMS_MESSAGES = [
  { from: "system", text: "Hey! This is Elite HVAC — sorry we missed your call, our techs are out on jobs right now. What's going on with your system? We can usually get someone out same day or tomorrow.", delay: 900 },
  { from: "lead",   text: "AC stopped cooling completely. It's 107 outside and I have kids at home", delay: 2200 },
  { from: "system", text: "That's a priority call for us — we will NOT leave you without AC. I'm flagging this to our dispatcher right now. You'll get a call from a tech within 20 minutes. What's the best number to reach you?", delay: 1400 },
  { from: "lead",   text: "This number is fine", delay: 1600 },
  { from: "system", text: "Got it. Tech is being dispatched. Hang tight — we're on our way. 🔧❄️", delay: 1200 },
];

const METRICS = [
  { value: "74%", label: "Of missed callers respond to the instant text-back" },
  { value: "2.1", label: "Additional jobs booked per week on average" },
  { value: "$0", label: "Lost to voicemail when the system is active" },
];

const TESTIMONIAL = {
  quote: "Peak season we were losing 3–4 service calls a day when we were slammed. The text goes out automatically and most of them wait for us. We stopped losing jobs we already earned.",
  name: "Jake T.",
  business: "Desert Cool HVAC, Phoenix AZ",
};

const FAQS = [
  { q: "What if the customer calls after hours?", a: "The missed call text-back fires 24/7, including nights and weekends. You can configure different messages for after-hours vs. business hours so the response always feels appropriate." },
  { q: "Will it work if I have multiple techs with different phones?", a: "Yes. We set up a single business number (or connect your existing one via Twilio) so all calls route through the same system regardless of who's in the field." },
  { q: "What if a customer is angry when they text back?", a: "The AI is trained to de-escalate and prioritize urgent situations. If a customer signals an emergency, the system flags it and notifies you immediately rather than sending a generic reply." },
  { q: "Can I customize what the text says?", a: "100%. During onboarding we write the messages to match your company voice — whether that's professional, friendly, or straight-to-the-point. You approve everything before it goes live." },
  { q: "How fast does the text go out after a missed call?", a: "Under 60 seconds. The system detects the missed call via your Twilio number and fires the response immediately — before the customer has time to call your competitor." },
];

function HVACInner() {
  const demoBooking = useDemoBooking();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <Navbar />

      <IndustryHero
        image="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1800&q=95"
        eyebrow="AI Automation for HVAC, Plumbing & Home Services"
        headline="Every Missed Call Is a Job You Handed to Your Competitor"
        highlightedWord="Missed Call"
        sub="When your crew is on a job and a new call comes in, our system texts the customer back instantly — keeping the lead warm and the job yours before they dial the next number."
        onBookDemo={demoBooking?.openDemoBooking}
      />

      <IndustryPainBar stats={PAIN_STATS} />

      <IndustrySMSDemo
        messages={SMS_MESSAGES}
        triggerLabel="Simulate Missed Call Text-Back"
        triggerEvent="Missed call detected → Text-back fires in under 60 seconds"
        automationName="Missed Call Text-Back"
        accentColor="#00AEEF"
        businessName="Elite HVAC"
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

export default function HVAC() {
  return (
    <DemoBookingProvider>
      <HVACInner />
    </DemoBookingProvider>
  );
}