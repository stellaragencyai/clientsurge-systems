/**
 * Debounce utility for search, filter, and input fields
 * Prevents redundant API calls on every keystroke
 */

import React from "react";

export function debounce(func, delay = 250) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function createDebouncedCallback(callback, delay = 250) {
  let timeoutId;
  return function debouncedCallback(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

export function useDebouncedValue(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}