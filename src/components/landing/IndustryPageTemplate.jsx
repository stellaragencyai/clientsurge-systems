import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIndustryBySlug } from '@/data/industryMarketingConfig';
import { getPlanFeatures } from '@/lib/saasProductizationConfig';
import Navbar from './Navbar';
import Footer from './Footer';
import IndustryHero from '@/components/industry/IndustryHero';
import { ArrowRight, CheckCircle, TrendingUp, Zap, Phone, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import SectionHeader from '@/components/design-system/SectionHeader';
import IndustryQualificationForm from '@/components/forms/IndustryQualificationForm';
import IndustrySuccessGallery from '@/components/industry/IndustrySuccessGallery';

const ROOFING_HERO_IMAGE = 'https://media.base44.com/images/public/69dc4a79656fdba136d413d3/e92b5f56c_watermarked_img_13975777732204341720.jpg';

// Roofing-specific hero configuration
const ROOFING_HERO_CONFIG = {
  eyebrow: 'ROOFING AI AUTOMATION',
  headline: 'AI Automation Systems for Roofing Companies',
  subheadline: 'Capture more roofing leads, respond to missed calls, follow up on quotes, book inspections, request reviews, and reactivate old opportunities with a remote AI-powered setup workflow.',
  description: '',
  primaryCTA: {
    label: 'Start Roofing Setup',
    path: '/start?industry=roofing',
  },
  secondaryCTA: {
    label: 'View Roofing Automations',
    path: '/store?industry=roofing',
  },
  fallbackCTA: {
    label: 'Not sure what to choose? Book Free Audit',
    path: '/book?industry=roofing',
  },
};

export default function IndustryPageTemplate() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState(null);
  const [heroImageUrl, setHeroImageUrl] = useState(ROOFING_HERO_IMAGE);

  useEffect(() => {
    const data = getIndustryBySlug(slug);
    if (data) {
      setIndustry(data);
      document.title = `${data.display_name} | ClientSurge Systems`;
    } else {
      navigate('/');
    }
  }, [slug, navigate]);

  if (!industry) return null;

  const recommendedFeatures = getPlanFeatures(industry.recommended_plan);

  // Determine hero config based on industry slug
  const getHeroConfig = () => {
    if (slug === 'roofing') {
      return {
        ...ROOFING_HERO_CONFIG,
        backgroundImage: heroImageUrl,
      };
    }
    return {
      eyebrow: `${industry.industry_name} Automation`,
      headline: industry.hero_headline,
      subheadline: industry.hero_subheadline,
      description: industry.hero_description,
      backgroundImage: null,
      primaryCTA: {
        label: industry.primary_cta,
        path: '/book',
      },
      secondaryCTA: {
        label: industry.secondary_cta,
        path: '/pricing',
      },
    };
  };

  const heroConfig = getHeroConfig();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      {slug === 'roofing' ? (
        <IndustryHero
          industryKey="roofing"
          eyebrow={ROOFING_HERO_CONFIG.eyebrow}
          headline={ROOFING_HERO_CONFIG.headline}
          subheadline={ROOFING_HERO_CONFIG.subheadline}
          description={ROOFING_HERO_CONFIG.description}
          backgroundImage={ROOFING_HERO_IMAGE}
          primaryCTA={ROOFING_HERO_CONFIG.primaryCTA}
          secondaryCTA={ROOFING_HERO_CONFIG.secondaryCTA}
          fallbackCTA={ROOFING_HERO_CONFIG.fallbackCTA}
        />
      ) : (
        <IndustryHero
          industryKey={slug}
          eyebrow={heroConfig.eyebrow}
          headline={heroConfig.headline}
          subheadline={heroConfig.subheadline}
          description={heroConfig.description}
          backgroundImage={heroConfig.backgroundImage}
          primaryCTA={heroConfig.primaryCTA}
          secondaryCTA={heroConfig.secondaryCTA}
          fallbackCTA={heroConfig.fallbackCTA}
        />
      )}

      {/* PAIN POINTS */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title={`The ${industry.industry_name} Problem`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
            {industry.pain_points.map((point, i) => (
              <div key={i} className="p-5 md:p-6 border border-slate-200 rounded-xl bg-slate-50">
                <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2">{point.title}</h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <SectionHeader title={`How ${industry.industry_name} Automation Works`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
            {industry.use_cases.map((useCase, i) => {
              const ICON_MAP = {
                MessageSquare: MessageSquare,
                Calendar: Calendar,
                Phone: Phone,
                AlertCircle: AlertCircle,
                Zap: Zap,
                TrendingUp: TrendingUp,
              };
              const IconComponent = ICON_MAP[useCase.icon] || CheckCircle;

              return (
                <div key={i} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-100 text-blue-600">
                        <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2">{useCase.title}</h3>
                      <p className="text-sm md:text-base text-slate-600 mb-3 md:mb-4 leading-relaxed">{useCase.description}</p>
                      <p className="text-sm font-semibold text-blue-600">{useCase.metrics}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROI METRICS */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title={`Typical ROI For ${industry.industry_name}`} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-6 md:mt-8">
            {Object.entries(industry.roi_metrics).map(([key, value]) => (
              <div key={key} className="p-4 md:p-6 border border-slate-200 rounded-xl text-center">
                <p className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">{value}</p>
                <p className="text-xs md:text-sm text-slate-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMMERSIVE SUCCESS GALLERY */}
      <IndustrySuccessGallery industry={industry} industrySlug={slug} />

      {/* TESTIMONIALS */}
      {industry.testimonials?.length > 0 && (
        <section className="py-12 md:py-20 px-4 md:px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <SectionHeader title={`Real Results From ${industry.industry_name} Leaders`} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
              {industry.testimonials.map((testimonial, i) => (
                <div key={i} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                  <div className="mb-4">
                    <p className="text-xl md:text-2xl font-bold text-blue-600">{testimonial.metric}</p>
                  </div>
                  <blockquote className="text-sm md:text-base text-slate-700 mb-4 md:mb-6 italic leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <p className="font-bold text-slate-900 text-sm md:text-base">{testimonial.name}</p>
                    <p className="text-xs md:text-sm text-slate-600">{testimonial.business}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title={`Your ${industry.industry_name} System Includes`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto mt-6 md:mt-8">
            {industry.key_features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 md:p-4">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm md:text-base text-slate-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRY QUALIFICATION FORM */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Free Automation Audit</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
              Is Your {industry.industry_name} Business Ready to Automate?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Answer 4 quick questions and we'll tell you exactly which automation system fits your volume, budget, and goals — free, no obligation.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white shadow-sm p-5 md:p-8">
            <IndustryQualificationForm
              industrySlug={slug}
              industryName={industry.industry_name}
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
            Ready to Transform Your {industry.industry_name} Business?
          </h2>
          <p className="text-base md:text-xl text-blue-100 mb-6 md:mb-8">
            Start your automation system today. First consultation is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/book')}
              className="cs-btn-primary bg-white text-blue-600 hover:bg-blue-50 inline-flex items-center justify-center gap-2"
            >
              {industry.primary_cta}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white rounded-lg text-white font-semibold hover:bg-white hover:bg-opacity-10 transition"
            >
              See Pricing
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}