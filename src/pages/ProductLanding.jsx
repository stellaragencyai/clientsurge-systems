import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { setPageMetadata } from '@/lib/seo';
import { ArrowRight } from 'lucide-react';

export default function ProductLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    setPageMetadata({
      title: 'ClientSurge Systems | AI Automation for Local Service Businesses',
      description: 'AI-powered lead response, follow-up, and scheduling automation that turns more inquiries into booked appointments. Built for contractors, salons, clinics, and service businesses.',
      canonicalPath: '/product',
      ogTitle: 'ClientSurge Systems - AI Automation Systems',
      ogDescription: 'Automated lead response, AI follow-up, missed call recovery, and scheduling automation for service businesses.',
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-titles text-[#001B44] text-5xl md:text-6xl font-bold mb-6">
            AI Automation Systems for Local Businesses
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            ClientSurge responds to leads automatically, qualifies them with AI, follows up intelligently, and converts more inquiries into booked appointments—24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/book')}
              className="cs-btn-primary"
            >
              Explore the Automation Catalog <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/automations')}
              className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors"
            >
              View All Systems
            </button>
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
}