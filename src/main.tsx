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

applyGlove(readGlove());
initInstall(); // must listen before React starts: the browser fires its install event early
initPower();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
    <UpdatePrompt />
  </StrictMode>,
);
