import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const changes = [];

function filePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function write(relativePath, content) {
  fs.writeFileSync(filePath(relativePath), content);
  changes.push(relativePath);
}

function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) {
    throw new Error(`Patch anchor not found: ${label}`);
  }
  return content.replace(search, replacement);
}

function patchProductSignup() {
  const target = 'src/pages/ProductSignup.jsx';
  let content = read(target);

  content = replaceOnce(
    content,
    'const REQUIRED_FIELDS = ["fullName", "businessName", "email", "phone"];\nconst CHECKOUT_TIMEOUT_MS = 20000;',
    'const REQUIRED_FIELDS = ["fullName", "businessName", "email", "phone", "industry"];\nconst CHECKOUT_TIMEOUT_MS = 20000;\nconst EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nconst phoneDigits = (value) => String(value || "").replace(/\\D/g, "");',
    'ProductSignup constants'
  );

  content = replaceOnce(
    content,
    '  if (!value || !value.trim()) return "This field is required.";\n  if (field === "email" && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value.trim())) return "Please enter a valid email address.";\n  if (field === "phone" && value.replace(/\\D/g, "").length < 10) return "Please enter a valid phone number.";\n  return "";',
    '  const trimmed = String(value || "").trim();\n  if (!trimmed) return "This field is required.";\n  if ((field === "fullName" || field === "businessName" || field === "industry") && trimmed.length < 2) return "Please enter at least 2 characters.";\n  if (field === "email" && !EMAIL_REGEX.test(trimmed)) return "Please enter a valid email address.";\n  if (field === "phone" && phoneDigits(trimmed).length < 10) return "Please enter a valid phone number.";\n  return "";',
    'ProductSignup validateField'
  );

  content = replaceOnce(
    content,
    '        customer_email: formData.email.trim(),',
    '        customer_email: formData.email.trim().toLowerCase(),',
    'ProductSignup normalized checkout email'
  );

  write(target, content);
}

function patchIndustryQualificationForm() {
  const target = 'src/components/forms/IndustryQualificationForm.jsx';
  let content = read(target);

  content = replaceOnce(
    content,
    'const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;',
    'const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nconst phoneDigits = (value) => String(value || \'\').replace(/\\D/g, \'\');',
    'IndustryQualificationForm constants'
  );

  content = replaceOnce(
    content,
    "    if (!form.full_name.trim()) e.full_name = 'Required';\n    if (!form.email.trim() || !EMAIL_RE.test(form.email)) e.email = 'Valid email required';\n    if (!form.phone.trim() || form.phone.replace(/\\D/g, '').length < 10) e.phone = 'Valid phone required';\n    if (!form.business_name.trim()) e.business_name = 'Required';\n    if (!form.lead_volume) e.lead_volume = 'Please select an option';\n    if (!form.problem.trim()) e.problem = 'Required';\n    if (!form.consent) e.consent = 'Consent required to continue';",
    "    if (form.full_name.trim().length < 2) e.full_name = 'Enter your full name';\n    if (!form.email.trim()) e.email = 'Email is required';\n    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Valid email required';\n    if (!form.phone.trim()) e.phone = 'Phone is required';\n    else if (phoneDigits(form.phone).length < 10) e.phone = 'Valid phone required';\n    if (form.business_name.trim().length < 2) e.business_name = 'Enter your business name';\n    if (!form.lead_volume) e.lead_volume = 'Please select an option';\n    if (form.problem.trim().length < 8) e.problem = 'Briefly describe the lead follow-up problem';\n    if (form.consent !== true) e.consent = 'Consent required to continue';",
    'IndustryQualificationForm validate'
  );

  content = replaceOnce(
    content,
    "      await base44.functions.invoke('submitLeadCapture', {\n        full_name: form.full_name,\n        email: form.email,\n        phone: form.phone,\n        business_name: form.business_name,\n        business_type: industryName,\n        problem: `[Volume: ${form.lead_volume}] ${form.problem}`,",
    "      const result = await base44.functions.invoke('submitLeadCapture', {\n        full_name: form.full_name.trim(),\n        email: form.email.trim().toLowerCase(),\n        phone: form.phone.trim(),\n        business_name: form.business_name.trim(),\n        business_type: industryName,\n        problem: `[Volume: ${form.lead_volume}] ${form.problem.trim()}`,",
    'IndustryQualificationForm normalized payload'
  );

  content = replaceOnce(
    content,
    "        consent_source: `industry_page_${industrySlug}`,\n      });\n      setSubmitted(true);",
    "        consent_source: `industry_page_${industrySlug || 'general'}`,\n        consent_text_version: 'industry_qualification_explicit_checkbox_v1',\n      });\n      if (!result.data?.success) {\n        throw new Error(result.data?.error || 'Lead submission failed');\n      }\n      setSubmitted(true);",
    'IndustryQualificationForm success check'
  );

  content = replaceOnce(
    content,
    "  const isValidEmail = isEmail && value && EMAIL_RE.test(value);\n  const isValidPhone = isTel && value && value.replace(/\\D/g, '').length >= 10;",
    "  const isValidEmail = isEmail && value && EMAIL_RE.test(value.trim());\n  const isValidPhone = isTel && value && phoneDigits(value).length >= 10;",
    'IndustryQualificationForm input check'
  );

  write(target, content);
}

