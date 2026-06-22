import { CheckCircle2, AlertCircle } from 'lucide-react';

const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
};

export default function FormInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error = null,
  required = false,
  placeholder = '',
  autoComplete = '',
  onBlur = null,
}) {
  // Auto-format phone on change
  const handleChange = (e) => {
    let newValue = e.target.value;
    if (type === 'tel') {
      newValue = formatPhoneNumber(newValue);
    }
    onChange({ ...e, target: { ...e.target, value: newValue } });
  };

  // Determine validity indicator
  let isValid = false;
  let showCheckmark = false;
  
  if (type === 'email' && value) {
    isValid = isValidEmail(value);
    showCheckmark = isValid && !error;
  } else if (type === 'tel' && value) {
    isValid = isValidPhone(value);
    showCheckmark = isValid && !error;
  }

  return (
    <div className="group">
      <label className="block text-[11px] font-bold uppercase tracking-widest text-black mb-2">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={type === 'tel' ? 'tel' : type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full bg-transparent border-b border-black py-3 text-base text-black placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-primary pr-10 ${
            error ? 'border-red-500' : ''
          }`}
        />
        
        {/* Validity indicator icons */}
        {showCheckmark && (
          <CheckCircle2 className="absolute right-0 top-3 w-5 h-5 text-green-500 flex-shrink-0" aria-label="valid" />
        )}
        {error && value && (
          <AlertCircle className="absolute right-0 top-3 w-5 h-5 text-red-500 flex-shrink-0" aria-label="invalid" />
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-xs mt-1.5" id={`${name}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}