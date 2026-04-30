import { createContext, useContext, useMemo, useState } from "react";
import DemoBookingModal from "../forms/DemoBookingModal";
import { getSelectedIndustryRecommendation } from "@/lib/industryRecommendations";

const DemoBookingContext = createContext(null);

export function DemoBookingProvider({ children }) {
  const [modalState, setModalState] = useState({
    open: false,
    prefillIndustry: "",
  });

  const value = useMemo(
    () => ({
      openDemoBooking: (options = {}) => {
        const selectedIndustry = getSelectedIndustryRecommendation();
        setModalState({
          open: true,
          prefillIndustry:
            options.prefillIndustry || selectedIndustry?.name || "",
        });
      },
      closeDemoBooking: () =>
        setModalState({
          open: false,
          prefillIndustry: "",
        }),
    }),
    []
  );

  return (
    <DemoBookingContext.Provider value={value}>
      {children}
      {modalState.open && (
        <DemoBookingModal
          onClose={() =>
            setModalState({
              open: false,
              prefillIndustry: "",
            })
          }
          prefillIndustry={modalState.prefillIndustry}
        />
      )}
    </DemoBookingContext.Provider>
  );
}

export function useDemoBooking() {
  return useContext(DemoBookingContext);
}
