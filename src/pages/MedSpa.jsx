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
import MedSpaROIBlock from "../components/medspa/MedSpaROIBlock";
import MedSpaFAQ from "../components/medspa/MedSpaFAQ";
import MedSpaFinalCTA from "../components/medspa/MedSpaFinalCTA";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

export default function MedSpa() {
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'none';

    const cleanupMetadata = setPageMetadata({
      title: 'Med Spa Automation | ClientSurge Systems',
      description:
        'Done-for-you automation for med spas and aesthetic clinics. Respond to leads in under 60 seconds, automate follow-up, and book more consultations.',
      canonicalPath: '/med-spa',
      ogTitle: 'Med Spa Automation | ClientSurge Systems',
      ogDescription:
        'See how ClientSurge helps med spas automate lead response, follow-up, and consultation booking.',
    });

    return () => {
      if (navbar) navbar.style.display = 'block';
      cleanupMetadata();
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
      <MedSpaROIBlock />
      <MedSpaFAQ />
      <MedSpaFinalCTA />
      <Footer />
      <MobileCallBar />
    </div>
  );
}
