import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function IndustryFinalCTA({ config }) {
  return (
    <div className="max-w-4xl mx-auto text-center text-white">
      <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Recover Lost Revenue?</h2>

      <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
        Stop losing leads to slow response times. Start capturing every opportunity with AI-powered automation.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
        <Link
          to="/book"
          className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:shadow-xl hover:scale-105 transition-all"
        >
          {config.cta}
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link
          to="/book"
          className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
        >
          Schedule a Demo
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Trust indicators */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm opacity-90">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Free setup (we handle it)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Live within 48 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Dedicated onboarding</span>
          </div>
        </div>

        <p className="text-sm opacity-75">
          Questions? <a href="mailto:support@clientsurge.com" className="underline hover:opacity-100">Email our team</a> or <Link to="/book" className="underline hover:opacity-100">book a call</Link>
        </p>
      </div>
    </div>
  );
}