import { useEffect } from 'react';
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustBar from "../components/landing/TrustBar";
import ProblemSolution from "../components/landing/ProblemSolution.jsx";
import HowItWorks from "../components/landing/HowItWorks";
import Testimonials from "../components/landing/Testimonials";
import CoreOffer from "../components/landing/CoreOffer";
import FAQ from "../components/landing/FAQ";
import Pricing from "../components/landing/Pricing";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import SamChatWidget from "../components/sam/SamChatWidget";
import StickyCTA from "../components/landing/StickyCTA";
import CookieConsent from "../components/landing/CookieConsent";
import FadeIn from "../components/landing/FadeIn";

export default function Home() {
  useEffect(() => {
    document.title = "ClientSurge Systems | AI Automation for Med Spas & Local Businesses";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Done-for-you AI automation that captures leads, responds instantly, and books more appointments for med spas and local service businesses in Phoenix, AZ.');
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <Hero />
      <FadeIn><TrustBar /></FadeIn>
      <FadeIn><ProblemSolution /></FadeIn>
      <FadeIn><HowItWorks id="how-it-works-section" /></FadeIn>
      <FadeIn><CoreOffer /></FadeIn>
      <FadeIn><Testimonials /></FadeIn>
      <FadeIn><Pricing /></FadeIn>
      <FadeIn><FAQ /></FadeIn>
      <FinalCTA />
      <Footer />
      <SamChatWidget />
      <StickyCTA />
      <CookieConsent />
    </div>
  );
}
