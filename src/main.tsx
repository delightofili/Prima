import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./components/AuthProvider";
import { ToastProvider } from "./components/Toast";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { applyGlove, readGlove } from "./hooks/useGloveMode";
import { initInstall } from "./lib/install";
import { initPower } from "./lib/power";
import { initI18n } from "./i18n";

applyGlove(readGlove());
initInstall(); // must listen before React starts: the browser fires its install event early
initPower();

void initI18n().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
            <UpdatePrompt />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
