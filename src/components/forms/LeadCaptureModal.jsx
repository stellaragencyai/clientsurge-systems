import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowRight, ChevronLeft, X, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LeadCaptureModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
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
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = '';
    if (step === 1) {
      if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Please enter a valid email';
      } else if (name === 'phone' && value && !/^[\d\s\-\(\)]{10,}$/.test(value)) {
        error = 'Please enter a valid phone number';
      } else if ((name === 'full_name' || name === 'business_name') && value.trim().length < 2) {
        error = 'This field must be at least 2 characters';
      }
    }
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
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
      await base44.entities.Leads.create({
        full_name: formData.full_name,
        business_name: formData.business_name,
        email: formData.email,
        phone: formData.phone,
        business_type: formData.business_type,
        status: 'New',
      });
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a0714f', '#c8965c', '#f5d9a8', '#6b3f1f'],
      });
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to submit form. Please try again.' });
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      full_name: '',
      business_name: '',
      email: '',
      phone: '',
      business_type: '',
      monthly_leads: '',
      biggest_issue: '',
      lead_source: [],
    });
    onClose();
  };

  const canProceedStep1 = formData.full_name && formData.business_name && formData.email && formData.phone;
  const canProceedStep2 = formData.business_type && formData.monthly_leads;
  const canSubmit = canProceedStep2 && formData.biggest_issue && formData.lead_source.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Success Modal Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center animate-in zoom-in duration-500">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground mb-3">Demo Scheduled!</h3>
            <p className="text-muted-foreground mb-6">We've got your info. You'll hear from us within 24 hours.</p>
            <p className="text-xs text-foreground/50">Redirecting...</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <div className={`relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-500 transition-opacity ${showSuccess ? 'opacity-50' : 'opacity-100'}`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-8 md:p-12" style={{ opacity: showSuccess ? 0.5 : 1, pointerEvents: showSuccess ? 'none' : 'auto' }}>
           {/* Header */}
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3">
              Let's Set Up Your Demo
            </h2>
            <p className="text-sm font-medium text-amber-700 bg-amber-50 px-4 py-2 rounded-full inline-block">Step {step} of 3</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: Contact Info */}
             {step === 1 && (
               <div className="space-y-5 animate-in fade-in duration-300">
                 <div>
                   <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                   <input
                     type="text"
                     name="full_name"
                     value={formData.full_name}
                     onChange={handleInputChange}
                     onBlur={handleBlur}
                     disabled={loading}
                     placeholder="John Doe"
                     className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-background transition-all ${errors.full_name && touched.full_name ? 'border-red-500 focus:ring-red-500/50' : 'border-border'} disabled:opacity-50 disabled:cursor-not-allowed`}
                   />
                   {errors.full_name && touched.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-foreground mb-2">Business Name</label>
                   <input
                     type="text"
                     name="business_name"
                     value={formData.business_name}
                     onChange={handleInputChange}
                     onBlur={handleBlur}
                     disabled={loading}
                     placeholder="Your Med Spa"
                     className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-background transition-all ${errors.business_name && touched.business_name ? 'border-red-500 focus:ring-red-500/50' : 'border-border'} disabled:opacity-50 disabled:cursor-not-allowed`}
                   />
                   {errors.business_name && touched.business_name && <p className="text-xs text-red-500 mt-1">{errors.business_name}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                   <input
                     type="email"
                     name="email"
                     value={formData.email}
                     onChange={handleInputChange}
                     onBlur={handleBlur}
                     disabled={loading}
                     placeholder="john@example.com"
                     className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-background transition-all ${errors.email && touched.email ? 'border-red-500 focus:ring-red-500/50' : 'border-border'} disabled:opacity-50 disabled:cursor-not-allowed`}
                   />
                   {errors.email && touched.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-foreground mb-2">Phone</label>
                   <input
                     type="tel"
                     name="phone"
                     value={formData.phone}
                     onChange={handleInputChange}
                     onBlur={handleBlur}
                     disabled={loading}
                     placeholder="(555) 123-4567"
                     className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-background transition-all ${errors.phone && touched.phone ? 'border-red-500 focus:ring-red-500/50' : 'border-border'} disabled:opacity-50 disabled:cursor-not-allowed`}
                   />
                   {errors.phone && touched.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                 </div>
               </div>
             )}

            {/* Step 2: Business Info */}
             {step === 2 && (
               <div className="space-y-5 animate-in fade-in duration-300">
                 <div>
                   <label className="block text-sm font-semibold text-foreground mb-2">Business Type</label>
                   <select
                     name="business_type"
                     value={formData.business_type}
                     onChange={handleInputChange}
                     disabled={loading}
                     className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                     disabled={loading}
                     className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
               <div className="space-y-5 animate-in fade-in duration-300">
                 <div>
                   <label className="block text-sm font-semibold text-foreground mb-4">What's Your Biggest Issue?</label>
                   <div className="space-y-3">
                     {['slow_response', 'missed_calls', 'no_follow_up', 'low_bookings'].map(option => (
                       <label key={option} className="flex items-center p-4 border border-border rounded-lg hover:border-amber-500/50 hover:bg-amber-50/30 cursor-pointer transition-all" style={{opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto'}}>
                         <input
                           type="radio"
                           name="biggest_issue"
                           value={option}
                           checked={formData.biggest_issue === option}
                           onChange={handleInputChange}
                           disabled={loading}
                           className="w-4 h-4 accent-amber-600"
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
                       <label key={source} className="flex items-center p-4 border border-border rounded-lg hover:border-amber-500/50 hover:bg-amber-50/30 cursor-pointer transition-all" style={{opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto'}}>
                         <input
                           type="checkbox"
                           value={source.toLowerCase()}
                           checked={formData.lead_source.includes(source.toLowerCase())}
                           onChange={handleCheckboxChange}
                           disabled={loading}
                           className="w-4 h-4 rounded accent-amber-600"
                         />
                         <span className="ml-3 text-sm font-medium text-foreground">{source}</span>
                       </label>
                     ))}
                   </div>
                 </div>
               </div>
             )}

            {/* Error message */}
            {errors.submit && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">{errors.submit}</div>}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={step === 1 || loading}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground hover:text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 ? !canProceedStep1 : !canProceedStep2 || loading}
                  className="ml-auto flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground"
                  style={{background: 'linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)'}}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="ml-auto flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground"
                  style={{background: 'linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)'}}
                >
                  {loading ? 'Submitting...' : 'Schedule Demo'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
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
    </div>
  );
}