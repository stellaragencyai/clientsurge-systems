import { CheckCircle2 } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function ValidatedInput({ label, value, onChange, type, placeholder, error, required, isValid, ...props }) {
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
          className={`w-full px-3 py-2.5 pr-9 border rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-[#005691]/20 focus:border-[#005691] ${
            error ? "border-red-400 bg-red-50" : "border-[#ccc] bg-white"
          }`}
          {...props}
        />
        {isValid && !error && value && (
          <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function AccountSignupForm({
  formData,
  fieldErrors,
  handleFieldChange,
  termsAgreed,
  setTermsAgreed,
  addressConfirmed,
  setAddressConfirmed,
  isFieldValid,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#eee] p-5 md:p-6">
      <h2 className="text-lg font-bold text-[#333] mb-5">1. Create Your Account</h2>

      {/* ACCOUNT INFORMATION */}
      <p className="text-xs font-bold text-[#999] uppercase tracking-widest mb-3">Account Information</p>
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_60px_1fr] gap-3">
          <ValidatedInput
            label="First Name"
            required
            value={formData.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
            placeholder="John"
            error={fieldErrors.firstName}
            isValid={isFieldValid("firstName", formData.firstName)}
          />
          <ValidatedInput
            label="MI"
            value={formData.mi}
            onChange={(e) => handleFieldChange("mi", e.target.value)}
            placeholder="—"
            maxLength={2}
          />
          <ValidatedInput
            label="Last Name"
            required
            value={formData.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
            placeholder="Doe"
            error={fieldErrors.lastName}
            isValid={isFieldValid("lastName", formData.lastName)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ValidatedInput
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            placeholder="owner@example.com"
            error={fieldErrors.email}
            isValid={isFieldValid("email", formData.email)}
          />
          <ValidatedInput
            label="Phone"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            placeholder="(602) 555-0100"
            error={fieldErrors.phone}
            isValid={isFieldValid("phone", formData.phone)}
          />
        </div>
      </div>

      {/* BUSINESS ADDRESS */}
      <p className="text-xs font-bold text-[#999] uppercase tracking-widest mb-3">Business Address</p>
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ValidatedInput
            label="Business Name"
            required
            value={formData.businessName}
            onChange={(e) => handleFieldChange("businessName", e.target.value)}
            placeholder="Your Business LLC"
            error={fieldErrors.businessName}
            isValid={isFieldValid("businessName", formData.businessName)}
          />
          <ValidatedInput
            label="Industry"
            value={formData.industry}
            onChange={(e) => handleFieldChange("industry", e.target.value)}
            placeholder="e.g., HVAC, Dental, Roofing"
          />
        </div>

        <ValidatedInput
          label="Address"
          value={formData.address}
          onChange={(e) => handleFieldChange("address", e.target.value)}
          placeholder="123 Main St"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ValidatedInput
            label="City"
            value={formData.city}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            placeholder="Phoenix"
          />
          <div>
            <label className="block text-xs font-semibold text-[#333] mb-1 uppercase tracking-wide">State</label>
            <select
              value={formData.state}
              onChange={(e) => handleFieldChange("state", e.target.value)}
              className="w-full px-3 py-2.5 border border-[#ccc] rounded-lg text-sm text-[#333] bg-white focus:outline-none focus:ring-2 focus:ring-[#005691]/20 focus:border-[#005691]"
            >
              <option value="">Select...</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <ValidatedInput
          label="ZIP"
          value={formData.zip}
          onChange={(e) => handleFieldChange("zip", e.target.value)}
          placeholder="85001"
          maxLength={10}
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={addressConfirmed}
            onChange={(e) => setAddressConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#005691] flex-shrink-0"
          />
          <span className="text-xs text-[#666] leading-relaxed">
            My business has been operating at this address for six months or more.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAgreed}
            onChange={(e) => setTermsAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#005691] flex-shrink-0"
          />
          <span className="text-xs text-[#666] leading-relaxed">
            By checking this box and clicking &lsquo;AGREE &amp; NEXT&rsquo; you agree to be bound by the{" "}
            <a href="/terms" className="text-[#005691] underline">Terms of Service</a>,{" "}
            <a href="/privacy" className="text-[#005691] underline">Privacy Policy</a>, and to receive important notices and other communications electronically.
          </span>
        </label>
      </div>
    </div>
  );
}