import { createContext, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getSelectedIndustryRecommendation } from "@/lib/industryRecommendations";

const DemoBookingContext = createContext(null);

export function DemoBookingProvider({ children }) {
  const navigate = useNavigate();

  const value = useMemo(
    () => ({
      openDemoBooking: (options = {}) => {
        const selectedIndustry = getSelectedIndustryRecommendation();
        const industrySlug = options.industrySlug || selectedIndustry?.id || "";
        const search = industrySlug ? `?industry=${encodeURIComponent(industrySlug)}` : "";
        navigate(`/book${search}`);
      },
      closeDemoBooking: () => {},
    }),
    [navigate]
  );

  return (
    <DemoBookingContext.Provider value={value}>
      {children}
    </DemoBookingContext.Provider>
  );
}

export function useDemoBooking() {
  return useContext(DemoBookingContext);
}
