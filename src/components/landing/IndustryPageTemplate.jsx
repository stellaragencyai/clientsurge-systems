import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIndustryBySlug } from '@/data/industryMarketingConfig';
import { getMergedIndustryData } from '@/data/industryContent';
import { getPremiumContent } from '@/data/industryPremiumContent';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import IndustryHero from '@/components/industry/IndustryHero';
import AutomationTierSection from '@/components/industry/AutomationTierSection';
import CaseStudySection from '@/components/industry/CaseStudySection';
import IndustryProblemSection from '@/components/industry/IndustryProblemSection';
import IndustrySolutionSection from '@/components/industry/IndustrySolutionSection';
import RevenueLeakSection from '@/components/industry/RevenueLeakSection';
import LeadCaptureWorkflowSection from '@/components/industry/LeadCaptureWorkflowSection';
import IndustryBenefitsSection from '@/components/industry/IndustryBenefitsSection';
import RecommendedSystemSection from '@/components/industry/RecommendedSystemSection';
import IndustryFAQ from '@/components/industry/IndustryFAQ';
import IndustryFinalCTA from '@/components/industry/IndustryFinalCTA';
import { ArrowRight, CheckCircle, TrendingUp, Zap, Phone, Calendar, MessageSquare, AlertCircle, Users, Shield, RotateCw, Smile, Cloud, FileText, FileCheck, MapPin, ClipboardList, Send, Search, Home, CheckSquare, Thermometer } from 'lucide-react';
import SectionHeader from '@/components/design-system/SectionHeader';
import IndustryQualificationForm from '@/components/forms/IndustryQualificationForm';
import IndustrySuccessGallery from '@/components/industry/IndustrySuccessGallery';

const ICON_MAP = { MessageSquare, Calendar, Phone, AlertCircle, Zap, TrendingUp, Users, Shield, RotateCw, Smile, Cloud, FileText, FileCheck, MapPin, ClipboardList, Send, Search, Home, CheckSquare, Thermometer, CheckCircle };

const SECTION_SHELL = 'relative overflow-hidden';
const PREMIUM_SURFACE = 'rounded-2xl border border-primary/10 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)]';

