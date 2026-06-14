/**
 * Exponential backoff retry for API calls
 * Used for Twilio, Resend, and other external APIs
 */
export async function retryWithBackoff(
  fn,
  maxRetries = 3,
  initialDelayMs = 1000
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fn();
      
      // Check for rate limit or temporary errors
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempt === maxRetries - 1) {
          throw new Error(`Max retries exceeded. Last status: ${response.status}`);
        }
        
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        console.log(`Rate limited or server error. Retrying in ${delayMs}ms...`);
        
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      
      // Success
      if (response.ok || response.status < 400) {
        return response;
      }
      
      // Client error (4xx, not 429) — don't retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      // Network error or other exception
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delayMs}ms...`);
      
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

/**
 * Simpler version for async functions that throw instead of returning response
 */
export async function retryAsync(fn, maxRetries = 3, initialDelayMs = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delayMs}ms...`);
      
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}