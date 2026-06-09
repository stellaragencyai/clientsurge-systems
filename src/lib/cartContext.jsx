import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { buildPricingSummaryForProducts, normalizeSelectedProducts } from "./salesCatalog.js";

const CART_STORAGE_KEY = "clientsurge:cart";
const CART_LS_KEY = "clientsurge:cart:persistent";
const CART_EXPIRY_HOURS = 48;
const CartContext = createContext(null);

function loadPersistedCart() {
  // First try sessionStorage (current session)
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  // Fall back to localStorage (cross-session recovery)
  try {
    const raw = localStorage.getItem(CART_LS_KEY);
    if (!raw) return [];
    const { items, savedAt } = JSON.parse(raw);
    const ageHours = (Date.now() - savedAt) / 1000 / 3600;
    if (ageHours > CART_EXPIRY_HOURS) {
      localStorage.removeItem(CART_LS_KEY);
      return [];
    }
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadPersistedCart());
  const [cartOpen, setCartOpen] = useState(false);

  // Persist to both sessionStorage and localStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}
    try {
      if (items.length > 0) {
        localStorage.setItem(CART_LS_KEY, JSON.stringify({ items, savedAt: Date.now() }));
      } else {
        localStorage.removeItem(CART_LS_KEY);
      }
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