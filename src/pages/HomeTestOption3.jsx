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

export default function HomeTestOption3() {
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

      {/* OPTION 3: Action/Dynamic with Multi-layer Smart Fade */}
      <section 
        className="relative w-full py-24 md:py-32 px-6"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=90")',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          minHeight: '90vh'
        }}
      >
        {/* Dark at top, lighter in middle, fades to white */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 100%)',
          }}
        />
        
        {/* Smooth fade to white at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50" />
        
        <div className="relative z-10 max-w-5xl mx-auto w-full">
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