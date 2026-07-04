import { Lock, ShieldCheck, CreditCard } from "lucide-react";

export default function CheckoutFooter() {
  return (
    <footer className="border-t border-[#eee] bg-white py-8 mt-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#005691]" />
            <span className="text-xs font-semibold text-[#666]">Privacy &amp; Security Protected</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#005691]" />
            <span className="text-xs font-semibold text-[#666]">Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#005691]" />
            <span className="text-xs font-semibold text-[#666]">Fully Secured SSL Checkout</span>
          </div>
        </div>
        <p className="text-center text-xs text-[#999]">
          © 2026 ClientSurge Systems. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}