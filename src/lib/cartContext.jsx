import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { buildPricingSummaryForProducts, normalizeSelectedProducts } from "./salesCatalog.js";

const CART_STORAGE_KEY = "clientsurge:cart";
const CartContext = createContext(null);

function loadPersistedCart() {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadPersistedCart());
  const [cartOpen, setCartOpen] = useState(false);

  // Persist to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = useCallback((product) => {
    setItems((prev) => {
      if (prev.find((i) => i.product_id === product.product_id)) return prev;
      return normalizeSelectedProducts([...prev, product]);
    });
    setCartOpen(true);
  }, []);

  const removeItem = useCallback((product_id) => {
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try { sessionStorage.removeItem(CART_STORAGE_KEY); } catch {}
  }, []);

  const replaceItems = useCallback((nextItems) => {
    setItems(normalizeSelectedProducts(nextItems));
  }, []);

  const pricingSummary = useMemo(() => buildPricingSummaryForProducts(items), [items]);
  const totalSetup = pricingSummary.total_setup;
  const totalMonthly = pricingSummary.total_monthly;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        replaceItems,
        cartOpen,
        setCartOpen,
        pricingSummary,
        totalSetup,
        totalMonthly,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
