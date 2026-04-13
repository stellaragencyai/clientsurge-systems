import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LeadForm() {
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    email: '',
    phone: '',
    service_interest: '',
    problem: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await base44.functions.invoke('submitMedSpaLead', formData);
      setSuccess(true);
      setFormData({ name: '', business_name: '', email: '', phone: '', service_interest: '', problem: '' });

      // Track analytics
      await base44.analytics.track({
        eventName: 'med_spa_form_submitted',
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Thank you!</h3>
        <p className="text-muted-foreground mb-4">
          We've received your information. One of our specialists will reach out within the next 24 hours to schedule your demo.
        </p>
        <p className="text-sm text-green-600 font-semibold">Check your email for confirmation details.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <input
          type="text"
          name="name"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange}
          required
          className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          name="business_name"
          placeholder="Med spa name"
          value={formData.business_name}
          onChange={handleChange}
          required
          className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          required
          className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <select
        name="service_interest"
        value={formData.service_interest}
        onChange={handleChange}
        required
        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Primary service focus</option>
        <option value="injectables">Injectables (Botox, Fillers)</option>
        <option value="laser">Laser & Skin Treatments</option>
        <option value="body_treatments">Body Treatments</option>
        <option value="skin_treatments">Skincare & Facials</option>
        <option value="other">Other</option>
      </select>

      <textarea
        name="problem"
        placeholder="What's your biggest follow-up challenge right now?"
        value={formData.problem}
        onChange={handleChange}
        required
        rows="4"
        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg h-11 font-semibold gap-2"
      >
        {loading ? 'Submitting...' : 'Schedule Your Demo'}
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        We respect your privacy. We'll only reach out about your demo request.
      </p>
    </form>
  );
}