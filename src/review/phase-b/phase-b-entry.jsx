import React from "react";
import ReactDOM from "react-dom/client";
import "@/styles/clientsurge-os-tokens.css";
import "@/styles/clientsurge-os-primitives.css";
import PhaseBReviewHarness from "./PhaseBReviewHarness";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PhaseBReviewHarness />
  </React.StrictMode>,
);
