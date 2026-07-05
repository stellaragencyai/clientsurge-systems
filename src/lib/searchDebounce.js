/**
 * Debounced Search Hook
 * Fixes Audit Issue #42: No debouncing on search inputs
 *
 * Returns a debounced value and a flag for whether it's updating.
 */

import { useState, useEffect } from "react";

/**
 * Debounce any rapidly-changing value.
 * @param {string} value - The input value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {string} - The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced search hook that also tracks loading state.
 * @param {string} query - The search query
 * @param {function} searchFn - Async function that performs the search
 * @param {number} delay - Debounce delay in ms
 * @returns {{ results: any[], loading: boolean, error: string|null }}
 */
export function useDebouncedSearch(query, searchFn, delay = 300) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    searchFn(debouncedQuery)
      .then((data) => {
        if (!cancelled) {
          setResults(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Search failed");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchFn]);

  return { results, loading, error };
}