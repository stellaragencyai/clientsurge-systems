import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqItems = [
  {
    question: 'What happens after I buy?',
    answer:
      "After purchase, you'll complete a short onboarding form to tell us about your business. Our team will then configure your automation system, test it thoroughly, and help you go live within 5-7 business days.",
  },
  {
    question: 'Do I need technical knowledge?',
    answer:
      'No. ClientSurge is designed for business owners without technical skills. Our setup team handles all configuration, and your client portal provides a simple dashboard to monitor leads and performance.',
  },
  {
    question: 'Can this work for my industry?',
    answer:
      'ClientSurge works best for service-based businesses: roofing, HVAC, plumbing, dental, medical spas, chiropractic, contractors, real estate, and injury law. If your business gets calls and books appointments, it can work for you.',
  },
  {
    question: 'What if I am an agency?',
    answer:
      'The Agency System lets you manage multiple client automation systems under one platform. You can white-label ClientSurge with your branding, add clients, and track all performance in one dashboard.',
  },
  {
    question: 'Can I upgrade later?',
    answer:
      "Yes. You can upgrade from Starter to Growth to Elite at any time. Your setup fee is credited toward the new plan, and we'll activate new features within 24 hours.",
  },
];

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border border-slate-200 rounded-lg mb-4">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
      >
        <span className="font-semibold text-slate-900 text-left">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-600 flex-shrink-0 transition ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 bg-slate-50 border-t border-slate-200">
          <p className="text-slate-600 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-16 px-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div>
          {faqItems.map((item, idx) => (
            <FAQItem
              key={idx}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}