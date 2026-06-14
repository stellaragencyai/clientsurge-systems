import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Real-time polling hook with delta updates and exponential backoff.
 * 
 * @param {Function} fetchFn - Async function that fetches data (receives lastTimestamp)
 * @param {number} pollingInterval - Polling interval in ms (default: 3000)
 * @param {Function} onData - Callback when new data arrives
 * @param {Function} onStatusChange - Callback for status changes (LIVE, CONNECTING, OFFLINE)
 * @param {boolean} enabled - Enable/disable polling
 * @returns {Object} { status, lastUpdated, error, retry }
 */
export function useRealTimePolling(
  fetchFn,
  pollingInterval = 3000,
  onData = null,
  onStatusChange = null,
  enabled = true
) {
  const [status, setStatus] = useState('CONNECTING');
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [error, setError] = useState(null);

  const pollingRef = useRef(null);
  const retryCountRef = useRef(0);
  const lastTimestampRef = useRef(0);

  // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  const getBackoffDelay = useCallback(() => {
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
    return delay;
  }, []);

  const poll = useCallback(async () => {
    if (!enabled || !fetchFn) return;

    try {
      setStatus('CONNECTING');
      const data = await fetchFn(lastTimestampRef.current);

      if (data) {
        // Update last timestamp to current time for delta fetches
        lastTimestampRef.current = Date.now();
        setLastUpdated(Date.now());

        if (onData) {
          onData(data);
        }

        // Success: reset retry counter
        retryCountRef.current = 0;
        setStatus('LIVE');
        setError(null);
      }
    } catch (err) {
      console.error('[useRealTimePolling] Fetch error:', err);
      setError(err.message);
      setStatus('OFFLINE');

      // Exponential backoff on failure
      retryCountRef.current += 1;
      const backoffDelay = getBackoffDelay();

      // Retry after backoff
      clearTimeout(pollingRef.current);
      pollingRef.current = setTimeout(poll, backoffDelay);
      return;
    }

    // Schedule next poll
    clearTimeout(pollingRef.current);
    if (enabled) {
      pollingRef.current = setTimeout(poll, pollingInterval);
    }
  }, [fetchFn, pollingInterval, onData, enabled, getBackoffDelay]);

  // Start polling on mount or when enabled changes
  useEffect(() => {
    if (!enabled) {
      clearTimeout(pollingRef.current);
      return;
    }

    // Notify status changes
    if (onStatusChange) {
      onStatusChange(status);
    }

    // Initial poll
    poll();

    return () => {
      clearTimeout(pollingRef.current);
    };
  }, [enabled, poll, status, onStatusChange]);

  // Manual retry
  const retry = useCallback(() => {
    retryCountRef.current = 0;
    lastTimestampRef.current = Date.now();
    poll();
  }, [poll]);

  return {
    status, // 'LIVE' | 'CONNECTING' | 'OFFLINE'
    lastUpdated,
    error,
    retry,
    timeSinceUpdate: Math.round((Date.now() - lastUpdated) / 1000),
  };
}