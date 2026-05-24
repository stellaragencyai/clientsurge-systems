/**
 * useCartClear.js — #364
 * Clears cart items and shows success state after successful Stripe checkout redirect.
 * Call in CartSidebar when checkout completes successfully.
 */
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useCheckoutSuccess(clearCart) {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const isNew = searchParams.get("new");
    if (sessionId && isNew === "1") {
      // Checkout succeeded — clear cart
      if (typeof clearCart === "function") clearCart();
      // Remove params from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("session_id");
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
}
