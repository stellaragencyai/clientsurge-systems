/**
 * CartPersistenceProvider — upgrades cart persistence from sessionStorage to localStorage.
 * Ensures abandoned cart recovery: selections survive browser closes and tab refreshes.
 * Wraps CartProvider with localStorage sync on top of existing sessionStorage logic.
 */
import { useEffect } from "react";
import { useCart } from "@/lib/cartContext";

const LOCAL_STORAGE_KEY = "clientsurge:cart:persistent";
const EXPIRY_HOURS = 48;

export function useCartPersistence() {
  const { items, replaceItems } = useCart();

  // On mount: hydrate from localStorage if session cart is empty
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const { items: saved, savedAt } = JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.length) return;

      // Expire after 48 hours
      const ageHours = (Date.now() - savedAt) / 1000 / 3600;
      if (ageHours > EXPIRY_HOURS) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return;
      }

      // Only hydrate if current session cart is empty
      const sessionRaw = sessionStorage.getItem("clientsurge:cart");
      const sessionItems = sessionRaw ? JSON.parse(sessionRaw) : [];
      if (!sessionItems.length && saved.length) {
        replaceItems(saved);
      }
    } catch {}
  }, []); // eslint-disable-line

  // On every cart change: write to localStorage with timestamp
  useEffect(() => {
    try {
      if (items.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ items, savedAt: Date.now() }));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch {}
  }, [items]);
}

export default function CartPersistenceProvider({ children }) {
  useCartPersistence();
  return children;
}