import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft } from 'lucide-react';

export default function Start() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    email: '',
    phone: '',
    business_type: '',
    monthly_leads: '',
    biggest_issue: '',
    lead_source: [],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      lead_source: checked
        ? [...prev.lead_source, value]
        : prev.lead_source.filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Save lead to database
      await base44.entities.Leads.create({
        full_name: formData.full_name,
        business_name: formData.business_name,
        email: formData.email,
        phone: formData.phone,
        business_type: formData.business_type,
        status: 'New',
      });
      // Redirect to booking page
      navigate('/book');
    } catch (error) {
      console.error('Error submitting form:', error);
      setLoading(false);
    }
  };

  const canProceedStep1 = formData.full_name && formData.business_name && formData.email && formData.phone;
  const canProceedStep2 = formData.business_type && formData.monthly_leads;
  const canSubmit = canProceedStep2 && formData.biggest_issue && formData.lead_source.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Let's Set Up Your Demo
          </h1>
          <p className="text-muted-foreground">Step {step} of 3 — Tell us about your business</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border shadow-lg p-8 md:p-10">
          
          {/* Step 1: Contact Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Business Name</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  placeholder="Your Med Spa"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Business Type</label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                >
                  <option value="">Select business type</option>
                  <option value="med_spa">Med Spa</option>
                  <option value="salon">Salon</option>
                  <option value="clinic">Clinic</option>
                  <option value="dental">Dental</option>
                  <option value="fitness">Fitness</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Monthly Leads</label>
                <select
                  name="monthly_leads"
                  value={formData.monthly_leads}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                >
                  <option value="">Select range</option>
                  <option value="1-10">1-10 leads/month</option>
                  <option value="11-25">11-25 leads/month</option>
                  <option value="26-50">26-50 leads/month</option>
                  <option value="50+">50+ leads/month</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Business Challenges */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-4">What's Your Biggest Issue?</label>
                <div className="space-y-3">
                  {['slow_response', 'missed_calls', 'no_follow_up', 'low_bookings'].map(option => (
                    <label key={option} className="flex items-center p-4 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="biggest_issue"
                        value={option}
                        checked={formData.biggest_issue === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="ml-3 text-sm font-medium text-foreground capitalize">
                        {option.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-4">Where Do Your Leads Come From?</label>
                <div className="space-y-3">
                  {['Instagram', 'Website', 'Ads', 'Calls'].map(source => (
                    <label key={source} className="flex items-center p-4 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        value={source.toLowerCase()}
                        checked={formData.lead_source.includes(source.toLowerCase())}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span className="ml-3 text-sm font-medium text-foreground">{source}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-10">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                className="ml-auto flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="ml-auto flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Schedule Demo'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Progress indicator */}
        <div className="flex gap-2 justify-center mt-8">
          {[1, 2, 3].map(dot => (
            <div
              key={dot}
              className={`h-2 rounded-full transition-all ${
                dot <= step ? 'w-8 bg-primary' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}