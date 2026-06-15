import { ArrowRight } from 'lucide-react';
import DemoBookingModal from '../forms/DemoBookingModal';
import { useState } from 'react';

export default function ImmersiveIndustryHero({ config }) {
  const [showBooking, setShowBooking] = useState(false);
  
  if (!config || !config.hero) {
    return null;
  }

  const { hero } = config;

  return (
    <>
      {/* Full-Bleed Hero with Image Background */}
      <section 
        className="relative w-full h-[100svh] md:h-[90svh] overflow-hidden"
        style={{
          backgroundImage: hero.image ? `url('${hero.image}')` : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundColor: 'hsl(var(--background))',
          WebkitBackgroundSize: 'cover',
        }}
      >
        {/* Preload image for high quality */}
        {hero.image && (
          <link rel="preload" as="image" href={hero.image} />
        )}
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50 z-10" />

        {/* Content Grid: Left (Text) Right (Image breathing room) */}
        <div className="relative z-20 h-full flex items-center px-6 md:px-10 lg:px-12">
          <div className="max-w-3xl w-full">
            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-3">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <p className="text-xs md:text-sm font-black uppercase tracking-widest text-primary">
                {hero.eyebrow}
              </p>
            </div>

            {/* Headline */}
            <h1 
              className="font-titles font-black leading-tight mb-6 text-white"
              style={{
                fontSize: 'clamp(2rem, 7vw, 4.5rem)',
                letterSpacing: '-0.03em',
                textShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              {hero.headline}
            </h1>

            {/* Subheadline */}
            <p 
              className="text-lg md:text-xl font-light text-white/90 mb-8 leading-relaxed max-w-2xl"
              style={{
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {hero.subheadline}
            </p>

            {/* CTA Button */}
            <button
              onClick={() => setShowBooking(true)}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg font-bold text-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)',
                boxShadow: '0 8px 24px rgba(0,136,204,0.3)',
              }}
            >
              {hero.cta}
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center md:block md:left-10">
              <div className="hidden md:flex flex-col items-center gap-2 text-white/60 text-xs font-semibold uppercase tracking-widest">
                <span>Scroll</span>
                <div className="w-[2px] h-8 bg-gradient-to-b from-white/60 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {showBooking && <DemoBookingModal onClose={() => setShowBooking(false)} />}
    </>
  );
}