function patchLandingLeadCaptureForm() {
  const target = 'src/components/landing/LeadCaptureForm.jsx';
  let content = read(target);

  content = replaceOnce(
    content,
    'const CONTACT_METHOD_CHANNELS = {\n  Email: ["email"],\n  "Phone Call": ["call"],\n  "Text Message": ["sms"],\n};',
    'const CONTACT_METHOD_CHANNELS = {\n  Email: ["email"],\n  "Phone Call": ["call"],\n  "Text Message": ["sms"],\n};\nconst EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nconst phoneDigits = (value) => String(value || "").replace(/\\D/g, "");',
    'LeadCaptureForm constants'
  );

  content = replaceOnce(
    content,
    '  const [error, setError] = useState(null);',
    '  const [error, setError] = useState(null);\n  const [fieldErrors, setFieldErrors] = useState({});',
    'LeadCaptureForm field errors state'
  );

  content = replaceOnce(
    content,
    '  const updateField = (field, value) => {\n    setFormData((prev) => ({ ...prev, [field]: value }));\n  };',
    '  const updateField = (field, value) => {\n    setFormData((prev) => ({ ...prev, [field]: value }));\n    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));\n    setError(null);\n  };',
    'LeadCaptureForm updateField'
  );

  const validateHelpers = `
  const validateStep = (targetStep) => {
    const nextErrors = {};
    if (targetStep === 1) {
      if (formData.full_name.trim().length < 2) nextErrors.full_name = "Enter your full name.";
      if (!formData.email.trim()) nextErrors.email = "Email is required.";
      else if (!EMAIL_REGEX.test(formData.email.trim())) nextErrors.email = "Enter a valid email.";
      if (!formData.phone.trim()) nextErrors.phone = "Phone is required.";
      else if (phoneDigits(formData.phone).length < 10) nextErrors.phone = "Enter a valid phone number.";
    }
    if (targetStep === 2) {
      if (formData.business_name.trim().length < 2) nextErrors.business_name = "Enter your business name.";
      if (!formData.niche) nextErrors.niche = "Select your industry.";
    }
    if (targetStep === 3) {
      if (!formData.monthly_leads.trim()) nextErrors.monthly_leads = "Enter your monthly lead volume.";
      if (!formData.contact_method) nextErrors.contact_method = "Select your preferred contact method.";
    }
    if (targetStep === 4) {
      if (formData.biggest_problem.trim().length < 8) nextErrors.biggest_problem = "Briefly describe the follow-up challenge.";
      if (formData.consent_given !== true) nextErrors.consent_given = "Consent is required before submitting.";
    }
    return nextErrors;
  };

  const validateAll = () => ({
    ...validateStep(1),
    ...validateStep(2),
    ...validateStep(3),
    ...validateStep(4),
  });

  const goNext = () => {
    const nextErrors = validateStep(step);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }
    setStep(Math.min(sections.length, step + 1));
  };
`;

  content = replaceOnce(
    content,
    '  const handleSubmit = async (e) => {\n    e.preventDefault();\n    setLoading(true);\n    setError(null);',
    `${validateHelpers}\n  const handleSubmit = async (e) => {\n    e.preventDefault();\n    const nextErrors = validateAll();\n    if (Object.keys(nextErrors).length > 0) {\n      setFieldErrors(nextErrors);\n      setError("Please fix the highlighted fields before submitting.");\n      return;\n    }\n    setLoading(true);\n    setError(null);\n    setFieldErrors({});`,
    'LeadCaptureForm submit validation'
  );

  content = replaceOnce(
    content,
    '        full_name: formData.full_name,\n        business_name: formData.business_name,\n        email: formData.email,\n        phone: formData.phone,',
    '        full_name: formData.full_name.trim(),\n        business_name: formData.business_name.trim(),\n        email: formData.email.trim().toLowerCase(),\n        phone: formData.phone.trim(),',
    'LeadCaptureForm normalized payload'
  );

  content = replaceOnce(
    content,
    '                onClick={() => setStep(Math.min(sections.length, step + 1))}',
    '                onClick={goNext}',
    'LeadCaptureForm next button validation'
  );

  write(target, content);
}

patchProductSignup();
patchIndustryQualificationForm();
patchLandingLeadCaptureForm();

console.log('Applied blocked form hardening patches to:');
for (const relativePath of changes) {
  console.log(`- ${relativePath}`);
}
