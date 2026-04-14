// CSRF Token utility
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getCSRFToken() {
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem('csrf_token', token);
  }
  return token;
}

// Input sanitization to prevent XSS
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }
  
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
}

// Email validation
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Phone validation
export function isValidPhone(phone) {
  const regex = /^[\d\s\-\+\(\)]{10,}$/;
  return regex.test(phone.replace(/\s/g, ''));
}