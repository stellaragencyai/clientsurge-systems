import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIndustryBySlug } from '@/data/industryMarketingConfig';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import IndustryHero from '@/components/industry/IndustryHero';
import { ArrowRight, CheckCircle, TrendingUp, Zap, Phone, Calendar, MessageSquare, AlertCircle, Users, Shield, RotateCw, Smile, Cloud, FileText, FileCheck, MapPin, ClipboardList, Send, Search, Home, CheckSquare, Thermometer } from 'lucide-react';
import SectionHeader from '@/components/design-system/SectionHeader';
import IndustryQualificationForm from '@/components/forms/IndustryQualificationForm';
import IndustrySuccessGallery from '@/components/industry/IndustrySuccessGallery';

const ICON_MAP = { MessageSquare, Calendar, Phone, AlertCircle, Zap, TrendingUp, Users, Shield, RotateCw, Smile, Cloud, FileText, FileCheck, MapPin, ClipboardList, Send, Search, Home, CheckSquare, Thermometer, CheckCircle };

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

  const heroConfig = {
    eyebrow: `${industry.industry_name} AI System`,
    headline: industry.hero_headline,
    subheadline: industry.hero_subheadline,
    description: industry.hero_description,
    backgroundImage: null,
    primaryCTA: { label: industry.primary_cta, path: '/pricing' },
    secondaryCTA: { label: industry.secondary_cta, path: '/automations' },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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

      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="The Problem" title={`Where ${industry.industry_name} Leads Slip`} align="center" />
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

      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeader eyebrow="How It Works" title={`How ClientSurge Supports ${industry.industry_name}`} align="center" />
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

      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="Launch Focus" title={`What the ${industry.industry_name} System Is Built to Improve`} align="center" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-6 md:mt-8">
            {Object.entries(industry.roi_metrics).map(([key, value]) => (
              <div key={key} className="p-4 md:p-6 border border-border rounded-xl text-center">
                <p className="text-xl md:text-2xl font-titles font-bold text-primary mb-2">{value}</p>
                <p className="text-xs md:text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <IndustrySuccessGallery industry={industry} industrySlug={slug} />

      {industry.testimonials?.length > 0 && (
        <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <SectionHeader eyebrow="Proof" title={`Verified ${industry.industry_name} Proof`} align="center" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
              {industry.testimonials.map((testimonial, i) => (
                <div key={i} className="bg-white p-6 md:p-8 rounded-xl border border-border shadow-sm">
                  <p className="font-titles text-xl md:text-2xl font-bold text-primary mb-4">{testimonial.metric}</p>
                  <blockquote className="text-sm md:text-base text-foreground/80 mb-4 md:mb-6 italic leading-relaxed">"{testimonial.quote}"</blockquote>
                  <p className="font-bold text-foreground text-sm md:text-base">{testimonial.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{testimonial.business}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="What's Included" title={`Your ${industry.industry_name} System Includes`} align="center" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto mt-6 md:mt-8">
            {industry.key_features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 md:p-4"><CheckCircle className="w-5 h-5 text-primary flex-shrink-0" /><span className="text-sm md:text-base text-foreground/80 font-medium">{feature}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:mb-8">
            <SectionHeader eyebrow="Guided System Match" title={`Which ${industry.industry_name} System Fits?`} subtitle="Answer 4 quick questions and we will help match your lead flow to Starter, Growth, or Pro." align="center" />
          </div>
          <div className="rounded-2xl border border-border bg-white shadow-sm p-5 md:p-8"><IndustryQualificationForm industrySlug={slug} industryName={industry.industry_name} /></div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <SectionHeader eyebrow="Get Started" title={`Install a ${industry.industry_name} Lead Flow System`} subtitle="Compare packages, choose the system, and move into guided setup." align="center" />
          <div className="mb-6 md:mb-8" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/pricing')} className="cs-btn-primary" style={{ minHeight: '44px' }}>{industry.primary_cta}<ArrowRight className="w-4 h-4" /></button>
            <button onClick={() => navigate('/automations')} className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary rounded-lg text-primary font-semibold hover:bg-primary/10 transition-colors" style={{ minHeight: '44px' }}>View Automation Stack</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
