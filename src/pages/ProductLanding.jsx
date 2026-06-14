import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { setPageMetadata } from '@/lib/seo';
import { ArrowRight, Zap, MessageSquare, Calendar, BarChart3, Phone } from 'lucide-react';

const FEATURES = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Instant Lead Response',
    description: 'Respond to leads within seconds with AI-powered SMS messages',
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: 'Missed Call Recovery',
    description: 'Never lose a lead again with automatic follow-up sequences',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'AI Follow-Up Engine',
    description: 'Intelligent message automation that qualifies and nurtures leads',
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Booking Automation',
    description: 'Direct lead-to-calendar integration with appointment confirmation',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Real-Time Analytics',
    description: 'Track lead flow, response rates, and booking conversions',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Customer Reactivation',
    description: 'Automatically re-engage inactive leads with targeted campaigns',
  },
];

export default function ProductLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    setPageMetadata({
      title: 'ClientSurge Systems | AI Lead Automation for Local Service Businesses',
      description: 'Turn more leads into booked appointments with AI-powered lead response, follow-up, and booking automation. Built for contractors, salons, clinics, and service businesses.',
      canonicalPath: '/product',
      ogTitle: 'ClientSurge Systems - AI Lead Automation',
      ogDescription: 'Automated lead response, AI follow-up, missed call recovery, and booking automation for service businesses.',
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            AI Automation That Closes Leads
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            ClientSurge automatically responds to leads, qualifies them with AI, follows up intelligently, and books appointments—24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors"
            >
              View Pricing
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">How ClientSurge Works</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Six automated systems work together to capture leads, qualify them, follow up intelligently, and book appointments automatically.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
            >
              <div className="text-primary mb-4">{feature.icon}</div>
              <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-6 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by Service Businesses</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Active businesses</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2.5M+</div>
              <p className="text-muted-foreground">Leads captured</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">45%</div>
              <p className="text-muted-foreground">Avg booking rate increase</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Automate Your Leads?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join hundreds of service businesses closing more leads with AI automation.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}