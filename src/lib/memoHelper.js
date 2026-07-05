/**
 * Memoization Helper
 * Fixes Audit Issue #43: No memoization for expensive calculations
 *
 * Re-export of React's useMemo with documentation for when to use it.
 *
 * Guidelines:
 * - Wrap calculations that process arrays/objects (filter, sort, reduce)
 * - Wrap any calculation that takes >5ms
 * - Use for derived state that depends on props
 * - Don't over-use — simple calculations don't need memoization
 *
 * Example:
 * import { useMemoizedCalc } from '@/lib/memoHelper';
 * const sortedLeads = useMemoizedCalc(() => leads.sort((a,b) => ...), [leads]);
 */

import { useMemo, useCallback, memo } from "react";

export function useMemoizedCalc(calcFn, deps) {
  return useMemo(calcFn, deps);
}

export function useMemoizedCallback(cbFn, deps) {
  return useCallback(cbFn, deps);
}

/**
 * HOC to prevent unnecessary re-renders of components.
 * Use on components that receive complex props but are expensive to re-render.
 *
 * Example:
 * export default memoHeavyComponent(MyComponent);
 */
export function memoHeavyComponent(Component) {
  return memo(Component);
}