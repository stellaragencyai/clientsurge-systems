/**
 * Task 4 — HTML escape for user input in email templates
 * Prevents XSS injection in outbound emails
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize all user-facing template variables
 */
export function sanitizeTemplateVars(vars = {}) {
  const safe = {};
  for (const [key, val] of Object.entries(vars)) {
    safe[key] = typeof val === 'string' ? escapeHtml(val) : val;
  }
  return safe;
}