/**
 * Form State Persistence Hook
 * Fixes FLAW #99: Form state loss during transient authentication refreshes.
 *
 * Saves form data to sessionStorage so it survives page refreshes
 * and authentication redirects. Automatically restores on remount.
 */
import { useEffect, useRef, useState, useCallback } from "react";

const STORAGE_PREFIX = "cs_form_draft_";

/**
 * Persist form state to sessionStorage and restore on mount.
 * @param {string} formKey - Unique key for this form
 * @param {object} initialValues - Default values
 * @returns {[object, function, function]} [values, setValues, clearDraft]
 */
export function useFormPersistence(formKey, initialValues = {}) {
  const storageKey = `${STORAGE_PREFIX}${formKey}`;
  const [values, setValues] = useState(initialValues);
  const isFirstRender = useRef(true);

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setValues(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey]);

  // Save to sessionStorage on change (skip first render to avoid overwriting restored state)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      // Only save if there's meaningful data beyond initials
      const hasData = Object.keys(values).some(
        key => values[key] && values[key] !== initialValues[key]
      );
      if (hasData) {
        window.sessionStorage.setItem(storageKey, JSON.stringify(values));
      }
    } catch {
      // Storage full or unavailable — silently fail
    }
  }, [values, storageKey, initialValues]);

  const clearDraft = useCallback(() => {
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setValues(initialValues);
  }, [storageKey, initialValues]);

  return [values, setValues, clearDraft];
}