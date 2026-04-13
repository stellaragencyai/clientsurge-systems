import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-background to-card flex items-center justify-center px-6 py-20">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] text-foreground mb-6">
          Turn More Med Spa Leads Into Booked Appointments
          <span className="block text-primary">Automatically</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
          We install done-for-you systems that respond instantly, follow up automatically, recover missed calls, and turn more inquiries into booked consultations.
        </p>

        <p className="text-sm text-muted-foreground mb-8 italic">
          Built for med spas that want faster response and more booked consultations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a href="#demo">
            <Button size="lg" className="rounded-lg px-8 h-12 font-semibold gap-2">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="px-8 h-12 rounded-lg border border-border text-foreground font-semibold hover:bg-muted transition-colors"
          >
            See How It Works
          </button>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          {['Fully automated', 'No staff retraining', 'Live in 5–7 days'].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}