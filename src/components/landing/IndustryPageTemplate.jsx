/**
 * IndustryPageTemplate — Dynamic template for all 9 industry-specific landing pages.
 * Pulls all hero config, pain points, use cases, ROI, testimonials, and features
 * from data/industryMarketingConfig.js — no hardcoded industry logic.
 * Uses SectionHeader for consistent typography across every industry page.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIndustryBySlug } from '@/data/industryMarketingConfig';
import { getPlanFeatures } from '@/lib/saasProductizationConfig';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import IndustryHero from '@/components/industry/IndustryHero';
import { ArrowRight, CheckCircle, TrendingUp, Zap, Phone, Calendar, MessageSquare, AlertCircle, Users, Shield, RotateCw, Smile, Cloud, FileText, FileCheck, MapPin, ClipboardList, Send, Search, Home, CheckSquare, Thermometer } from 'lucide-react';
import SectionHeader from '@/components/design-system/SectionHeader';
import IndustryQualificationForm from '@/components/forms/IndustryQualificationForm';
import IndustrySuccessGallery from '@/components/industry/IndustrySuccessGallery';

// Icon mapping — maps string icon names from config to lucide components
const ICON_MAP = {
  MessageSquare,
  Calendar,
  Phone,
  AlertCircle,
  Zap,
  TrendingUp,
  Users,
  Shield,
  RotateCw,
  Smile,
  Cloud,
  FileText,
  FileCheck,
  MapPin,
  ClipboardList,
  Send,
  Search,
  Home,
  CheckSquare,
  Thermometer,
  CheckCircle,
};

export default function IndustryPageTemplate() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState(null);

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

  // Dynamic hero config — works for ALL industries, not just roofing
  const heroConfig = {
    eyebrow: `${industry.industry_name} AI Automation`,
    headline: industry.hero_headline,
    subheadline: industry.hero_subheadline,
    description: industry.hero_description,
    backgroundImage: null, // No hardcoded image — each industry uses gradient hero
    primaryCTA: {
      label: industry.primary_cta,
      path: '/book',
    },
    secondaryCTA: {
      label: industry.secondary_cta,
      path: '/pricing',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <IndustryHero
        industryKey={slug}
        eyebrow={heroConfig.eyebrow}
        headline={heroConfig.headline}
        subheadline={heroConfig.subheadline}
        description={heroConfig.description}
        backgroundImage={heroConfig.backgroundImage}
        primaryCTA={heroConfig.primaryCTA}
        secondaryCTA={heroConfig.secondaryCTA}
      />

      {/* PAIN POINTS */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="The Problem"
            title={`The ${industry.industry_name} Problem`}
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
            {industry.pain_points.map((point, i) => (
              <div key={i} className="p-5 md:p-6 border border-border rounded-xl bg-muted/30">
                <h3 className="font-titles text-base md:text-lg font-bold text-foreground mb-2">{point.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="How It Works"
            title={`How ${industry.industry_name} Automation Works`}
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
            {industry.use_cases.map((useCase, i) => {
              const IconComponent = ICON_MAP[useCase.icon] || CheckCircle;
              return (
                <div key={i} className="bg-white p-6 md:p-8 rounded-xl border border-border shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-titles text-base md:text-lg font-bold text-foreground mb-2">{useCase.title}</h3>
                      <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4 leading-relaxed">{useCase.description}</p>
                      <p className="text-sm font-semibold text-primary">{useCase.metrics}</p>
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
          <SectionHeader
            eyebrow="Expected Returns"
            title={`Typical ROI For ${industry.industry_name}`}
            align="center"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-6 md:mt-8">
            {Object.entries(industry.roi_metrics).map(([key, value]) => (
              <div key={key} className="p-4 md:p-6 border border-border rounded-xl text-center">
                <p className="text-2xl md:text-3xl font-titles font-bold text-primary mb-2">{value}</p>
                <p className="text-xs md:text-sm text-muted-foreground capitalize">
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
        <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <SectionHeader
              eyebrow="Real Results"
              title={`Real Results From ${industry.industry_name} Leaders`}
              align="center"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
              {industry.testimonials.map((testimonial, i) => (
                <div key={i} className="bg-white p-6 md:p-8 rounded-xl border border-border shadow-sm">
                  <div className="mb-4">
                    <p className="font-titles text-xl md:text-2xl font-bold text-primary">{testimonial.metric}</p>
                  </div>
                  <blockquote className="text-sm md:text-base text-foreground/80 mb-4 md:mb-6 italic leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <p className="font-bold text-foreground text-sm md:text-base">{testimonial.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{testimonial.business}</p>
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
          <SectionHeader
            eyebrow="What's Included"
            title={`Your ${industry.industry_name} System Includes`}
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto mt-6 md:mt-8">
            {industry.key_features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 md:p-4">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base text-foreground/80 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRY QUALIFICATION FORM */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:mb-8">
            <SectionHeader
              eyebrow="Free Automation Audit"
              title={`Is Your ${industry.industry_name} Business Ready?`}
              subtitle="Answer 4 quick questions and we'll tell you exactly which automation system fits your volume, budget, and goals — free, no obligation."
              align="center"
            />
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
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <SectionHeader
            eyebrow="Get Started"
            title={`Ready to Transform Your ${industry.industry_name} Business?`}
            subtitle="Start your automation system today. First consultation is free."
            align="center"
          />
          <div className="mb-6 md:mb-8" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/book')}
              className="cs-btn-primary bg-white text-primary hover:bg-white/90"
              style={{ minHeight: '44px' }}
            >
              {industry.primary_cta}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white rounded-lg text-white font-semibold hover:bg-white/10 transition-colors"
              style={{ minHeight: '44px' }}
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