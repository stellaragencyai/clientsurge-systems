import { useEffect, useRef } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import CSButton from '@/components/design-system/CSButton';

/**
 * CSHero — Shared base hero component for all public-facing pages.
 *
 * Consolidates duplicated hero logic from:
 *   - CinematicHero (homepage)
 *   - HeroSection (generic marketing pages)
 *   - IndustryHero (industry landing pages)
 *
 * Shared system:
 *   - Typography: Montserrat headings, Inter body
 *   - CTA system: CSButton primary/secondary
 *   - Spacing: consistent padding/margins
 *   - Animation: framer-motion with reduced-motion support
 *   - Background: gradient/orb/solid/image with overlay
 *   - Trust elements: stats, badges, accent bar
 *
 * Props:
 *   eyebrow          — string (small label above title)
 *   title            — string (main heading)
 *   titleHighlight   — string (highlighted part, rendered in electric blue)
 *   subtitle         — string (body text below title)
 *   description      — string (smaller supporting text)
 *   primaryCTA       — { label, onClick, href, to, icon }
 *   secondaryCTA     — { label, onClick, href, to, icon }
 *   trustBadges      — array of strings
 *   stats            — array of { value, label }
 *   backgroundType   — 'light' | 'dark' | 'gradient' | 'image'
 *   backgroundImage   — string URL (for backgroundType='image')
 *   align            — 'center' | 'left'
 *   minHeight        — string CSS min-height (default: full viewport minus nav)
 *   children         — extra content (pills, logo marquee, etc.)
 *   className        — string
 */
const EASING = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASING },
  },
};

