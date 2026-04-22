import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addItem = useCallback((product) => {
    setItems((prev) => {
      if (prev.find((i) => i.product_id === product.product_id)) return prev;
      return [...prev, product];
    });
    setCartOpen(true);
  }, []);

  const removeItem = useCallback((product_id) => {
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalSetup = items.reduce((sum, i) => sum + i.setup_fee, 0);
  const totalMonthly = items.reduce((sum, i) => sum + i.monthly_fee, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, cartOpen, setCartOpen, totalSetup, totalMonthly }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}