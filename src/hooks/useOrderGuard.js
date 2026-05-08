/**
 * useOrderGuard.js — #406b
 * Hook for /setup/credentials — validates order_id exists + payment_status === "paid"
 * Redirects to /pricing if invalid.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export function useOrderGuard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const order_id = searchParams.get("order_id");
    if (!order_id) {
      navigate("/pricing?error=missing_order");
      return;
    }
    (async () => {
      try {
        const result = await base44.functions.invoke("getOrderStatus", { order_id });
        if (!result?.order || result.order.payment_status !== "paid") {
          navigate("/pricing?error=unpaid_order");
          return;
        }
        setOrder(result.order);
      } catch (e) {
        setError("Could not verify your order. Please contact support.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { order, loading, error };
}
