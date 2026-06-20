import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIndustryBySlug } from '@/data/industryMarketingConfig';
import { getPlanFeatures } from '@/lib/saasProductizationConfig';
import { base44 } from '@/api/base44Client';
import Navbar from './Navbar';
import Footer from './Footer';
import IndustryHero from '@/components/industry/IndustryHero';
import { ArrowRight, CheckCircle, TrendingUp, Zap } from 'lucide-react';

// Fallback hero image URL
const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=900&fit=crop';

// Roofing-specific hero configuration
const ROOFING_HERO_CONFIG = {
  eyebrow: 'ROOFING AI AUTOMATION',
  headline: 'AI Automation Systems for Roofing Companies',
  subheadline: 'Capture more roofing leads, respond to missed calls, follow up on quotes, book inspections, request reviews, and reactivate old opportunities with a remote AI-powered setup workflow.',
  description: '',
  backgroundImage: null, // Dynamically set from Google Drive
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
  const [heroImageUrl, setHeroImageUrl] = useState(FALLBACK_HERO_IMAGE);

  useEffect(() => {
    const data = getIndustryBySlug(slug);
    if (data) {
      setIndustry(data);
      document.title = `${data.display_name} | ClientSurge Systems`;
    } else {
      navigate('/');
    }
  }, [slug, navigate]);

  // Fetch roofing hero image from Google Drive on mount
  useEffect(() => {
    if (slug === 'roofing') {
      base44.functions
        .invoke('syncRoofingHeroImageFromGoogleDrive', {})
        .then((res) => {
          if (res?.data?.imageUrl) {
            setHeroImageUrl(res.data.imageUrl);
          }
        })
        .catch((err) => {
          console.warn('Failed to sync Google Drive image, using fallback:', err);
          setHeroImageUrl(FALLBACK_HERO_IMAGE);
        });
    }
  }, [slug]);

  if (!industry) return null;

  const recommendedFeatures = getPlanFeatures(industry.recommended_plan);

  // Determine hero config based on industry slug
  const getHeroConfig = () => {
    if (slug === 'roofing') {
      return {
        ...ROOFING_HERO_CONFIG,
        backgroundImage: heroImageUrl, // Use dynamically synced Google Drive image
      };
    }
    // Fallback: generate from industry data for other industries
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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO — Uses IndustryHero component for reusable cinematic/standard template */}
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

      {/* PAIN POINTS */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">
            The {industry.industry_name} Problem
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {industry.pain_points.map((point, i) => (
              <div key={i} className="p-6 border border-slate-200 rounded-xl bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{point.title}</h3>
                <p className="text-slate-600">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">
            How {industry.industry_name} Automation Works
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {industry.use_cases.map((useCase, i) => {
              const IconComponent = useCase.icon === 'MessageSquare' ? () => <Zap className="w-6 h-6" />
                : useCase.icon === 'Calendar' ? () => <TrendingUp className="w-6 h-6" />
                : useCase.icon === 'Phone' ? () => <Zap className="w-6 h-6" />
                : useCase.icon === 'AlertCircle' ? () => <TrendingUp className="w-6 h-6" />
                : () => <CheckCircle className="w-6 h-6" />;

              return (
                <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600">
                        <IconComponent />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{useCase.title}</h3>
                      <p className="text-slate-600 mb-4">{useCase.description}</p>
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
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">
            Typical ROI For {industry.industry_name}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(industry.roi_metrics).map(([key, value]) => (
              <div key={key} className="p-6 border border-slate-200 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-600 mb-2">{value}</p>
                <p className="text-sm text-slate-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {industry.testimonials?.length > 0 && (
        <section className="py-20 px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">
              Real Results From {industry.industry_name} Leaders
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {industry.testimonials.map((testimonial, i) => (
                <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-blue-600">{testimonial.metric}</p>
                  </div>
                  <blockquote className="text-slate-700 mb-6 italic leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.business}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">
            Your {industry.industry_name} System Includes
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {industry.key_features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-slate-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your {industry.industry_name} Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
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