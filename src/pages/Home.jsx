import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustBar from "../components/landing/TrustBar";
import ProblemSection from "../components/landing/ProblemSection";
import SolutionSection from "../components/landing/SolutionSection";
import HowItWorks from "../components/landing/HowItWorks";
import Benefits from "../components/landing/Benefits";
import ConversationMockup from "../components/landing/ConversationMockup";
import Testimonials from "../components/landing/Testimonials";
import Industries from "../components/landing/Industries";
import CoreOffer from "../components/landing/CoreOffer";
import WhyUs from "../components/landing/WhyUs";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import FadeIn from "../components/landing/FadeIn";

import SocialProofToasts from "../components/landing/SocialProofToasts";
import StickyCTA from "../components/landing/StickyCTA";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <FadeIn><TrustBar /></FadeIn>
      <FadeIn><ProblemSection /></FadeIn>
      <FadeIn><SolutionSection /></FadeIn>
      <FadeIn><HowItWorks /></FadeIn>
      <FadeIn><Testimonials /></FadeIn>
      <FadeIn><ConversationMockup /></FadeIn>
      <FadeIn><Benefits /></FadeIn>
      <FadeIn><Industries /></FadeIn>
      <FadeIn><CoreOffer /></FadeIn>
      <FadeIn><WhyUs /></FadeIn>
      <FadeIn><FAQ /></FadeIn>
      <FinalCTA />
      <Footer />
      <StickyCTA />
      <SocialProofToasts />
    </div>
  );
}