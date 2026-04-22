import { useEffect } from 'react';

// Scroll-driven background gradient (Idea 5)
function useScrollGradient() {
  useEffect(() => {
    const stops = [
      { scroll: 0,    from: "hsl(40,10%,96%)",  to: "hsl(0,0%,100%)" },
      { scroll: 0.15, from: "hsl(38,18%,94%)",  to: "hsl(40,10%,98%)" },
      { scroll: 0.35, from: "hsl(35,22%,92%)",  to: "hsl(38,14%,96%)" },
      { scroll: 0.55, from: "hsl(33,20%,94%)",  to: "hsl(35,18%,97%)" },
      { scroll: 0.75, from: "hsl(30,16%,93%)",  to: "hsl(33,12%,96%)" },
      { scroll: 1,    from: "hsl(28,14%,90%)",  to: "hsl(30,10%,95%)" },
    ];

    const lerp = (a, b, t) => {
      // Parse hsl values and interpolate
      const parse = (s) => {
        const m = s.match(/hsl\(([^,]+),([^,]+),([^)]+)\)/);
        return m ? [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])] : [0,0,100];
      };
      const [h1,s1,l1] = parse(a);
      const [h2,s2,l2] = parse(b);
      return `hsl(${h1+(h2-h1)*t},${s1+(s2-s1)*t}%,${l1+(l2-l1)*t}%)`;
    };

    const onScroll = () => {
      const progress = Math.min(window.scrollY / (document.body.scrollHeight - window.innerHeight), 1);
      let i = 0;
      for (let j = 0; j < stops.length - 1; j++) {
        if (progress >= stops[j].scroll) i = j;
      }
      const seg = stops[i], next = stops[Math.min(i+1, stops.length-1)];
      const t = seg.scroll === next.scroll ? 0 : (progress - seg.scroll) / (next.scroll - seg.scroll);
      document.documentElement.style.setProperty("--scroll-bg-from", lerp(seg.from, next.from, t));
      document.documentElement.style.setProperty("--scroll-bg-to", lerp(seg.to, next.to, t));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero.jsx";
import TrustBar from "../components/landing/TrustBar";
import Industries from "../components/landing/Industries";
import ProblemSolution from "../components/landing/ProblemSolution.jsx";
import Testimonials from "../components/landing/Testimonials";
import CoreOffer from "../components/landing/CoreOffer";
import FAQ from "../components/landing/FAQ";
import Pricing from "../components/landing/Pricing";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import { FAQ_ITEMS } from "../components/landing/FAQ";
import { getFAQSchema, getLocalBusinessSchema, getOrganizationSchema, getServiceSchema } from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

export default function Home() {
  useScrollGradient();

  useEffect(() => {
    let cleanupMetadata = () => {};
    let cleanupOrg = () => {};
    let cleanupBusiness = () => {};
    let cleanupService = () => {};
    let cleanupFaq = () => {};

    try {
      cleanupMetadata = setPageMetadata({
        title: "ClientSurge Systems | AI Lead Response and Booking Automation",
        description:
          "Done-for-you automation for med spas and lead-driven service businesses that need faster response, stronger follow-up, and more booked appointments.",
        canonicalPath: "/",
        ogTitle: "ClientSurge Systems | AI Lead Response and Booking Automation",
        ogDescription:
          "See how ClientSurge helps med spas and lead-driven service businesses turn more leads into booked appointments.",
      });
      cleanupOrg = setJsonLd("organization", getOrganizationSchema());
      cleanupBusiness = setJsonLd("local-business", getLocalBusinessSchema());
      cleanupService = setJsonLd("service", getServiceSchema());
      cleanupFaq = setJsonLd("faq", getFAQSchema(FAQ_ITEMS));
    } catch (error) {
      console.error("Homepage SEO bootstrap failed:", error);
    }

    return () => {
      cleanupFaq();
      cleanupService();
      cleanupBusiness();
      cleanupOrg();
      cleanupMetadata();
    };
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen pb-16" style={{ background: "hsl(38,18%,94%)" }}>
        <Navbar />
        <Hero />
        <Industries />
        <section aria-label="Proof and trust">
          <TrustBar />
          <Testimonials />
        </section>
        <ProblemSolution />
        <CoreOffer />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </DemoBookingProvider>
  );
}