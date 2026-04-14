import Navbar from "../components/landing/Navbar";
import MedSpaHero from "../components/medspa/MedSpaHero";
import MedSpaProblem from "../components/medspa/MedSpaProblem";
import MedSpaPain from "../components/medspa/MedSpaPain";
import MedSpaSolution from "../components/medspa/MedSpaSolution";
import MedSpaFlow from "../components/medspa/MedSpaFlow";
import MedSpaDemo from "../components/medspa/MedSpaDemo";
import MedSpaBenefits from "../components/medspa/MedSpaBenefits";
import MedSpaSpecific from "../components/medspa/MedSpaSpecific";
import MedSpaReactivation from "../components/medspa/MedSpaReactivation";
import MedSpaPricingPreview from "../components/medspa/MedSpaPricingPreview";
import MedSpaFAQ from "../components/medspa/MedSpaFAQ";
import MedSpaFinalCTA from "../components/medspa/MedSpaFinalCTA";
import Footer from "../components/landing/Footer";

export default function MedSpa() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <MedSpaHero />
      <MedSpaProblem />
      <MedSpaPain />
      <MedSpaSolution />
      <MedSpaFlow />
      <MedSpaDemo />
      <MedSpaBenefits />
      <MedSpaSpecific />
      <MedSpaReactivation />
      <MedSpaPricingPreview />
      <MedSpaFAQ />
      <MedSpaFinalCTA />
      <Footer />
    </div>
  );
}