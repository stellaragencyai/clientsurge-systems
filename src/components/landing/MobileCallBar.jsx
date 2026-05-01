import { Phone } from "lucide-react";

export default function MobileCallBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-primary/20 bg-background/95 backdrop-blur md:hidden">
      <div className="px-4 py-3">
        <a
          href="tel:+16025843227"
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          <Phone className="w-4 h-4" />
          Call Nolan directly: (602) 584-3227
        </a>
      </div>
    </div>
  );
}
