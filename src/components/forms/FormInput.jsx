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
  // Keep controlled inputs editable by preserving the field name when forwarding
  // a normalized event to parent forms. The old spread-based event clone dropped
  // non-enumerable DOM fields like `target.name`, so Contact.jsx updated
  // form.undefined instead of the intended field and the visible value stayed blank.
  const handleChange = (event) => {
    const { name: inputName, value: inputValue, type: inputType } = event.target;
    const nextValue = type === 'tel' ? formatPhoneNumber(inputValue) : inputValue;

    onChange({
      target: {
        name: inputName,
        value: nextValue,
        type: inputType,
      },
      currentTarget: {
        name: inputName,
        value: nextValue,
        type: inputType,
      },
    });
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
      <label className="block mb-2 text-sm font-semibold text-foreground" style={{ textTransform: 'none', letterSpacing: '0.01em', fontSize: '0.875rem' }}>
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
          className={`w-full bg-background border rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_4px_hsla(199,100%,47%,0.12)] pr-10 ${
            error ? 'border-red-500' : 'border-border'
          }`}
        />
        
        {/* Validity indicator icons */}
        {showCheckmark && (
          <CheckCircle2 className="absolute right-3 top-3.5 w-5 h-5 text-green-500 flex-shrink-0" aria-label="valid" />
        )}
        {error && value && (
          <AlertCircle className="absolute right-3 top-3.5 w-5 h-5 text-red-500 flex-shrink-0" aria-label="invalid" />
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
