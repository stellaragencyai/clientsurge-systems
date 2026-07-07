import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

/**
 * CSFormField — Premium form input with validation states, icons, and loading.
 *
 * Props:
 *   label        — string (required)
 *   type         — 'text' | 'email' | 'tel' | 'password' | 'url' (default 'text')
 *   name         — string (form field name)
 *   value        — string
 *   onChange     — function(value) — receives the string value, not the event
 *   onBlur       — function()
 *   placeholder  — string
 *   required     — boolean
 *   error        — string (validation error message)
 *   touched      — boolean (show error only if touched)
 *   icon         — lucide-react icon component (optional, left side)
 *   loading      — boolean
 *   disabled     — boolean
 *   autoComplete — string
 *   allValid     — boolean (show green check when valid)
 *   helperText   — string
 *   className    — string
 */
export default function CSFormField({
  label,
  type = 'text',
  name,
  value = '',
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  touched = false,
  icon: Icon,
  loading = false,
  disabled = false,
  autoComplete = '',
  allValid = false,
  helperText,
  className = '',
}) {
  const fieldId = useRef(`cs-field-${name || Math.random().toString(36).substr(2, 9)}`).current;
  const showError = error && touched;
  const showCheck = allValid && value && !error && !loading;

  const handleChange = useCallback(
    (e) => {
      onChange?.(e.target.value);
    },
    [onChange]
  );

  return (
    <div className={`cs-form-field ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-xs font-bold uppercase tracking-wider mb-1.5"
        style={{ color: '#475569' }}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 flex-shrink-0"
            style={{ color: '#00AEEF', zIndex: 1 }}
            aria-hidden="true"
          />
        )}

        <input
          id={fieldId}
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled || loading}
          autoComplete={autoComplete}
          aria-invalid={!!showError}
          aria-describedby={showError ? `${fieldId}-error` : helperText ? `${fieldId}-help` : undefined}
          className="w-full text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            padding: Icon ? '0.625rem 2.25rem 0.625rem 1.75rem' : '0.625rem 2.25rem 0.625rem 0.75rem',
            borderColor: showError ? '#ef4444' : 'hsl(var(--border))',
            ...(showError
              ? { boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
              : {}),
          }}
        />

        {/* Right side: loading spinner or valid check */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : showCheck ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : showError ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : null}
        </div>
      </div>

      {showError && (
        <p id={`${fieldId}-error`} className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      {helperText && !showError && (
        <p id={`${fieldId}-help`} className="mt-1 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}