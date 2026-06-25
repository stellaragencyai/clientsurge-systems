// FIX #12: System health aggregator — batches metrics in small chunks 
// to avoid Deno timeout on high-traffic days

/**
 * Process an array of health check items in small batches
 * to stay well within Deno execution limits.
 * @param {Array} items
 * @param {Function} processFn - async function per item
 * @param {number} batchSize - items per batch (default: 20)
 * @param {number} delayMs - pause between batches (default: 50ms)
 */
export async function processBatched(items, processFn, batchSize = 20, delayMs = 50) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);

    // Yield between batches to avoid blocking Deno's event loop
    if (i + batchSize < items.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Aggregate health metrics safely with a hard timeout guard.
 * Returns partial results on timeout rather than crashing.
 */
export async function aggregateWithTimeout(fn, timeoutMs = 20000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Health aggregation timed out")), timeoutMs)
  );

  return Promise.race([fn(), timeout]).catch((err) => ({
    error: err.message,
    partial: true,
    timestamp: new Date().toISOString(),
  }));
}