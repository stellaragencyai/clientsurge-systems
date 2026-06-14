// Task #6: Accessible form component with proper label/input associations
import React from 'react';

export function AccessibleFormField({
  id,
  label,
  type = 'text',
  required = false,
  error = null,
  helperText = null,
  ...props
}) {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={fieldId}
        type={type}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : helperText ? `${fieldId}-help` : undefined}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none ${
          error ? 'border-destructive' : 'border-border'
        }`}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${fieldId}-help`} className="mt-1 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default AccessibleFormField;