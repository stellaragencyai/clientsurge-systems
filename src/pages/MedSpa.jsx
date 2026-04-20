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
import MedSpaFAQ from "../components/medspa/MedSpaFAQ";
import MedSpaFinalCTA from "../components/medspa/MedSpaFinalCTA";
import Footer from "../components/landing/Footer";

export default function MedSpa() {
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'none';

    const prevTitle = document.title;
    document.title = "Med Spa Automation | ClientSurge Systems — Book More Consultations on Autopilot";
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') || '';
    if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.setAttribute('name', 'description'); document.head.appendChild(metaDesc); }
    metaDesc.setAttribute('content', 'Done-for-you AI automation for med spas and aesthetic clinics. Respond to leads in under 60 seconds, automate follow-up, and book more consultations — live in 5–7 days.');

    return () => {
      if (navbar) navbar.style.display = 'block';
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MedSpaNavBar />
      <MedSpaHero />
      <MedSpaPositioning />
      <MedSpaProblem />
      <MedSpaPain />
      <MedSpaTransition />
      <MedSpaSolution />
      <MedSpaFlow />
      <MedSpaDemo />
      <MedSpaWhyItWorks />
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