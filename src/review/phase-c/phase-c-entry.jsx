import React from "react";
import ReactDOM from "react-dom/client";
import "@/styles/clientsurge-os-tokens.css";
import "@/styles/clientsurge-os-primitives.css";
import "@/styles/clientsurge-os-customer-operations.css";
import PhaseCReviewHarness from "./PhaseCReviewHarness";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PhaseCReviewHarness />
  </React.StrictMode>,
);
