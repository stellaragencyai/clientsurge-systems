/**
 * ERROR HANDLING GATEWAY
 * Centralized error handling for external service calls (SMS, email, webhooks)
 * Ensures failures don't cascade or break downstream workflows
 */

/**
 * Wrap external service call with retry logic and error recovery
 */
export async function withErrorHandling(
  operationName,
  operation,
  { maxRetries = 3, backoffMs = 1000, fallbackValue = null } = {}
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`[${operationName}] Succeeded on attempt ${attempt}/${maxRetries}`);
      }
      return { success: true, data: result };
    } catch (error) {
      lastError = error;
      const isRetryable = isRetryableError(error);

      console.warn(`[${operationName}] Attempt ${attempt}/${maxRetries} failed:`, {
        error: error.message,
        code: error.code,
        retryable: isRetryable,
      });

      if (attempt < maxRetries && isRetryable) {
        const delayMs = backoffMs * Math.pow(2, attempt - 1); // Exponential backoff
        await sleep(delayMs);
        continue;
      }

      // No more retries or non-retryable error
      break;
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError.message,
    code: lastError.code,
    fallbackValue,
  };
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error) {
  const retryableCodes = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'RATE_LIMITED',
    '429', // Too Many Requests
    '503', // Service Unavailable
    '504', // Gateway Timeout
  ];

  const errorString = `${error.code} ${error.message}`;
  return retryableCodes.some(code => errorString.includes(code));
}

/**
 * Handle SMS provider failure
 */
export async function handleSmsFailure(leadId, errorDetails) {
  console.error(`[SMS_FAILURE] Lead ${leadId}:`, errorDetails);

  return {
    status: 'failed',
    lead_id: leadId,
    error: errorDetails.error,
    action: 'retry_scheduled',
    next_retry_at: getNextRetryTime(),
    fallback: 'queue_email_alternative', // Send email instead
  };
}

/**
 * Handle email provider failure
 */
export async function handleEmailFailure(leadId, errorDetails) {
  console.error(`[EMAIL_FAILURE] Lead ${leadId}:`, errorDetails);

  return {
    status: 'failed',
    lead_id: leadId,
    error: errorDetails.error,
    action: 'retry_scheduled',
    next_retry_at: getNextRetryTime(),
    fallback: 'queue_sms_alternative', // Send SMS instead
  };
}

/**
 * Handle webhook/external API failure
 */
export async function handleWebhookFailure(webhookType, errorDetails) {
  console.error(`[WEBHOOK_FAILURE] ${webhookType}:`, errorDetails);

  return {
    status: 'failed',
    webhook_type: webhookType,
    error: errorDetails.error,
    action: 'retry_scheduled',
    next_retry_at: getNextRetryTime(),
  };
}

/**
 * Log error for monitoring and alerting
 */
export function logOperationalError(operationName, severity, details) {
  const log = {
    timestamp: new Date().toISOString(),
    operation: operationName,
    severity, // 'critical', 'high', 'medium', 'low'
    ...details,
  };

  console.error(`[${severity.toUpperCase()}]`, log);

  // Future: Send to external monitoring/alerting service
  if (severity === 'critical') {
    // Alert operations team
    console.error(`[ALERT_CRITICAL] ${operationName}: ${details.error}`);
  }

  return log;
}

/**
 * Safe execution with fallback
 */
export async function executeSafely(operation, fallbackValue = null) {
  try {
    return await operation();
  } catch (error) {
    console.error('[SAFE_EXECUTION] Error:', error.message);
    return fallbackValue;
  }
}

/**
 * Validate required fields before operation
 */
export function validateRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter(field => !data[field]);

  if (missing.length > 0) {
    return {
      valid: false,
      missing_fields: missing,
      error: `Missing required fields: ${missing.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize error for user display (hide sensitive info)
 */
export function sanitizeErrorForUser(error) {
  const sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
  ];

  let message = error.message || 'An error occurred';

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      message = 'Authentication error. Please contact support.';
      break;
    }
  }

  return {
    message,
    code: error.code,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Circuit breaker for failing services
 */
export class CircuitBreaker {
  constructor(name, { failureThreshold = 5, resetTimeMs = 60000 } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeMs = resetTimeMs;
    this.failureCount = 0;
    this.state = 'closed'; // closed, open, half-open
    this.lastFailureTime = null;
  }

  async execute(operation) {
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure > this.resetTimeMs) {
        this.state = 'half-open';
        console.log(`[CircuitBreaker] ${this.name} entering half-open state`);
      } else {
        return {
          success: false,
          error: `Circuit breaker ${this.name} is open`,
          state: 'open',
        };
      }
    }

    try {
      const result = await operation();
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failureCount = 0;
        console.log(`[CircuitBreaker] ${this.name} reset to closed state`);
      }
      return { success: true, data: result };
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
        console.error(`[CircuitBreaker] ${this.name} opened after ${this.failureCount} failures`);
      }

      return {
        success: false,
        error: error.message,
        failureCount: this.failureCount,
      };
    }
  }

  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Get next retry time (exponential backoff)
 */
function getNextRetryTime(attempt = 1) {
  const backoffSeconds = Math.min(3600, Math.pow(2, attempt) * 60); // Cap at 1 hour
  const nextTime = new Date(Date.now() + backoffSeconds * 1000);
  return nextTime.toISOString();
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  withErrorHandling,
  handleSmsFailure,
  handleEmailFailure,
  handleWebhookFailure,
  logOperationalError,
  executeSafely,
  validateRequiredFields,
  sanitizeErrorForUser,
  CircuitBreaker,
  getNextRetryTime,
};