import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { buildPricingSummaryForProducts, normalizeSelectedProducts } from "./salesCatalog.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

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

  const clearCart = useCallback(() => setItems([]), []);
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
