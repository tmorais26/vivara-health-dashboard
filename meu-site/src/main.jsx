import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import SiteGate from "./components/SiteGate.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SiteGate>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SiteGate>
  </StrictMode>,
);
