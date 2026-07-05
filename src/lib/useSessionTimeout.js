/**
 * Finding #149: Admin session timeout — 30-minute inactivity auto-logout.
 * Shows a warning modal at 25 minutes. Auto-logout at 30 minutes.
 * Uses AuthContext's logout function.
 */

import { useEffect, useState, useCallback, useRef } from "react";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 25 * 60 * 1000; // Warning at 25 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"];

export function useSessionTimeout(onTimeout, isAdmin = false) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_MS);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setTimeRemaining(TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Track user activity
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setShowWarning(false);
    };

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check timeout every 10 seconds
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        setShowWarning(false);
        onTimeout?.();
      } else if (remaining <= WARNING_MS - TIMEOUT_MS + 5 * 60 * 1000) {
        // Show warning when 5 minutes remain (at 25 minutes of inactivity)
        setShowWarning(true);
        setTimeRemaining(remaining);
      } else {
        setShowWarning(false);
      }
    }, 10_000);

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAdmin, onTimeout]);

  return { showWarning, timeRemaining, resetTimer };
}