import { createContext, useContext, useMemo, useState } from "react";
import DemoBookingModal from "../forms/DemoBookingModal";

const DemoBookingContext = createContext(null);

export function DemoBookingProvider({ children }) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      openDemoBooking: () => setOpen(true),
      closeDemoBooking: () => setOpen(false),
    }),
    []
  );

  return (
    <DemoBookingContext.Provider value={value}>
      {children}
      {open && <DemoBookingModal onClose={() => setOpen(false)} />}
    </DemoBookingContext.Provider>
  );
}

export function useDemoBooking() {
  return useContext(DemoBookingContext);
}
