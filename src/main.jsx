import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import { initTracking } from "./track.js";

initTracking();
createRoot(document.getElementById("root")).render(<App />);
