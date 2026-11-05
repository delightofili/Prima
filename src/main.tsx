import "./lib/demoBoot"; // FIRST: in practice mode this cuts the page off from the internet before any other file loads
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./components/AuthProvider";
import {
  CrashProbe,
  ErrorBoundary,
  RouteBoundary,
} from "./components/ErrorBoundary";
import { PeerLiveBadge } from "./components/PeerLiveBadge";
import { ToastProvider } from "./components/Toast";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { applyGlove, readGlove } from "./hooks/useGloveMode";
import { getCurrentFacility } from "./lib/config";
import { installGlobalCapture } from "./lib/crashLog";
import { installCrashTest } from "./lib/crashTest";
import { startDeviceReports } from "./lib/deviceStatus";
import { isDemo } from "./lib/demo";
import { prepareDemo } from "./lib/demoSetup";
import { initInstall } from "./lib/install";
import { initPower } from "./lib/power";
import { startClinicKeyRefresh } from "./lib/syncKey";
import { initI18n } from "./i18n";

installGlobalCapture(); // remembers (on this phone only) any error that no screen caught, with nothing about patients in it
installCrashTest(); // does nothing unless someone turned debugging on
applyGlove(readGlove());
initInstall(); // must listen before React starts: the browser fires its install event early
initPower();
if (!isDemo()) {
  // practice mode has no cloud: no device reports, no clinic key
  startDeviceReports();
  startClinicKeyRefresh(() => getCurrentFacility()?.id ?? null); // keeps the clinic key fresh, so phones can sync with no internet
}

// the language and, in practice mode only, the practice nurse, clinic and patients are ready before the first screen is drawn
void Promise.all([initI18n(), prepareDemo()]).finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {/* the last safety net: even a crash in the providers below shows a crash screen, never a blank page */}
      <ErrorBoundary>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              {/* a crash on one screen is cleared when the person moves to another */}
              <RouteBoundary>
                <App />
                <CrashProbe />
              </RouteBoundary>
              <UpdatePrompt />
              <PeerLiveBadge />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  );
});
