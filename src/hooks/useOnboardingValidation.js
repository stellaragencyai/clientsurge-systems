/**
 * useOnboardingValidation.js — #281 #380
 * Field-level validation for Onboarding.jsx (531-line form).
 * Validates required fields before submit.
 */

const ONBOARDING_RULES = {
  client_name: { required: true, label: "Your name" },
  business_name: { required: true, label: "Business name" },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: "Email address" },
  phone: { required: true, pattern: /^\+?[1-9]\d{7,14}$/, label: "Phone number" },
  industry: { required: true, label: "Industry" },
  booking_platform: { required: true, label: "Booking platform" },
  booking_link: { required: true, pattern: /^https?:\/\/.+/, label: "Booking link (must be a URL)" },
};

export function validateOnboardingField(field, value) {
  const rule = ONBOARDING_RULES[field];
  if (!rule) return null;
  if (rule.required && (!value || String(value).trim() === "")) return \`\${rule.label} is required\`;
  if (rule.pattern && value && !rule.pattern.test(String(value).trim())) return \`\${rule.label} is invalid\`;
  return null;
}

export function validateOnboardingForm(formData) {
  const errors = {};
  for (const [field, rule] of Object.entries(ONBOARDING_RULES)) {
    const error = validateOnboardingField(field, formData[field]);
    if (error) errors[field] = error;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function useOnboardingValidation() {
  const { useState } = require("react");
  const [errors, setErrors] = useState({});

  const validateField = (field, value) => {
    const error = validateOnboardingField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateAll = (formData) => {
    const { valid, errors: newErrors } = validateOnboardingForm(formData);
    setErrors(newErrors);
    return valid;
  };

  return { errors, validateField, validateAll };
}
