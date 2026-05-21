import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { setPageMetadata } from '@/lib/seo';

export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    const cleanupMetadata = setPageMetadata({
      title: 'Demo Request Received | ClientSurge Systems',
      description: 'Your ClientSurge demo request is confirmed. Review what happens next before we meet.',
      canonicalPath: '/success',
      ogTitle: 'ClientSurge Demo Request Confirmed',
      ogDescription: 'Your demo is booked. Here is what happens next and how we prepare your audit.',
      robots: 'noindex,nofollow',
    });

    // Auto-redirect to home after 12 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 12000);

    return () => {
      cleanupMetadata();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-primary/15 border border-primary/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
          Your Demo is Booked!
        </h1>

        {/* Message */}
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto">
          We'll walk you through exactly how this works for your business. Check your email for the confirmation and meeting details.
        </p>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl border border-border p-8 mb-8">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-6">What Happens Next</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Confirmation', desc: "You'll receive a calendar invite and meeting link" },
              { step: '2', title: 'Demo Call', desc: "We show you the exact system for your business type" },
              { step: '3', title: 'Next Steps', desc: "Discuss options and timing for your implementation" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 text-left">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{item.step}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Back to Home
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}