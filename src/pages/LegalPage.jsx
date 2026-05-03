import { Link, useParams } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { setPageMetadata } from "@/lib/seo";
import { useEffect } from "react";

const content = {
  privacy: {
    title: "Privacy Policy",
    updated: "May 2026",
    body: [
      { heading: "Information We Collect", text: "We collect information you provide directly to us, such as your name, email address, phone number, and business information when you fill out forms, book a demo, or purchase services. We also collect information automatically, including IP addresses, browser type, pages visited, and usage data through cookies and analytics tools." },
      { heading: "How We Use Your Information", text: "We use the information we collect to provide, maintain, and improve our services; process payments; communicate with you about your order and service setup; send transactional and operational messages; and with your explicit consent, send SMS and email marketing communications. You may opt out at any time." },
      { heading: "SMS Communications & TCPA Compliance", text: "By providing your phone number and checking the SMS consent box at checkout, you expressly consent to receive automated text messages from ClientSurge Systems regarding your order, service updates, and follow-up sequences. Message frequency varies. Message and data rates may apply. You may opt out at any time by replying STOP to any message. For help, reply HELP. Opting out will not affect your access to purchased services." },
      { heading: "AI Processing", text: "Our platform uses artificial intelligence to automate lead responses, follow-up messages, and booking workflows on your behalf. AI-generated messages are sent using your business information and communication templates. We do not use your customer data to train general AI models. All AI processing is performed securely within our platform infrastructure." },
      { heading: "Information Sharing", text: "We do not sell, trade, or rent your personal information to third parties. We share data only with trusted service providers required to operate our platform, including Twilio (SMS delivery), Resend (email delivery), Stripe (payment processing), and Base44 (application infrastructure). Each provider maintains their own privacy and security standards." },
      { heading: "Data Retention", text: "We retain your information for as long as your account is active or as needed to provide services. Lead and communication data is retained for up to 2 years to support follow-up automation. You may request deletion of your data by contacting us at support@clientsurgesystems.com." },
      { heading: "Data Security", text: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit (TLS) and at rest." },
      { heading: "Your Rights", text: "You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at support@clientsurgesystems.com. California residents may have additional rights under the CCPA." },
      { heading: "Cookies", text: "We use cookies and similar tracking technologies to improve your browsing experience and analyze site traffic. You can control cookies through your browser settings. See our Cookie Policy for details." },
      { heading: "Contact Us", text: "If you have any questions about this Privacy Policy, please contact us at support@clientsurgesystems.com." },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "May 2026",
    body: [
      { heading: "Acceptance of Terms", text: "By accessing and using ClientSurge Systems services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree, you may not use our services." },
      { heading: "Services", text: "ClientSurge Systems provides done-for-you AI automation systems for lead capture, SMS/email follow-up, and appointment booking for service businesses. All services are configured and managed by ClientSurge on your behalf using information you provide." },
      { heading: "Payment Terms", text: "Services require a one-time setup fee and a recurring monthly subscription billed automatically via Stripe. Your subscription renews automatically each month until cancelled. You will be charged the monthly fee on the same date each billing cycle. We reserve the right to suspend services for non-payment after a 7-day grace period." },
      { heading: "Subscription Auto-Renewal", text: "Your subscription will automatically renew each month at the then-current monthly rate. You will receive a receipt by email for each charge. To prevent renewal, you must cancel at least 3 days before your next billing date by contacting us at support@clientsurgesystems.com or through your client portal." },
      { heading: "Cancellation & Refunds", text: "You may cancel your subscription at any time with no penalty. Monthly fees are non-refundable for the current billing period. One-time setup fees are non-refundable after setup work has commenced. If you cancel within 30 days of purchase and no setup work has started, we will refund your setup fee in full. Requests must be submitted to support@clientsurgesystems.com." },
      { heading: "SMS Messaging Compliance", text: "By using our SMS automation services, you agree to use them only for lawful business communications with leads who have provided consent to be contacted. You are responsible for ensuring your use of our SMS services complies with the Telephone Consumer Protection Act (TCPA) and all applicable laws. ClientSurge Systems provides STOP keyword handling for all outbound SMS sequences. You must not use our platform to send unsolicited messages." },
      { heading: "Acceptable Use", text: "You agree not to use our services for spam, illegal activity, harassment, or any purpose that violates applicable law. We reserve the right to suspend or terminate accounts that violate these terms without refund." },
      { heading: "Limitation of Liability", text: "ClientSurge Systems shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services, including loss of revenue, leads, or business opportunities. Our total liability shall not exceed the amount paid by you in the 3 months prior to the claim." },
      { heading: "Contact Us", text: "For questions about these Terms, contact us at support@clientsurgesystems.com." },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    updated: "April 2026",
    body: [
      { heading: "What Are Cookies", text: "Cookies are small text files stored on your device when you visit our website. They help us provide a better experience by remembering your preferences and analyzing usage patterns." },
      { heading: "Types of Cookies We Use", text: "We use essential cookies (required for the site to function), analytics cookies (to understand how visitors use our site), and marketing cookies (to show relevant advertisements)." },
      { heading: "Managing Cookies", text: "You can control and delete cookies through your browser settings. Note that disabling certain cookies may affect the functionality of our website." },
      { heading: "Third-Party Cookies", text: "We may use third-party services such as Google Analytics that set their own cookies. These are subject to the respective third party's privacy policies." },
      { heading: "Contact Us", text: "For questions about our cookie use, contact us at support@clientsurgesystems.com." },
    ],
  },
};

export default function LegalPage() {
  const { type } = useParams();
  const page = content[type];

  useEffect(() => {
    if (!page) return undefined;

    return setPageMetadata({
      title: `${page.title} | ClientSurge Systems`,
      description: `${page.title} for ClientSurge Systems.`,
      canonicalPath: `/legal/${type}`,
      ogTitle: `${page.title} | ClientSurge Systems`,
      ogDescription: `${page.title} for ClientSurge Systems.`,
    });
  }, [page, type]);

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  const policyLinks = [
    { label: "Privacy Policy", to: "/legal/privacy" },
    { label: "Terms of Service", to: "/legal/terms" },
    { label: "Cookie Policy", to: "/legal/cookies" },
    { label: "Contact Us", to: "/contact" },
  ];

  const renderSectionText = (text) => {
    if (!text.includes("support@clientsurgesystems.com")) {
      return text;
    }

    const [before, after] = text.split("support@clientsurgesystems.com");
    return (
      <>
        {before}
        <a href="mailto:support@clientsurgesystems.com" className="text-primary font-medium hover:underline">
          support@clientsurgesystems.com
        </a>
        {after}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Legal</p>
        <h1 className="font-display text-4xl font-semibold text-foreground mb-2">{page.title}</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: {page.updated}</p>

        <div className="flex flex-wrap gap-3 mb-10">
          {policyLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors ${
                item.to === `/legal/${type}`
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="space-y-10">
          {page.body.map((section, i) => (
            <div key={i} id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
              <h2 className="text-lg font-semibold text-foreground mb-3">{section.heading}</h2>
              <p className="text-muted-foreground leading-relaxed">{renderSectionText(section.text)}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}