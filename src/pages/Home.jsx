import { useEffect } from 'react';
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustBar from "../components/landing/TrustBar";
import ProblemSolution from "../components/landing/ProblemSolution.jsx";
import Industries from "../components/landing/Industries";
import WhyUs from "../components/landing/WhyUs";
import IntegrationsBadges from "../components/landing/IntegrationsBadges";
import HowItWorks from "../components/landing/HowItWorks";
import Benefits from "../components/landing/Benefits";
import ConversationMockup from "../components/landing/ConversationMockup";
import DetailedProcess from "../components/landing/DetailedProcess";
import FounderSection from "../components/landing/FounderSection";
import CoreOffer from "../components/landing/CoreOffer";
import Guarantee from "../components/landing/Guarantee";
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
    if (metaDesc) metaDesc.setAttribute('content', 'Done-for-you AI automation that captures leads, responds instantly, and books more appointments — for med spas and local service businesses in Phoenix, AZ.');
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <Hero />
      <FadeIn><TrustBar /></FadeIn>
      <FadeIn><ProblemSolution /></FadeIn>
      <FadeIn><Industries /></FadeIn>
      <FadeIn><WhyUs /></FadeIn>
      <FadeIn><IntegrationsBadges /></FadeIn>
      <FadeIn><HowItWorks id="how-it-works-section" /></FadeIn>
      <FadeIn><ConversationMockup /></FadeIn>
      <FadeIn><DetailedProcess /></FadeIn>
      <FadeIn><Benefits /></FadeIn>
      <FadeIn><FounderSection /></FadeIn>
      <FadeIn><CoreOffer /></FadeIn>
      <FadeIn><Guarantee /></FadeIn>
      <FadeIn><FAQ /></FadeIn>
      <FadeIn><Pricing /></FadeIn>
      <FinalCTA />
      <Footer />
      <SamChatWidget />
      <StickyCTA />
      <CookieConsent />
    </div>
  );
}