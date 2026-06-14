/**
 * Automated test to ensure VITE_ prefixed vars are not sensitive
 * All VITE_ variables are bundled in public code — verify they're safe
 * This helps prevent accidental exposure of API keys
 */

const DANGEROUS_PATTERNS = [
  'SECRET',
  'TOKEN',
  'PASSWORD',
  'KEY',
  'CREDENTIAL',
  'API_KEY',
];

export function validateEnvironmentVariables() {
  const errors = [];

  for (const [key, value] of Object.entries(import.meta.env)) {
    // Check VITE_ prefixed variables
    if (key.startsWith('VITE_')) {
      // Ensure these are NOT sensitive
      const hasDangerousPattern = DANGEROUS_PATTERNS.some(pattern =>
        key.includes(pattern)
      );

      if (hasDangerousPattern) {
        errors.push({
          variable: key,
          issue: `VITE_ variable contains sensitive pattern: ${key}`,
          severity: 'CRITICAL',
          recommendation: `Move ${key} to a backend-only environment variable without VITE_ prefix`,
        });
      }
    }
  }

  if (errors.length > 0) {
    console.error('⚠️  SECURITY ISSUE: Potential secret exposure detected');
    errors.forEach(err => {
      console.error(`  - [${err.severity}] ${err.issue}`);
      console.error(`    → ${err.recommendation}`);
    });
  }

  return errors.length === 0;
}

// Run validation in development
if (import.meta.env.DEV) {
  validateEnvironmentVariables();
}

export default validateEnvironmentVariables;