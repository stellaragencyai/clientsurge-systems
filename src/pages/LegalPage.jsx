import { Link, useParams } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { setPageMetadata } from "@/lib/seo";
import { useEffect } from "react";
import { CHECKOUT_LEGAL_DOCUMENTS } from "@/lib/legalDocuments";

const content = {
  privacy: {
    title: "Privacy Policy",
    updated: "April 2026",
    body: [
      { heading: "Information We Collect", text: "We collect information you provide directly to us, such as your name, email address, phone number, and business information when you fill out forms or book a demo." },
      { heading: "How We Use Your Information", text: "We use the information we collect to provide, maintain, and improve our services, communicate with you about products and services, and send you marketing communications (with your consent)." },
      { heading: "Information Sharing", text: "We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our platform." },
      { heading: "Data Security", text: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction." },
      { heading: "Cookies", text: "We use cookies and similar tracking technologies to improve your browsing experience and analyze site traffic. You can control cookies through your browser settings." },
      { heading: "Contact Us", text: "If you have any questions about this Privacy Policy, please contact us at system@clientsurgesystems.com." },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "April 2026",
    body: [
      { heading: "Acceptance of Terms", text: "By accessing and using ClientSurge Systems services, you accept and agree to be bound by the terms and provisions of this agreement." },
      { heading: "Services", text: "ClientSurge Systems provides done-for-you automation systems for lead capture, follow-up, and appointment booking for service businesses." },
      { heading: "Payment Terms", text: "Services require a one-time setup fee and a recurring monthly subscription. Payments are due as outlined at checkout or in your service agreement. We reserve the right to suspend services for non-payment." },
      { heading: "Cancellation", text: "Subscriptions renew month-to-month until canceled. To avoid another renewal, send written cancellation before your next billing date. Setup fees are non-refundable except where a stated written guarantee applies." },
      { heading: "Limitation of Liability", text: "ClientSurge Systems shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of our services." },
      { heading: "Contact Us", text: "For questions about these Terms, contact us at system@clientsurgesystems.com." },
    ],
  },
  billing: {
    title: "Billing & Cancellation Terms",
    updated: "April 2026",
    body: [
      { heading: "Billing Model", text: "ClientSurge Systems charges a one-time setup fee plus a recurring monthly subscription for active services." },
      { heading: "Subscription Renewal", text: "Subscriptions renew month-to-month until canceled. Ongoing billing begins once checkout is completed and your subscription is activated." },
      { heading: "Cancellation Timing", text: "To avoid another monthly renewal, send written cancellation before your next billing date. Cancellation stops future renewals; already billed amounts are generally not prorated." },
      { heading: "Setup Fees & Guarantee", text: "Setup fees cover implementation work and are generally non-refundable, except where a stated written guarantee expressly applies to your purchase." },
      { heading: "Failed Payments", text: "If a payment fails, we may pause service delivery, automations, or account access until billing is resolved." },
      { heading: "Contact Us", text: "For billing or cancellation questions, contact us at system@clientsurgesystems.com." },
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
      { heading: "Contact Us", text: "For questions about our cookie use, contact us at system@clientsurgesystems.com." },
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
    ...CHECKOUT_LEGAL_DOCUMENTS.map((document) => ({
      label: document.label,
      to: document.path,
    })),
    { label: "Cookie Policy", to: "/legal/cookies" },
    { label: "Contact Us", to: "/contact" },
  ];

  const renderSectionText = (text) => {
    if (!text.includes("system@clientsurgesystems.com")) {
      return text;
    }

    const [before, after] = text.split("system@clientsurgesystems.com");
    return (
      <>
        {before}
        <a href="mailto:system@clientsurgesystems.com" className="text-primary font-medium hover:underline">
          system@clientsurgesystems.com
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
