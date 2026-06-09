/**
 * AbandonedCartBanner — recovers saved cart selections on return visit.
 * Shows a non-intrusive banner prompting the user to restore their cart.
 */
import { useEffect, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cartContext";

const LOCAL_STORAGE_KEY = "clientsurge:cart:persistent";
const EXPIRY_HOURS = 48;

export default function AbandonedCartBanner() {
  const { items, replaceItems, setCartOpen } = useCart();
  const [savedItems, setSavedItems] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (items.length > 0) return; // already have cart items
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const { items: saved, savedAt } = JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.length) return;
      const ageHours = (Date.now() - savedAt) / 1000 / 3600;
      if (ageHours > EXPIRY_HOURS) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return;
      }
      setSavedItems(saved);
    } catch {}
  }, [items.length]);

  if (!savedItems || dismissed) return null;

  const handleRestore = () => {
    replaceItems(savedItems);
    setCartOpen(true);
    setSavedItems(null);
  };

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] rounded-2xl shadow-2xl border px-4 py-3 flex items-center gap-3"
      style={{
        background: "linear-gradient(135deg,rgba(0,59,143,0.97),rgba(0,110,176,0.97))",
        borderColor: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
        <ShoppingCart className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">You left items in your cart</p>
        <p className="text-[11px] text-blue-200/80">{savedItems.length} service{savedItems.length > 1 ? "s" : ""} saved</p>
      </div>
      <button
        onClick={handleRestore}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-primary hover:bg-blue-50 transition-colors"
      >
        Restore
      </button>
      <button
        onClick={() => { setDismissed(true); localStorage.removeItem(LOCAL_STORAGE_KEY); }}
        className="flex-shrink-0 p-1 rounded-lg text-white/60 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}