import { useReducedMotion } from 'framer-motion';

/**
 * HeroLogoCarousel
 *
 * IdentityIQ-style hero marquee for truthful integration/tool-stack proof.
 * Uses original brand colors, a white strip, crisp visibility tuning, and a
 * reduced-motion static fallback.
 *
 * Do not relabel this as "trusted by" unless the logos become verified client,
 * press, or partner proof.
 */
const TOOL_LOGOS = [
  {
    name: 'Asana',
    src: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Asana_logo.svg',
    itemWidth: 172,
    imageWidth: 160,
    imageMaxHeight: 46,
  },
  {
    name: 'Cloudflare',
    src: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Cloudflare_Logo.png',
    itemWidth: 206,
    imageWidth: 198,
    imageMaxHeight: 54,
  },
  {
    name: 'ChatGPT',
    src: 'https://media.base44.com/images/public/69dc4a79656fdba136d413d3/09317eed9_Chatgpt-logo-1672775463-logotic-brandsvg.png',
    itemWidth: 204,
    imageWidth: 246,
    imageMaxHeight: 246,
    crop: true,
  },
  {
    name: 'Twilio',
    src: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Twilio-logo-red.svg',
    itemWidth: 192,
    imageWidth: 180,
    imageMaxHeight: 52,
  },
  {
    name: 'Stripe',
    src: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    itemWidth: 150,
    imageWidth: 138,
    imageMaxHeight: 54,
  },
  {
    name: 'Resend',
    src: 'https://media.base44.com/images/public/69dc4a79656fdba136d413d3/edd28679a_resend-logo-png_seeklogo-623015.png',
    itemWidth: 200,
    imageWidth: 238,
    imageMaxHeight: 238,
    crop: true,
  },
];

const MARQUEE_LOGOS = [...TOOL_LOGOS, ...TOOL_LOGOS, ...TOOL_LOGOS];

function LogoMark({ logo, duplicate = false }) {
  return (
    <div
      className={`cs-hero-logo-carousel__mark${logo.crop ? ' cs-hero-logo-carousel__mark--crop' : ''}`}
      style={{
        '--cs-logo-item-width': `${logo.itemWidth}px`,
        '--cs-logo-image-width': `${logo.imageWidth}px`,
        '--cs-logo-image-max-height': `${logo.imageMaxHeight}px`,
      }}
      aria-hidden={duplicate ? 'true' : undefined}
    >
      <img
        src={logo.src}
        alt={duplicate ? '' : `${logo.name} logo`}
        loading="eager"
        decoding="async"
        draggable="false"
      />
    </div>
  );
}

export default function HeroLogoCarousel() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="cs-hero-logo-carousel" aria-label="Automation tools ClientSurge can connect with">
      <style>{`
        .cs-hero-logo-carousel {
          width: min(100%, 1080px);
          margin: clamp(0.75rem, 2vw, 1.25rem) auto 0;
        }

        .cs-hero-logo-carousel__label {
          margin: 0 0 0.65rem;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: clamp(0.66rem, 1.3vw, 0.76rem);
          font-weight: 800;
          letter-spacing: 0.18em;
          line-height: 1.35;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.54);
        }

        .cs-hero-logo-carousel__viewport {
          position: relative;
          width: 100%;
          height: clamp(86px, 7.5vw, 112px);
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.92);
          box-shadow:
            0 20px 55px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.86);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
        }

        .cs-hero-logo-carousel__track {
          display: flex;
          align-items: center;
          gap: clamp(2.6rem, 5.1vw, 4.5rem);
          width: max-content;
          height: 100%;
          padding-inline: clamp(2rem, 5vw, 4rem);
          animation: csHeroLogoFlow 31.5s linear infinite;
          will-change: transform;
        }

        .cs-hero-logo-carousel__mark {
          position: relative;
          flex: 0 0 auto;
          width: var(--cs-logo-item-width);
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
          filter: contrast(1.05) saturate(1.06);
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .cs-hero-logo-carousel__mark img {
          display: block;
          width: var(--cs-logo-image-width);
          max-width: none;
          max-height: var(--cs-logo-image-max-height);
          height: auto;
          object-fit: contain;
          image-rendering: auto;
          transform: translateZ(0);
          user-select: none;
        }

        .cs-hero-logo-carousel__mark--crop {
          overflow: hidden;
        }

        .cs-hero-logo-carousel__mark--crop img {
          position: absolute;
          left: 50%;
          top: 50%;
          max-height: none;
          transform: translate3d(-50%, -50%, 0);
        }

        .cs-hero-logo-carousel__static {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.9rem;
          padding: 1rem;
        }

        .cs-hero-logo-carousel__static .cs-hero-logo-carousel__mark {
          width: 100%;
          height: 54px;
        }

        @keyframes csHeroLogoFlow {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333%, 0, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-hero-logo-carousel__track {
            animation: none;
            transform: none;
          }
        }

        @media (max-width: 640px) {
          .cs-hero-logo-carousel {
            width: min(100%, 94vw);
          }

          .cs-hero-logo-carousel__viewport {
            height: 92px;
            border-radius: 26px;
            -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%);
          }

          .cs-hero-logo-carousel__track {
            gap: 2.35rem;
            padding-inline: 1.5rem;
            animation-duration: 28s;
          }

          .cs-hero-logo-carousel__mark {
            transform: scale(0.86) translateZ(0);
            transform-origin: center;
          }

          .cs-hero-logo-carousel__static {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      <p className="cs-hero-logo-carousel__label">Works with the tools modern businesses already use.</p>

      <div className="cs-hero-logo-carousel__viewport">
        {shouldReduceMotion ? (
          <div className="cs-hero-logo-carousel__static">
            {TOOL_LOGOS.map((logo) => (
              <LogoMark key={logo.name} logo={logo} />
            ))}
          </div>
        ) : (
          <div className="cs-hero-logo-carousel__track">
            {MARQUEE_LOGOS.map((logo, index) => (
              <LogoMark
                key={`${logo.name}-${index}`}
                logo={logo}
                duplicate={index >= TOOL_LOGOS.length}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
