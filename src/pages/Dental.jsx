import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider, useDemoBooking } from "@/components/landing/DemoBookingContext";
import IndustryHero from "@/components/industry/IndustryHero";
import IndustryPainBar from "@/components/industry/IndustryPainBar";
import IndustrySMSDemo from "@/components/industry/IndustrySMSDemo";
import IndustryResults from "@/components/industry/IndustryResults";
import IndustryFAQ from "@/components/industry/IndustryFAQ";

const PAIN_STATS = [
  { icon: "📉", value: "18–22%", label: "Average dental no-show rate", sub: "Industry benchmark across private practices" },
  { icon: "💸", value: "$1,100", label: "Average revenue lost per no-show", sub: "Cleaning + treatment slots combined" },
  { icon: "⏱️", value: "2+ hrs", label: "Daily front desk time on confirmation calls", sub: "Time better spent on in-office patients" },
];

const SMS_MESSAGES = [
  { from: "system", text: "Hi Sarah! Confirming your cleaning + exam at Bright Smile Dental this Thursday at 2:00pm. Reply YES to confirm or RESCHEDULE to pick a new time. See you soon! 😊", delay: 1000 },
  { from: "lead",   text: "YES", delay: 1800 },
  { from: "system", text: "Perfect, you're confirmed! We'll send a reminder the morning of your appointment. See you Thursday, Sarah! 🦷", delay: 1400 },
  { from: "system", text: "Good morning Sarah! Just a reminder your appointment is TODAY at 2:00pm at Bright Smile Dental. We're looking forward to seeing you!", delay: 2800 },
  { from: "lead",   text: "Actually I need to reschedule, something came up", delay: 2000 },
  { from: "system", text: "No worries at all! Here's our online scheduling link to grab a new time that works for you: brightsmile.com/book — takes 60 seconds. We'll get you taken care of! 😊", delay: 1600 },
];

const METRICS = [
  { value: "67%", label: "Reduction in no-shows after first 30 days" },
  { value: "3.2x", label: "Faster rebooking of cancelled appointments" },
  { value: "$4,200", label: "Average monthly revenue recovered" },
];

const TESTIMONIAL = {
  quote: "We went from 8–10 no-shows a week to under 2. The confirmation texts go out automatically and patients actually respond. Our front desk stopped dreading Monday mornings.",
  name: "Dr. A. Martinez",
  business: "Bright Smile Family Dentistry",
};

const FAQS = [
  { q: "Does this work with my existing scheduling software?", a: "Yes. We integrate with most major dental scheduling platforms including Dentrix, Eaglesoft, and Open Dental. During setup we connect directly so patient appointments trigger the automation automatically." },
  { q: "Can patients reschedule directly through the text?", a: "Absolutely. When a patient replies 'RESCHEDULE' or any similar phrase, the system sends your online booking link immediately. They pick a new slot without calling your front desk." },
  { q: "Will it feel automated or will patients think it's a real person?", a: "The messages are written in a warm, friendly tone specific to your practice name. Most patients don't realize it's automated — and many patients actually prefer texting over a phone call." },
  { q: "What happens if a patient replies with a question like 'how long will my cleaning take?'", a: "We configure common FAQ responses for your practice. If a question falls outside what we've pre-configured, your front desk gets notified to respond personally." },
  { q: "How long does setup take?", a: "Most dental practices are fully live within 5–7 business days. We handle the entire setup — you just do a 30-minute onboarding call with us." },
];

function DentalInner() {
  const demoBooking = useDemoBooking();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <Navbar />

      <IndustryHero
        image="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1800&q=95"
        eyebrow="AI Automation for Dental & Orthodontics"
        headline="Stop Losing $1,100 Every Time a Patient No-Shows"
        highlightedWord="$1,100"
        sub="Our AI sends appointment confirmations, reminders, and recovery texts automatically — so your front desk focuses on patients in the chair, not the ones who aren't showing up."
        onBookDemo={demoBooking?.openDemoBooking}
      />

      <IndustryPainBar stats={PAIN_STATS} />

      <IndustrySMSDemo
        messages={SMS_MESSAGES}
        triggerLabel="Simulate Appointment Confirmation"
        triggerEvent="Patient appointment booked → Confirmation sequence starts"
        automationName="Appointment Confirmation + No-Show Recovery"
        accentColor="#2563eb"
        businessName="Bright Smile Dental"
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

export default function Dental() {
  return (
    <DemoBookingProvider>
      <DentalInner />
    </DemoBookingProvider>
  );
}