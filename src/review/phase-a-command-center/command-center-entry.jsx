import React from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import "@/design-system.css";
import "@/styles/clientsurge-os-tokens.css";
import "@/styles/clientsurge-os-primitives.css";
import "@/styles/clientsurge-os-command-center.css";
import CommandCenterReviewHarness from "./CommandCenterReviewHarness.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CommandCenterReviewHarness />
  </React.StrictMode>,
);
