import { useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { setPageMetadata } from "@/lib/seo";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";

const SUPPORT_EMAIL = "support@clientsurgesystems.com";
const SUPPORT_PHONE = "(602) 584-3227";
const SUPPORT_PHONE_HREF = "tel:+16025843227";

const POLICIES = {
  privacy: {
    title: "Privacy Policy",
    updated: "June 28, 2026",
    canonicalPath: "/privacy-policy",
    summary: "How ClientSurge Systems collects, uses, protects, and shares information for lead capture, booking, messaging, payments, analytics, and AI-assisted automation services.",
    sections: [
      {
        id: "information-we-collect",
        title: "Information We Collect",
        body: [
          "We collect information you provide directly, including business name, contact name, phone number, email address, website URL, service interest, messages submitted through forms, booking details, and information needed to respond to your inquiry.",
          "We may also collect operational records such as source page, UTM parameters, timestamps, consent text version, provider delivery status, order status, and automation or support activity related to your request.",
        ],
      },
      {
        id: "how-we-use-information",
        title: "How We Use Your Information",
        body: [
          "We use information to respond to inquiries, schedule automation audits, provide and improve AI automation services, support lead capture and booking workflows, send relevant follow-up communications, and maintain business records.",
          "We may use internal records to troubleshoot website, payment, phone, SMS, email, analytics, and automation issues.",
        ],
      },
      {
        id: "sms-email-communications",
        title: "SMS and Email Communications",
        body: [
          "If you provide a phone number or email address and opt in where required, we may send requested follow-ups, appointment reminders, booking confirmations, missed-call text-back messages, review requests, customer reactivation messages, service updates, and related business communications.",
          "Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase. You may opt out of SMS by replying STOP or by contacting us.",
        ],
      },
      {
        id: "ai-call-recording",
        title: "Call Recording, AI Voice, and Conversation Summaries",
        body: [
          "We may use AI-assisted voice tools, call summaries, and conversation analysis to support customer service, appointment scheduling, lead routing, training, quality assurance, and service improvement.",
          "Where enabled and permitted by law, calls may be recorded or summarized. We may store call metadata, transcripts, summaries, caller details, message history, and follow-up notes as part of our business records.",
        ],
      },
      {
        id: "ai-processing",
        title: "AI and Automation Processing",
        body: [
          "We may process inquiry details, message history, booking context, business information, and service preferences through automation and AI-assisted systems to classify leads, draft replies, summarize conversations, recommend next steps, route requests, and support customer service.",
          "AI-assisted outputs may be reviewed, edited, or overridden by our team before use when appropriate.",
        ],
      },
      {
        id: "cookies-tracking",
        title: "Cookies, Analytics, and Tracking",
        body: [
          "We may use cookies, analytics, pixels, UTM parameters, and similar technologies to understand website traffic, measure marketing performance, improve forms and booking flows, and prevent abuse.",
        ],
      },
      {
        id: "data-sharing",
        title: "Data Sharing and Third-Party Services",
        body: [
          "We do not sell your personal information. We share data only with service providers needed to operate the website, forms, messaging, payments, email, analytics, automation, and AI workflows.",
          "These providers may include Base44, Twilio, Resend, Stripe, OpenAI, Google, Calendly, and similar infrastructure or business service vendors.",
        ],
      },
      {
        id: "data-retention",
        title: "Data Retention",
        body: [
          "We retain contact records and business inquiry data for as long as reasonably needed to provide services, maintain records, support legal obligations, and improve operations. We may delete or anonymize records that are no longer needed.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "June 28, 2026",
    canonicalPath: "/terms",
    summary: "The service terms governing ClientSurge Systems subscriptions, billing, AI automation use, customer responsibilities, acceptable use, and limitations.",
    sections: [
      {
        id: "services",
        title: "Services",
        body: [
          "ClientSurge Systems provides AI-powered lead automation services on a monthly subscription basis. Service tiers and pricing are listed at clientsurgesystems.com/pricing. By using our services, you agree to these terms.",
        ],
      },
      {
        id: "billing-renewal",
        title: "Subscription Billing and Auto-Renewal",
        body: [
          "Monthly subscriptions automatically renew each billing period until canceled. By purchasing a subscription, you authorize ClientSurge Systems and its payment processor to charge the payment method on file for recurring monthly fees, applicable setup fees, add-ons, taxes, and other amounts disclosed at checkout.",
          "Subscriptions renew automatically unless you cancel before your next billing date. You may cancel by contacting ClientSurge Systems before your renewal date.",
        ],
      },
      {
        id: "cancellation-changes",
        title: "Cancellation and Changes",
        body: [
          "You may request cancellation, pause, resume, upgrade, or downgrade support by contacting ClientSurge Systems. Cancellation takes effect at the end of the then-current billing period unless otherwise stated in writing.",
          "Setup fees and already-paid monthly subscription fees are non-refundable except where required by law or expressly agreed in writing.",
        ],
      },
      {
        id: "payment-processing",
        title: "Payment Processing",
        body: [
          "Payments are processed by Stripe or another third-party payment processor. You are responsible for keeping billing information current. Failed, disputed, or past-due payments may delay onboarding, pause service delivery, or limit access to active automations until billing is resolved.",
        ],
      },
      {
        id: "sms-compliance",
        title: "SMS Compliance",
        body: [
          "When you submit a form and check the communication consent box, book a requested appointment, or otherwise opt in, you consent to receive automated and non-automated text messages from ClientSurge Systems related to your inquiry, appointments, service updates, and follow-up.",
          "Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out or contact ClientSurge Systems to update communication preferences.",
        ],
      },
      {
        id: "ai-outputs",
        title: "AI and Automation Outputs",
        body: [
          "AI-assisted messages, summaries, recommendations, and automations are provided to support business workflows. You are responsible for reviewing business-critical outputs, maintaining accurate business information, honoring customer opt-outs, collecting and maintaining legally sufficient consent for your own customer communications, and using the services in compliance with applicable laws and platform rules.",
        ],
      },
      {
        id: "ai-voice-recording",
        title: "AI Voice and Call Recording Responsibilities",
        body: [
          "Some ClientSurge services may include AI-assisted phone, SMS, email, or booking workflows. Clients are responsible for approving customer-facing scripts, providing accurate business details, honoring opt-outs, and ensuring their own use of call recording, AI voice, SMS, email, and customer communications complies with laws, regulations, and platform rules that apply to their business.",
        ],
      },
      {
        id: "client-responsibilities",
        title: "Client Responsibilities and Access",
        body: [
          "You are responsible for providing accurate business information, timely access to required accounts, and approvals needed for configuration. Delays in providing access or information may delay setup and launch. You are responsible for maintaining the security of your own accounts and credentials.",
        ],
      },
      {
        id: "acceptable-use",
        title: "Acceptable Use",
        body: [
          "You agree not to use ClientSurge services for unlawful, abusive, or fraudulent purposes, including sending unsolicited messages, violating consent requirements, impersonating other businesses, or using the platform to harm others. Violation may result in suspension or termination of services without refund.",
        ],
      },
      {
        id: "no-guarantee",
        title: "No Guarantee of Specific Results",
        body: [
          "ClientSurge Systems provides automation infrastructure, workflow configuration, and support services. We do not guarantee specific revenue results, lead conversion rates, booking volumes, or business outcomes. Results depend on your offer, market, traffic, sales process, industry, and execution.",
        ],
      },
      {
        id: "liability-law",
        title: "Limitation of Liability and Governing Law",
        body: [
          "ClientSurge Systems is not liable for indirect or consequential damages. Our total liability shall not exceed the amount paid in the prior 30 days. These terms are governed by the laws of the State of Arizona.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund & Cancellation Policy",
    updated: "June 28, 2026",
    canonicalPath: "/refund-policy",
    summary: "How ClientSurge Systems reviews refunds, cancellations, billing errors, setup fees, monthly subscriptions, and digital service delivery issues.",
    sections: [
      {
        id: "services-overview",
        title: "Services Overview",
        body: [
          "ClientSurge Systems provides custom AI automation setup, software configuration, workflow implementation, AI agent setup, and recurring monthly automation support services. Because our work involves custom setup, configuration, and digital service delivery, we do not accept physical returns or exchanges.",
        ],
      },
      {
        id: "refund-eligibility",
        title: "Refund Eligibility",
        body: [
          "Setup fees, installation fees, and onboarding fees are generally non-refundable once work has begun. This includes account configuration, workflow planning, AI setup, automation installation, software integration, client onboarding, or any other implementation work performed for the customer.",
          "Monthly subscription charges may be canceled before the next billing cycle. Cancellation stops future billing but does not automatically refund prior charges.",
        ],
      },
      {
        id: "review-window",
        title: "30-Day Review Window",
        body: [
          "Customers may contact ClientSurge Systems within 30 days of purchase if they believe there was a billing error, duplicate charge, service access issue, or failure to deliver the purchased service. Refund requests are reviewed case by case.",
        ],
        lists: [
          {
            title: "A refund may be approved if:",
            items: [
              "The customer was charged incorrectly.",
              "The customer was charged more than once for the same service.",
              "ClientSurge Systems is unable to begin or deliver the purchased service.",
              "A written refund exception is approved by ClientSurge Systems.",
            ],
          },
          {
            title: "A refund may be denied if:",
            items: [
              "Custom setup work has already begun.",
              "The customer failed to provide required access, approvals, business information, or third-party account permissions.",
              "The customer changed their mind after onboarding or implementation started.",
              "The service was delivered or made available as described.",
              "The customer violated the Terms of Service.",
            ],
          },
        ],
      },
      {
        id: "cancellations",
        title: "Cancellations",
        body: [
          "Customers may request cancellation of their monthly subscription by contacting ClientSurge Systems. Cancellation requests should be submitted before the next billing date. Once canceled, the customer will not be billed for future monthly service periods.",
        ],
      },
      {
        id: "no-returns",
        title: "No Returns or Exchanges",
        body: [
          "ClientSurge Systems does not sell physical goods. Returns and exchanges do not apply.",
        ],
      },
    ],
  },
};

const TYPE_ALIASES = {
  privacy: "privacy",
  "privacy-policy": "privacy",
  terms: "terms",
  "terms-of-service": "terms",
  refund: "refund",
  "refund-policy": "refund",
  cancellations: "refund",
};

function resolvePolicyType({ fixedType, routeType, pathname }) {
  const explicit = TYPE_ALIASES[String(fixedType || "").toLowerCase()];
  if (explicit) return explicit;

  const route = TYPE_ALIASES[String(routeType || "").toLowerCase()];
  if (route) return route;

  const path = String(pathname || "").toLowerCase();
  if (path.includes("terms")) return "terms";
  if (path.includes("refund") || path.includes("cancellation")) return "refund";
  return "privacy";
}

function PolicyTabs({ activeType }) {
  const tabs = [
    { type: "privacy", label: "Privacy", href: "/privacy-policy" },
    { type: "terms", label: "Terms", href: "/terms" },
    { type: "refund", label: "Refunds", href: "/refund-policy" },
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-primary/15 bg-muted/40 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.type}
          to={tab.href}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            activeType === tab.type
              ? "bg-white text-primary shadow-sm"
              : "text-muted-foreground hover:bg-white hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

function PolicySection({ section, index }) {
  return (
    <section id={section.id} className="scroll-mt-28 border-b border-border pb-8 last:border-b-0">
      <div className="mb-3 flex items-baseline gap-3">
        <span className="text-xs font-black text-primary">{index + 1}.</span>
        <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">{section.title}</h2>
      </div>
      <div className="space-y-3 pl-7 text-sm leading-7 text-foreground/85 sm:text-base">
        {(section.body || []).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {(section.lists || []).map((list) => (
          <div key={list.title} className="pt-2">
            <p className="mb-2 font-bold text-foreground">{list.title}</p>
            <ul className="space-y-1.5">
              {list.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LegalPage({ fixedType, canonicalPath }) {
  const { type: routeType } = useParams();
  const location = useLocation();
  const policyType = useMemo(
    () => resolvePolicyType({ fixedType, routeType, pathname: location.pathname }),
    [fixedType, routeType, location.pathname]
  );
  const policy = POLICIES[policyType] || POLICIES.privacy;

  useEffect(() => {
    setPageMetadata({
      title: `${policy.title} | ClientSurge Systems`,
      description: policy.summary,
      canonicalPath: canonicalPath || policy.canonicalPath,
      ogTitle: `${policy.title} | ClientSurge Systems`,
      ogDescription: policy.summary,
    });
  }, [canonicalPath, policy]);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main className="px-4 pb-16 pt-[calc(var(--cs-nav-height)+3rem)] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 rounded-3xl border border-primary/15 bg-white p-6 shadow-sm sm:p-8">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-primary">Legal</p>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">{policy.title}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{policy.summary}</p>
                  <p className="mt-3 text-xs font-semibold text-muted-foreground">Last updated: {policy.updated}</p>
                </div>
                <PolicyTabs activeType={policyType} />
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-8 rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
                {policy.sections.map((section, index) => (
                  <PolicySection key={section.id} section={section} index={index} />
                ))}

                <section id="contact" className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <h2 className="mb-2 text-lg font-black text-foreground">Questions?</h2>
                  <p className="text-sm leading-7 text-foreground/80">
                    Contact ClientSurge Systems at{" "}
                    <a className="font-bold text-primary underline-offset-4 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                      {SUPPORT_EMAIL}
                    </a>{" "}
                    or{" "}
                    <a className="font-bold text-primary underline-offset-4 hover:underline" href={SUPPORT_PHONE_HREF}>
                      {SUPPORT_PHONE}
                    </a>.
                  </p>
                </section>
              </div>

              <aside className="hidden lg:block">
                <div className="sticky top-[calc(var(--cs-nav-height)+2rem)] rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">On this page</p>
                  <nav className="space-y-1">
                    {policy.sections.map((section, index) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-foreground/75 hover:bg-primary/5 hover:text-primary"
                      >
                        {index + 1}. {section.title}
                      </a>
                    ))}
                    <a href="#contact" className="block rounded-lg px-3 py-2 text-xs font-semibold text-foreground/75 hover:bg-primary/5 hover:text-primary">
                      Contact
                    </a>
                  </nav>
                </div>
              </aside>
            </div>
          </div>
        </main>

        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}