function setMetaTag(name, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export default function IndustryPageTemplate() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState(null);
  const [premium, setPremium] = useState(null);

  useEffect(() => {
    const baseData = getIndustryBySlug(slug);
    if (baseData) {
      const merged = getMergedIndustryData(slug, baseData);
      setIndustry(merged);
      const premiumContent = getPremiumContent(slug);
      setPremium(premiumContent);

      // SEO metadata injection
      if (premiumContent?.seo) {
        document.title = premiumContent.seo.title;
        setMetaTag('description', premiumContent.seo.metaDescription);
        setMetaTag('keywords', premiumContent.seo.keywords.join(', '));
      } else {
        document.title = `${merged.display_name} | ClientSurge Systems`;
      }
    } else {
      navigate('/');
    }
  }, [slug, navigate]);

  if (!industry) return null;

  const heroConfig = premium
    ? {
        eyebrow: `${industry.industry_name} AI System`,
        headline: premium.hero.headline,
        subheadline: premium.hero.subheadline,
        description: premium.hero.description,
        backgroundImage: industry.hero_image || null,
        primaryCTA: { label: premium.hero.primaryCTA, path: '/pricing' },
        secondaryCTA: { label: premium.hero.secondaryCTA, path: '/automations' },
      }
    : {
        eyebrow: `${industry.industry_name} AI System`,
        headline: industry.hero_headline,
        subheadline: industry.hero_subheadline,
        description: industry.hero_description,
        backgroundImage: industry.hero_image || null,
        primaryCTA: { label: industry.primary_cta, path: '/pricing' },
        secondaryCTA: { label: industry.secondary_cta, path: '/automations' },
      };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,rgba(0,174,239,0.10),transparent_30%),linear-gradient(180deg,#f8fcff_0%,#ffffff_34%,#f7fbff_100%)]">
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

      {premium ? (
        <>
          {/* ── PREMIUM SECTIONS (Sprint 3.1) ── */}

          <IndustryProblemSection painPoints={premium.painPoints} />

          <IndustrySolutionSection
            solutions={premium.automationSolutions}
            industryName={industry.industry_name}
          />

          <RevenueLeakSection revenueLeak={premium.revenueLeak} />

          <LeadCaptureWorkflowSection workflow={premium.leadCaptureWorkflow} />

          {/* Keep existing automation tier + case study + gallery sections */}
          <AutomationTierSection industry={industry} />

          <CaseStudySection industry={industry} />

          <IndustrySuccessGallery industry={industry} industrySlug={slug} />

          {industry.testimonials?.length > 0 && (
            <section className="py-14 md:py-20 px-4 md:px-6 bg-white/80">
              <div className="max-w-5xl mx-auto">
                <SectionHeader eyebrow="Proof" title={`Verified ${industry.industry_name} Proof`} align="center" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-8">
                  {industry.testimonials.map((testimonial, i) => (
                    <div key={i} className={`${PREMIUM_SURFACE} p-6 md:p-8`}>
                      <p className="font-titles text-xl md:text-2xl font-bold text-primary mb-4">{testimonial.metric}</p>
                      <blockquote className="text-sm md:text-base text-foreground/80 mb-5 italic leading-relaxed">&quot;{testimonial.quote}&quot;</blockquote>
                      <p className="font-bold text-foreground text-sm md:text-base">{testimonial.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{testimonial.business}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <IndustryBenefitsSection benefits={premium.benefits} />

          <RecommendedSystemSection recommendedSystem={premium.recommendedSystem} />

          <IndustryFAQ faqs={premium.faq} />

          <section className="py-14 md:py-20 px-4 md:px-6 bg-white/80">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <SectionHeader eyebrow="Guided System Match" title={`Which ${industry.industry_name} System Fits?`} subtitle="Answer 4 quick questions and we will help match your lead flow to Starter, Growth, or Pro." align="center" />
              </div>
              <div className="rounded-3xl border border-primary/15 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.10)] p-5 md:p-8"><IndustryQualificationForm industrySlug={slug} industryName={industry.industry_name} /></div>
            </div>
          </section>

          <IndustryFinalCTA finalCTA={premium.finalCTA} />
        </>
      ) : (
        <>
          {/* ── LEGACY SECTIONS (non-Sprint-3.1 industries) ── */}

          <section className={`${SECTION_SHELL} py-14 md:py-20 px-4 md:px-6`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="max-w-6xl mx-auto">
              <SectionHeader eyebrow="The Lead Leak" title={`Where ${industry.industry_name} Opportunities Slip`} align="center" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
                {industry.pain_points.map((point, i) => (
                  <div key={i} className={`${PREMIUM_SURFACE} p-6 md:p-7 transition-transform duration-200 hover:-translate-y-1`}>
                    <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/8 text-primary font-black">{i + 1}</div>
                    <h3 className="font-titles text-lg md:text-xl font-bold text-foreground mb-2 tracking-tight">{point.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{point.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-14 md:py-20 px-4 md:px-6 bg-white/70">
            <div className="max-w-6xl mx-auto">
              <SectionHeader eyebrow="Operating Layer" title={`How ClientSurge Supports ${industry.industry_name}`} align="center" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-8">
                {industry.use_cases.map((useCase, i) => {
                  const IconComponent = ICON_MAP[useCase.icon] || CheckCircle;
                  return (
                    <div key={i} className={`${PREMIUM_SURFACE} p-6 md:p-8`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-gradient-to-br from-primary/12 to-sky-100 text-primary border border-primary/20 shadow-sm">
                            <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-titles text-lg md:text-xl font-bold text-foreground mb-2 tracking-tight">{useCase.title}</h3>
                          <p className="text-sm md:text-base text-muted-foreground mb-4 leading-relaxed">{useCase.description}</p>
                          <p className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">{useCase.metrics}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="py-14 md:py-20 px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <SectionHeader eyebrow="Launch Focus" title={`What the ${industry.industry_name} System Is Built to Improve`} align="center" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8">
                {Object.entries(industry.roi_metrics).map(([key, value]) => (
                  <div key={key} className={`${PREMIUM_SURFACE} p-5 md:p-6 text-center`}>
                    <p className="text-lg md:text-xl font-titles font-bold text-primary mb-2 tracking-tight">{value}</p>
                    <p className="text-[11px] md:text-xs text-muted-foreground capitalize font-semibold tracking-wide">{key.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <AutomationTierSection industry={industry} />

          <CaseStudySection industry={industry} />

          <IndustrySuccessGallery industry={industry} industrySlug={slug} />

          {industry.testimonials?.length > 0 && (
            <section className="py-14 md:py-20 px-4 md:px-6 bg-white/80">
              <div className="max-w-5xl mx-auto">
                <SectionHeader eyebrow="Proof" title={`Verified ${industry.industry_name} Proof`} align="center" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-8">
                  {industry.testimonials.map((testimonial, i) => (
                    <div key={i} className={`${PREMIUM_SURFACE} p-6 md:p-8`}>
                      <p className="font-titles text-xl md:text-2xl font-bold text-primary mb-4">{testimonial.metric}</p>
                      <blockquote className="text-sm md:text-base text-foreground/80 mb-5 italic leading-relaxed">&quot;{testimonial.quote}&quot;</blockquote>
                      <p className="font-bold text-foreground text-sm md:text-base">{testimonial.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{testimonial.business}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="py-14 md:py-20 px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <SectionHeader eyebrow="What's Included" title={`Your ${industry.industry_name} System Includes`} align="center" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto mt-8">
                {industry.key_features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-white/80 p-4 shadow-sm"><CheckCircle className="w-5 h-5 text-primary flex-shrink-0" /><span className="text-sm md:text-base text-foreground/80 font-semibold">{feature}</span></div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-14 md:py-20 px-4 md:px-6 bg-white/80">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <SectionHeader eyebrow="Guided System Match" title={`Which ${industry.industry_name} System Fits?`} subtitle="Answer 4 quick questions and we will help match your lead flow to Starter, Growth, or Pro." align="center" />
              </div>
              <div className="rounded-3xl border border-primary/15 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.10)] p-5 md:p-8"><IndustryQualificationForm industrySlug={slug} industryName={industry.industry_name} /></div>
            </div>
          </section>

          <section className="py-16 md:py-24 px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center rounded-3xl border border-primary/15 bg-gradient-to-br from-[#003b8f] to-[#00aeef] p-8 md:p-12 text-white shadow-[0_24px_80px_rgba(0,107,176,0.24)]">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-white/75">Get Started</p>
              <h2 className="font-titles text-3xl md:text-4xl font-bold tracking-tight">Install a {industry.industry_name} Lead Flow System</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-white/82">Compare packages, choose the system, and move into guided setup with a clearer path from first inquiry to booked appointment.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigate('/pricing')} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-primary shadow-lg transition-transform hover:-translate-y-0.5" style={{ minHeight: '44px' }}>{industry.primary_cta}<ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => navigate('/automations')} className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/30 bg-white/10 text-sm font-bold text-white backdrop-blur hover:bg-white/16 transition-colors" style={{ minHeight: '44px' }}>View Automation Stack</button>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}