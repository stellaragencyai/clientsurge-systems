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
      title: 'ClientSurge Systems | AI Automation Systems for Service Businesses',
      description: 'Packaged AI systems for lead response, follow-up, missed-call recovery, booking, reviews, and reactivation. ClientSurge handles setup and launch readiness.',
      canonicalPath: '/product',
      ogTitle: 'ClientSurge AI Automation Systems',
      ogDescription: 'Choose the system, complete guided intake, and move toward setup with ClientSurge.',
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <p className="cs-section-eyebrow mb-4">AI Automation Storefront</p>
          <h1 className="font-titles text-[#001B44] text-5xl md:text-6xl font-bold mb-6">
            Choose the AI System Your Business Needs
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            ClientSurge packages response, follow-up, missed-call recovery, booking, reviews, and reactivation into clear systems you can compare and launch through guided setup.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/pricing')} className="cs-btn-primary">
              Compare Packages <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/automations')} className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors">
              View Automation Stack
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
