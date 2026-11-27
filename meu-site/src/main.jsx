import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import SiteGate from "./components/SiteGate.jsx";
import { LanguageProvider } from "./i18n.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <SiteGate>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SiteGate>
    </LanguageProvider>
  </StrictMode>,
);
