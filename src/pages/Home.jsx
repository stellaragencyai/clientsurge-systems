import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustBar from "../components/landing/TrustBar";
import ProblemSection from "../components/landing/ProblemSection";
import SolutionSection from "../components/landing/SolutionSection";
import HowItWorks from "../components/landing/HowItWorks";
import Benefits from "../components/landing/Benefits";
import ConversationMockup from "../components/landing/ConversationMockup";
import Industries from "../components/landing/Industries";
import CoreOffer from "../components/landing/CoreOffer";
import WhyUs from "../components/landing/WhyUs";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <TrustBar />
      <ProblemSection />
      <SolutionSection />
      <HowItWorks />
      <ConversationMockup />
      <Benefits />
      <Industries />
      <CoreOffer />
      <WhyUs />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}