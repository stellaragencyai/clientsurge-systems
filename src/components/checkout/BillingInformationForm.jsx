import { Lock } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function BillingInput({ label, value, onChange, type, placeholder, required, icon: Icon, maxLength }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#333] mb-1 uppercase tracking-wide">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <input
          type={type || "text"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-3 py-2.5 pr-9 border border-[#ccc] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-[#005691]/20 focus:border-[#005691] bg-white"
        />
        {Icon && (
          <Icon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#005691]" />
        )}
      </div>
    </div>
  );
}

export default function BillingInformationForm({
  formData,
  handleFieldChange,
  billingSameAsBusiness,
  setBillingSameAsBusiness,
  termsAgreed,
  setTermsAgreed,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#eee] p-5 md:p-6">
      <h2 className="text-lg font-bold text-[#333] mb-5">2. Billing Information</h2>

      {/* Payment method note */}
      <div className="mb-5 p-4 rounded-lg border border-[#eee] bg-[#f9fafb] flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#005691] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-[#333]">Secure Stripe Checkout</p>
          <p className="text-xs text-[#666] mt-1 leading-relaxed">
            After confirming your billing address and terms below, you'll be securely redirected to Stripe to enter your payment details. We never see or store your card information.
          </p>
        </div>
      </div>

      {/* Billing address checkbox */}
      <label className="flex items-start gap-2.5 cursor-pointer mb-5">
        <input
          type="checkbox"
          checked={billingSameAsBusiness}
          onChange={(e) => setBillingSameAsBusiness(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#005691] flex-shrink-0"
        />
        <span className="text-sm text-[#666] leading-relaxed">
          My billing address is the same as my business address.
        </span>
      </label>

      {/* Billing Address fields (only shown if not same as business) */}
      {!billingSameAsBusiness && (
        <div className="space-y-4 mb-6">
          <BillingInput
            label="Billing Address"
            value={formData.billingAddress}
            onChange={(e) => handleFieldChange("billingAddress", e.target.value)}
            placeholder="123 Main St"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BillingInput
              label="City"
              value={formData.billingCity}
              onChange={(e) => handleFieldChange("billingCity", e.target.value)}
              placeholder="Phoenix"
            />
            <div>
              <label className="block text-xs font-semibold text-[#333] mb-1 uppercase tracking-wide">State</label>
              <select
                value={formData.billingState}
                onChange={(e) => handleFieldChange("billingState", e.target.value)}
                className="w-full px-3 py-2.5 border border-[#ccc] rounded-lg text-sm text-[#333] bg-white focus:outline-none focus:ring-2 focus:ring-[#005691]/20 focus:border-[#005691]"
              >
                <option value="">Select...</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <BillingInput
            label="ZIP"
            value={formData.billingZip}
            onChange={(e) => handleFieldChange("billingZip", e.target.value)}
            placeholder="85001"
            maxLength={10}
          />
        </div>
      )}

      {/* Terms checkbox */}
      <label className="flex items-start gap-2.5 cursor-pointer mt-6">
        <input
          type="checkbox"
          checked={termsAgreed}
          onChange={(e) => setTermsAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#005691] flex-shrink-0"
        />
        <span className="text-xs text-[#666] leading-relaxed">
          By checking this box and clicking &lsquo;AGREE &amp; SUBMIT&rsquo;, I agree to the{" "}
          <a href="/terms" className="text-[#005691] underline">Terms of Service</a>,{" "}
          <a href="/privacy" className="text-[#005691] underline">Privacy Policy</a>, and{" "}
          <a href="/refund-policy" className="text-[#005691] underline">cancellation policy</a>. I authorize ClientSurge Systems to charge the setup fee and monthly subscription to my payment method via Stripe, and I understand my subscription automatically renews monthly until cancelled.
        </span>
      </label>
    </div>
  );
}