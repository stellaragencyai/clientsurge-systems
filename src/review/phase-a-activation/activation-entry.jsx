import React from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import "@/design-system.css";
import "@/styles/clientsurge-os-tokens.css";
import "@/styles/clientsurge-os-primitives.css";
import "@/styles/clientsurge-os-activation.css";
import "@/styles/clientsurge-os-gallery.css";
import ActivationReviewHarness from "./ActivationReviewHarness.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ActivationReviewHarness />
  </React.StrictMode>,
);
