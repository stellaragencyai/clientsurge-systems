import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIndustryBySlug } from '@/data/industryMarketingConfig';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import IndustryHero from '@/components/industry/IndustryHero';
import { ArrowRight, CheckCircle, TrendingUp, Zap, Phone, Calendar, MessageSquare, AlertCircle, Users, Shield, RotateCw, Smile, Cloud, FileText, FileCheck, MapPin, ClipboardList, Send, Search, Home, CheckSquare, Thermometer, Building2 } from 'lucide-react';
import SectionHeader from '@/components/design-system/SectionHeader';
import IndustryQualificationForm from '@/components/forms/IndustryQualificationForm';
import IndustrySuccessGallery from '@/components/industry/IndustrySuccessGallery';
import { setJsonLd, setPageMetadata } from '@/lib/seo';

const ICON_MAP = { MessageSquare, Calendar, Phone, AlertCircle, Zap, TrendingUp, Users, Shield, RotateCw, Smile, Cloud, FileText, FileCheck, MapPin, ClipboardList, Send, Search, Home, CheckSquare, Thermometer, CheckCircle, Building2 };

const SECTION_SHELL = 'relative overflow-hidden';
const PREMIUM_SURFACE = 'rounded-2xl border border-primary/10 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)]';

function buildIndustryServiceSchema(industry) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: industry.display_name,
    description: industry.seo?.description || industry.hero_description,
    provider: {
      '@type': 'Organization',
      name: 'ClientSurge Systems',
      url: 'https://clientsurgesystems.com',
    },
    areaServed: 'United States',
    serviceType: `${industry.industry_name} AI automation and lead response system`,
    url: `https://clientsurgesystems.com/${industry.slug}`,
  };
}

function buildFaqSchema(industry) {
  if (!industry.faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: industry.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

function proofLabel(status) {
  switch (status) {
    case 'verified':
      return 'Verified proof';
    case 'unverified':
      return 'Unverified placeholder';
    default:
      return 'Proof coming soon';
  }
}

export default function IndustryPageTemplate() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState(null);

  useEffect(() => {
    const data = getIndustryBySlug(slug);
    if (!data) {
      navigate('/');
      return undefined;
    }

    setIndustry(data);

    const cleanupMetadata = setPageMetadata({
      title: data.seo?.title || `${data.display_name} | ClientSurge Systems`,
      description: data.seo?.description || data.hero_description,
      canonicalPath: data.seo?.canonicalPath || `/${data.slug}`,
      ogTitle: data.display_name,
      ogDescription: data.hero_description,
    });
    const cleanupServiceSchema = setJsonLd(`industry-service-${data.slug}`, buildIndustryServiceSchema(data));
    const faqSchema = buildFaqSchema(data);
    const cleanupFaqSchema = faqSchema ? setJsonLd(`industry-faq-${data.slug}`, faqSchema) : null;

    return () => {
      cleanupMetadata?.();
      cleanupServiceSchema?.();
      cleanupFaqSchema?.();
    };
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
                      <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/12 to-sky-100 text-primary border border-primary/20 shadow-sm">
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
        <div className="max-w-6xl mx-auto">
          <SectionHeader eyebrow="Workflow" title={`From First ${industry.industry_name} Inquiry to Next Step`} subtitle="This is the customer journey connection: capture, respond, qualify, and hand off toward booking or package selection." align="center" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 mt-8">
            {industry.workflow?.map((step, i) => (
              <div key={step.title} className={`${PREMIUM_SURFACE} p-5 md:p-6`}>
                <p className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-black">{i + 1}</p>
                <h3 className="font-titles text-base md:text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 px-4 md:px-6 bg-white/70">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="Target Outcomes" title={`What the ${industry.industry_name} System Is Built to Improve`} subtitle="These are target outcomes and workflow examples, not claimed case-study results." align="center" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8">
            {Object.entries(industry.roi_metrics).map(([key, value]) => (
              <div key={key} className={`${PREMIUM_SURFACE} p-5 md:p-6 text-center`}>
                <p className="text-base md:text-lg font-titles font-bold text-primary mb-2 tracking-tight">{value}</p>
                <p className="text-[11px] md:text-xs text-muted-foreground capitalize font-semibold tracking-wide">{key.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
          {industry.roi_examples?.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {industry.roi_examples.map((example) => (
                <div key={example} className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
                  <span className="font-black">Example, not verified proof: </span>{example}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <IndustrySuccessGallery industry={industry} industrySlug={slug} />

      <section className="py-14 md:py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="Proof Policy" title={`Truthful ${industry.industry_name} Proof`} subtitle="No fake case studies, no fake live counters, no fabricated customer results." align="center" />
          <div className={`${PREMIUM_SURFACE} mt-8 p-6 md:p-8`}>
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
              <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="mb-2 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">{proofLabel(industry.proof?.status)}</p>
                <h3 className="font-titles text-xl md:text-2xl font-bold text-foreground">{industry.proof?.label || 'Proof coming soon'}</h3>
                <p className="mt-3 text-sm md:text-base leading-relaxed text-muted-foreground">{industry.proof?.note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 px-4 md:px-6 bg-white/80">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="What's Included" title={`Your ${industry.industry_name} System Includes`} align="center" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto mt-8">
            {industry.key_features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-white/80 p-4 shadow-sm"><CheckCircle className="w-5 h-5 text-primary flex-shrink-0" /><span className="text-sm md:text-base text-foreground/80 font-semibold">{feature}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <SectionHeader eyebrow="FAQs" title={`${industry.industry_name} Automation Questions`} align="center" />
          <div className="mt-8 space-y-4">
            {industry.faqs?.map((faq) => (
              <details key={faq.question} className={`${PREMIUM_SURFACE} p-5 md:p-6 group`}>
                <summary className="cursor-pointer font-titles text-base md:text-lg font-bold text-foreground">{faq.question}</summary>
                <p className="mt-3 text-sm md:text-base leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
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

      <Footer />
    </div>
  );
}
