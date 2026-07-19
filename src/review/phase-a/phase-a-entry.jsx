import React from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import "@/design-system.css";
import "@/styles/clientsurge-os-tokens.css";
import "@/styles/clientsurge-os-shell.css";
import "@/styles/clientsurge-os-primitives.css";
import "@/styles/clientsurge-os-interactions.css";
import "@/styles/clientsurge-os-data-display.css";
import "@/styles/clientsurge-os-gallery.css";
import "@/styles/clientsurge-os-pricing.css";
import PhaseAFoundationReview from "./PhaseAFoundationReview.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PhaseAFoundationReview />
  </React.StrictMode>,
);
