import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import FadeIn from "../components/landing/FadeIn";
import SamChatWidget from "../components/sam/SamChatWidget";

// Existing sections
import MedSpaHero from "../components/medspa/MedSpaHero";
import MedSpaProblem from "../components/medspa/MedSpaProblem";
import MedSpaPain from "../components/medspa/MedSpaPain";
import MedSpaSolution from "../components/medspa/MedSpaSolution";
import MedSpaDemo from "../components/medspa/MedSpaDemo";
import MedSpaBenefits from "../components/medspa/MedSpaBenefits";
import MedSpaSpecific from "../components/medspa/MedSpaSpecific";
import MedSpaReactivation from "../components/medspa/MedSpaReactivation";
import MedSpaPricingPreview from "../components/medspa/MedSpaPricingPreview";
import MedSpaFinalCTA from "../components/medspa/MedSpaFinalCTA";

// New enhanced sections
import MedSpaTrustBar from "../components/medspa/MedSpaTrustBar";
import MedSpaConversation from "../components/medspa/MedSpaConversation";
import MedSpaTestimonials from "../components/medspa/MedSpaTestimonials";
import MedSpaBeforeAfter from "../components/medspa/MedSpaBeforeAfter";
import MedSpaDetailedFlow from "../components/medspa/MedSpaDetailedFlow";
import MedSpaRevenueCalculator from "../components/medspa/MedSpaRevenueCalculator";
import MedSpaFAQ from "../components/medspa/MedSpaFAQ";

export default function MedSpa() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <MedSpaHero />
      <FadeIn><MedSpaTrustBar /></FadeIn>
      <FadeIn><MedSpaBeforeAfter /></FadeIn>
      <FadeIn><MedSpaProblem /></FadeIn>
      <FadeIn><MedSpaPain /></FadeIn>
      <FadeIn><MedSpaConversation /></FadeIn>
      <FadeIn><MedSpaDetailedFlow /></FadeIn>
      <FadeIn><MedSpaSolution /></FadeIn>
      <FadeIn><MedSpaDemo /></FadeIn>
      <FadeIn><MedSpaBenefits /></FadeIn>
      <FadeIn><MedSpaSpecific /></FadeIn>
      <FadeIn><MedSpaReactivation /></FadeIn>
      <FadeIn><MedSpaTestimonials /></FadeIn>
      <FadeIn><MedSpaRevenueCalculator /></FadeIn>
      <FadeIn><MedSpaPricingPreview /></FadeIn>
      <FadeIn><MedSpaFAQ /></FadeIn>
      <MedSpaFinalCTA />
      <Footer />
      <SamChatWidget />
    </div>
  );
}