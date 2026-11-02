import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./components/AuthProvider";
import { PeerLiveBadge } from "./components/PeerLiveBadge";
import { ToastProvider } from "./components/Toast";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { applyGlove, readGlove } from "./hooks/useGloveMode";
import { getCurrentFacility } from "./lib/config";
import { startDeviceReports } from "./lib/deviceStatus";
import { initInstall } from "./lib/install";
import { initPower } from "./lib/power";
import { startClinicKeyRefresh } from "./lib/syncKey";
import { initI18n } from "./i18n";

applyGlove(readGlove());
initInstall(); // must listen before React starts: the browser fires its install event early
initPower();
startDeviceReports();
startClinicKeyRefresh(() => getCurrentFacility()?.id ?? null); // keeps the clinic key fresh, so phones can sync with no internet

void initI18n().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
            <UpdatePrompt />
            <PeerLiveBadge />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
