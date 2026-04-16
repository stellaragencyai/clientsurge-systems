import { useEffect } from 'react';
import MedSpaNavBar from "../components/medspa/MedSpaNavBar";
import MedSpaHero from "../components/medspa/MedSpaHero";
import MedSpaPositioning from "../components/medspa/MedSpaPositioning";
import MedSpaTransition from "../components/medspa/MedSpaTransition";
import MedSpaWhyItWorks from "../components/medspa/MedSpaWhyItWorks";
import MedSpaProblem from "../components/medspa/MedSpaProblem";
import MedSpaPain from "../components/medspa/MedSpaPain";
import MedSpaSolution from "../components/medspa/MedSpaSolution";
import MedSpaFlow from "../components/medspa/MedSpaFlow";
import MedSpaDemo from "../components/medspa/MedSpaDemo";
import MedSpaBenefits from "../components/medspa/MedSpaBenefits";
import MedSpaSpecific from "../components/medspa/MedSpaSpecific";
import MedSpaReactivation from "../components/medspa/MedSpaReactivation";
import MedSpaPricingPreview from "../components/medspa/MedSpaPricingPreview";
import MedSpaSocialProof from "../components/medspa/MedSpaSocialProof";
import MedSpaTestimonials from "../components/medspa/MedSpaTestimonials";
import MedSpaFAQ from "../components/medspa/MedSpaFAQ";
import MedSpaFinalCTA from "../components/medspa/MedSpaFinalCTA";
import Footer from "../components/landing/Footer";

export default function MedSpa() {
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'none';
    return () => {
      if (navbar) navbar.style.display = 'block';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <MedSpaNavBar />
      <MedSpaHero />
      <MedSpaPositioning />
      <MedSpaProblem />
      <MedSpaPain />
      <MedSpaTransition />
      <MedSpaSolution />
      <MedSpaFlow />
      <MedSpaDemo />
      <MedSpaSocialProof />
      <MedSpaWhyItWorks />
      <MedSpaBenefits />
      <MedSpaSpecific />
      <MedSpaReactivation />
      <MedSpaPricingPreview />
      <MedSpaTestimonials />
      <MedSpaFAQ />
      <MedSpaFinalCTA />
      <Footer />
    </div>
  );
}