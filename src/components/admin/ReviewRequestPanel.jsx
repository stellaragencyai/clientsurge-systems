import { useState } from 'react';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';

const LEGACY_REVIEW_REQUEST_DISABLED_MESSAGE =
  "Legacy direct-send review requests have been quarantined. Use the Install Order Workspace review-request test until a production runtime is promoted.";

export default function ReviewRequestPanel() {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    business_name: '',
    google_review_link: '',
    yelp_review_link: '',
    preferred_channel: 'both',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(LEGACY_REVIEW_REQUEST_DISABLED_MESSAGE);
    setResult(null);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Send Review Request</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Legacy direct-send review requests are no longer an approved launch path.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900">Legacy Flow Quarantined</p>
          <p className="text-sm text-amber-800 mt-0.5">{LEGACY_REVIEW_REQUEST_DISABLED_MESSAGE}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-5">
        {/* Customer Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Customer Name *</label>
          <input
            type="text"
            value={formData.customer_name}
            onChange={(e) => handleChange('customer_name', e.target.value)}
            placeholder="Jane Smith"
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Customer Phone */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Customer Phone *</label>
          <input
            type="tel"
            value={formData.customer_phone}
            onChange={(e) => handleChange('customer_phone', e.target.value)}
            placeholder="+1234567890"
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Customer Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Customer Email</label>
          <input
            type="email"
            value={formData.customer_email}
            onChange={(e) => handleChange('customer_email', e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Business Name *</label>
          <input
            type="text"
            value={formData.business_name}
            onChange={(e) => handleChange('business_name', e.target.value)}
            placeholder="Acme Spa"
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Google Review Link */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Google Review Link *</label>
          <input
            type="url"
            value={formData.google_review_link}
            onChange={(e) => handleChange('google_review_link', e.target.value)}
            placeholder="https://g.co/kgs/..."
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Yelp Review Link */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Yelp Review Link (Optional)</label>
          <input
            type="url"
            value={formData.yelp_review_link}
            onChange={(e) => handleChange('yelp_review_link', e.target.value)}
            placeholder="https://yelp.com/..."
            className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Preferred Channel */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Preferred Channel *</label>
          <select
            value={formData.preferred_channel}
            onChange={(e) => handleChange('preferred_channel', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="both">Both SMS & Email</option>
            <option value="sms">SMS Only</option>
            <option value="email">Email Only</option>
          </select>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {result?.success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Review request sent successfully</p>
                <div className="text-sm text-green-700 mt-2 space-y-1">
                  {result.sms_sent && <p>✓ SMS sent (ID: {result.sms_id})</p>}
                  {result.email_sent && <p>✓ Email sent (ID: {result.email_id})</p>}
                  {!result.sms_sent && !result.email_sent && <p>No messages were sent (check channels and contact info)</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium shadow disabled:opacity-50"
        >
          <><Send className="w-4 h-4" />Quarantined</>
        </button>
      </form>

      {/* Info Box */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-foreground">
        <p className="font-medium mb-2">How it works:</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>✓ Duplicate check prevents sending within 7 days to same contact</li>
          <li>✓ SMS requires phone number; email requires email address</li>
          <li>✓ Both channels can be sent together if both contacts exist</li>
          <li>✓ All sends are logged in Communication Events for tracking</li>
        </ul>
      </div>
    </div>
  );
}
