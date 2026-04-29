import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider, useDemoBooking } from "@/components/landing/DemoBookingContext";
import IndustryHero from "@/components/industry/IndustryHero";
import IndustryPainBar from "@/components/industry/IndustryPainBar";
import IndustrySMSDemo from "@/components/industry/IndustrySMSDemo";
import IndustryResults from "@/components/industry/IndustryResults";
import IndustryFAQ from "@/components/industry/IndustryFAQ";

const PAIN_STATS = [
  { icon: "⚡", value: "21x", label: "Drop in odds of reaching a lead after 5 minutes", sub: "Speed of response is your biggest competitive advantage" },
  { icon: "🏆", value: "78%", label: "Of patients book with the first provider that responds", sub: "Being second costs you the patient" },
  { icon: "⏰", value: "4.3 hrs", label: "Average clinic follow-up time for new inquiries", sub: "That patient booked somewhere else hours ago" },
];

const SMS_MESSAGES = [
  { from: "system", text: "Hi Mike! Thanks for reaching out to Peak PT — we got your inquiry. Quick question: what's bringing you in? Back, neck, shoulder, or something else? We want to make sure we match you with the right specialist. 💪", delay: 900 },
  { from: "lead",   text: "Lower back pain, been dealing with it for about 3 weeks", delay: 2000 },
  { from: "system", text: "Got it — lower back is our most common case and our specialists get great results with it. We actually have openings this week for new patients. Here's a link to grab your first appointment — takes 60 seconds: peakpt.com/new-patient\n\nWe'll confirm immediately and get you on the path to feeling better!", delay: 1500 },
  { from: "lead",   text: "Booked for Wednesday at 11am!", delay: 2000 },
  { from: "system", text: "You're all set Mike! See you Wednesday at 11am. We'll send a reminder the night before with parking info and what to bring. Looking forward to helping you get back to 100%! 🙌", delay: 1300 },
];

const METRICS = [
  { value: "3.8x", label: "More new patients booked per month" },
  { value: "89%", label: "Response rate when a patient is texted within 60 seconds" },
  { value: "0", label: "New patient leads lost to slow follow-up" },
];

const TESTIMONIAL = {
  quote: "We used to lose 5–6 new patients a week to voicemail. Someone would call, we'd be with a patient, and by the time we called back 3 hours later they'd already booked somewhere else. Now the text goes out in seconds and we book most of them before we even call back.",
  name: "Dr. Lisa Chen",
  business: "Align Physical Therapy",
};

const FAQS = [
  { q: "Does this work for chiropractic, PT, and massage therapy practices?", a: "Yes — any appointment-based health and wellness practice where new patients inquire and you need to respond fast. The messaging is fully customized to your specialty and tone." },
  { q: "What if a patient asks a clinical question in their first text?", a: "We configure a set of pre-approved FAQ responses for common questions (what does a first visit look like, do you take insurance, etc.). Anything clinical that requires professional judgment gets flagged for your staff to respond to personally." },
  { q: "Does it work with Jane App, SimplePractice, or other practice management software?", a: "We integrate with most major practice management platforms. During setup we connect to your scheduling system so new inquiries automatically trigger the response sequence." },
  { q: "Will patients feel like they're being spammed?", a: "No — the sequence is designed to feel like a helpful, attentive front desk, not a blast campaign. One warm text when they inquire, one follow-up if they don't respond, then a final check-in. Most patients appreciate the quick response." },
  { q: "What's the difference between this and just having staff text back?", a: "Speed and consistency. Staff respond when they're free — which averages 4+ hours. Our system responds in under 60 seconds, every time, including after hours, weekends, and holidays. That's the difference between a booked patient and a lost one." },
];

function ChiropracticInner() {
  const demoBooking = useDemoBooking();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <Navbar />

      <IndustryHero
        image="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1800&q=95"
        eyebrow="AI Automation for Chiropractic & Physical Therapy"
        headline="New Patient Inquiries That Don't Hear Back in 5 Minutes Go Cold"
        highlightedWord="5 Minutes"
        sub="Our AI responds to every new patient inquiry instantly — before they book at the clinic down the street. Personalized, warm, and ready to schedule them while they're still interested."
        onBookDemo={demoBooking?.openDemoBooking}
      />

      <IndustryPainBar stats={PAIN_STATS} />

      <IndustrySMSDemo
        messages={SMS_MESSAGES}
        triggerLabel="Simulate New Patient Response"
        triggerEvent="New patient inquiry submitted → Response fires in under 60 seconds"
        automationName="New Patient Instant Follow-Up"
        accentColor="#7c3aed"
        businessName="Peak PT"
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

export default function Chiropractic() {
  return (
    <DemoBookingProvider>
      <ChiropracticInner />
    </DemoBookingProvider>
  );
}