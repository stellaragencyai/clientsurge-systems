import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  const scrollToForm = () => {
    const element = document.getElementById('demo-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 md:py-32 px-6 bg-foreground text-background">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
          If you're already getting leads,
        </h2>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-8">
          you should be converting more of them.
        </h2>

        <p className="text-lg text-background/80 max-w-xl mx-auto mb-10 leading-relaxed">
          We help med spas respond faster and book more consultations automatically. No fluff. Just results.
        </p>

        <button
          onClick={scrollToForm}
          className="inline-flex items-center justify-center gap-2 px-10 h-13 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Book Your Demo
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-background/70">
          {['Free 30-min consultation', 'No credit card needed', 'See your specific opportunity'].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}