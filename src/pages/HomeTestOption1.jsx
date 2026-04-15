import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustBar from "../components/landing/TrustBar";
import ProblemSolution from "../components/landing/ProblemSolution.jsx";
import HowItWorks from "../components/landing/HowItWorks";
import Benefits from "../components/landing/Benefits";
import ConversationMockup from "../components/landing/ConversationMockup";
import DetailedProcess from "../components/landing/DetailedProcess";
import Testimonials from "../components/landing/Testimonials";
import Industries from "../components/landing/Industries";
import CoreOffer from "../components/landing/CoreOffer";
import WhyUs from "../components/landing/WhyUs";
import FAQ from "../components/landing/FAQ";
import Pricing from "../components/landing/Pricing";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import SamChatWidget from "../components/sam/SamChatWidget";
import FadeIn from "../components/landing/FadeIn";

export default function HomeTestOption1() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <FadeIn><TrustBar /></FadeIn>
      <FadeIn><ProblemSolution /></FadeIn>
      <FadeIn><HowItWorks /></FadeIn>
      <FadeIn><ConversationMockup /></FadeIn>
      <FadeIn><DetailedProcess /></FadeIn>
      <FadeIn><Benefits /></FadeIn>

      {/* OPTION 1: Luxury/Premium with Soft Dark Gradient */}
      <section 
        className="relative py-24 md:py-32 px-6"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1552693673-1bf958298935?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Soft dark gradient overlay (15-25% opacity) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/18 to-black/15" />
        
        {/* Additional fade-out to white at bottom for smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30" />
        
        <div className="relative z-10">
          <Industries />
        </div>
      </section>

      <FadeIn><CoreOffer /></FadeIn>
      <FadeIn><WhyUs /></FadeIn>
      <FadeIn><FAQ /></FadeIn>
      <FadeIn><Testimonials /></FadeIn>
      <FadeIn><Pricing /></FadeIn>
      <FinalCTA />
      <Footer />
      <SamChatWidget />
    </div>
  );
}