export default function CSHero({
  eyebrow,
  title,
  titleHighlight,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  trustBadges,
  stats,
  backgroundType = 'light',
  backgroundImage,
  align = 'center',
  minHeight,
  children,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: '-40px' });

  const isDark = backgroundType === 'dark' || backgroundType === 'image';
  const isCentered = align === 'center';
  const effectiveMinHeight = minHeight || 'calc(100svh - var(--cs-nav-height))';

  const textColor = isDark ? '#ffffff' : '#000000';
  const subTextColor = isDark ? 'rgba(255,255,255,0.92)' : '#3a3d47';
  const descColor = isDark ? 'rgba(255,255,255,0.78)' : '#475569';
  const eyebrowColor = isDark ? '#7DD3FC' : '#006BB0';

  const motionProps = shouldReduceMotion
    ? { initial: false, animate: { opacity: 1, y: 0 } }
    : { initial: 'hidden', animate: inView ? 'visible' : 'hidden' };

  return (
    <section
      ref={sectionRef}
      className={`cs-hero relative overflow-hidden ${className}`}
      style={{ minHeight: effectiveMinHeight, display: 'flex', alignItems: 'center' }}
      aria-label={eyebrow || 'ClientSurge Systems'}
    >
      {/* ── Background layers ── */}
      {backgroundType === 'image' && backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
            loading="eager"
            decoding="async"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{
              zIndex: 1,
              background:
                'linear-gradient(100deg, rgba(2,6,23,0.62) 0%, rgba(15,23,42,0.38) 40%, rgba(15,23,42,0.12) 68%, rgba(2,6,23,0.18) 100%)',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-40"
            style={{ zIndex: 1, background: 'linear-gradient(to top, rgba(2,6,23,0.55), transparent)' }}
            aria-hidden="true"
          />
        </>
      )}

      {backgroundType === 'light' && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 0, background: 'radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f8fbfe 70%, #f0f5fa 100%)' }}
          aria-hidden="true"
        />
      )}

      {backgroundType === 'gradient' && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 0, background: 'linear-gradient(135deg, #f8fbfe 0%, #eef9ff 50%, #f0f5fa 100%)' }}
          aria-hidden="true"
        />
      )}

      {/* Animated ambient orb (non-image backgrounds only) */}
      {backgroundType !== 'image' && !shouldReduceMotion && (
        <motion.div
          className="absolute rounded-full"
          style={{
            zIndex: 0,
            top: '15%',
            left: '10%',
            width: 340,
            height: 340,
            background: 'radial-gradient(circle, rgba(0,174,239,0.08), transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

      {/* ── Content ── */}
      <motion.div
        className={`relative w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 ${isCentered ? 'text-center' : 'text-left'}`}
        style={{
          zIndex: 10,
          paddingTop: 'calc(var(--cs-nav-height, 76px) + 2rem)',
          paddingBottom: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: isCentered ? 'center' : 'flex-start',
          ...(isCentered ? {} : { maxWidth: '760px' }),
        }}
        variants={containerVariants}
        {...motionProps}
      >
        {/* Eyebrow */}
        {eyebrow && (
          <motion.div
            className={`mb-6 flex items-center gap-3 ${isCentered ? 'justify-center' : ''}`}
            variants={itemVariants}
          >
            <span
              className="h-4 w-1 rounded-full"
              style={{ background: '#00AEEF', boxShadow: '0 0 12px rgba(0,174,239,0.7)' }}
              aria-hidden="true"
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(0.7rem, 1vw, 0.8rem)',
                fontWeight: 800,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: eyebrowColor,
                ...(isDark ? { textShadow: '0 2px 12px rgba(0,0,0,0.6)' } : {}),
              }}
            >
              {eyebrow}
            </span>
          </motion.div>
        )}

        {/* Title */}
        {title && (
          <motion.h1
            variants={itemVariants}
            style={{
              fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(1.75rem, 4.2vw, 3.25rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: textColor,
              margin: '0 0 24px 0',
              maxWidth: isCentered ? '900px' : '100%',
              ...(isDark ? { textShadow: '0 4px 24px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)' } : {}),
            }}
          >
            {title}
            {titleHighlight && (
              <>
                <br />
                <span style={{ color: isDark ? '#7DD3FC' : '#00AEEF' }}>{titleHighlight}</span>
              </>
            )}
          </motion.h1>
        )}

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            variants={itemVariants}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1rem, 1.9vw, 1.15rem)',
              lineHeight: 1.7,
              color: subTextColor,
              maxWidth: '620px',
              margin: isCentered ? '0 auto 20px auto' : '0 0 20px 0',
              ...(isDark ? { textShadow: '0 2px 12px rgba(0,0,0,0.6)' } : {}),
            }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Description */}
        {description && (
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: 'clamp(0.85rem, 1.3vw, 0.95rem)',
              fontWeight: 500,
              color: descColor,
              maxWidth: '500px',
              margin: isCentered ? '0 auto 28px auto' : '0 0 28px 0',
              ...(isDark ? { textShadow: '0 2px 10px rgba(0,0,0,0.5)' } : {}),
            }}
          >
            {description}
          </motion.p>
        )}

        {/* Extra content (pills, etc.) */}
        {children && (
          <motion.div variants={itemVariants} className="mb-8">
            {children}
          </motion.div>
        )}

        {/* CTAs */}
        {(primaryCTA || secondaryCTA) && (
          <motion.div
            variants={itemVariants}
            className={`flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-8 ${isCentered ? 'justify-center' : ''}`}
          >
            {primaryCTA && (
              <CSButton
                variant="primary"
                size="lg"
                onClick={primaryCTA.onClick}
                href={primaryCTA.href}
                to={primaryCTA.to}
                icon={primaryCTA.icon}
                className="w-full sm:w-auto"
                style={{ maxWidth: '300px', height: '54px' }}
              >
                {primaryCTA.label}
              </CSButton>
            )}
            {secondaryCTA && (
              <CSButton
                variant="outline"
                size="lg"
                onClick={secondaryCTA.onClick}
                href={secondaryCTA.href}
                to={secondaryCTA.to}
                iconRight={secondaryCTA.icon || ArrowRight}
                className={`w-full sm:w-auto ${isDark ? '!border-white/90 !text-white' : ''}`}
                style={{ maxWidth: '300px', height: '54px' }}
              >
                {secondaryCTA.label}
              </CSButton>
            )}
          </motion.div>
        )}

        {/* Trust badges */}
        {trustBadges && trustBadges.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-4"
            style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'inherit' }}
          >
            {trustBadges.map((badge, i) => (
              <span key={i} className="flex items-center gap-2 text-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {badge}
              </span>
            ))}
          </motion.div>
        )}

        {/* Stats */}
        {stats && stats.length > 0 && (
          <motion.div
            variants={itemVariants}
            className={`flex flex-wrap items-center gap-x-8 gap-y-3 mt-6 ${isCentered ? 'justify-center' : ''}`}
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                    fontWeight: 900,
                    color: isDark ? '#7DD3FC' : '#006BB0',
                    lineHeight: 1,
                    ...(isDark ? { textShadow: '0 2px 12px rgba(0,0,0,0.4)' } : {}),
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#9ca3af',
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}