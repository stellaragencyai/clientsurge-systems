import { useEffect } from 'react';

export default function Book() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Book Your Free Demo
          </h1>
          <p className="text-muted-foreground text-lg">30 minutes. No commitment.</p>
        </div>

        {/* Calendly Widget */}
        <div className="bg-white rounded-2xl border border-border shadow-lg overflow-hidden">
          <div className="calendly-inline-widget" data-url="https://calendly.com/clientsurgesystems/30min" style={{minWidth:'320px',height:'700px'}} />
        </div>
      </div>
    </div>
  );
}