import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { ToastProvider } from "./components/Toast";
import { startSync } from "./lib/syncService";
import { applyGlove, readGlove } from "./hooks/useGloveMode";
import { startReminderSync } from "./lib/reminders";

applyGlove(readGlove());
startSync();
startReminderSync();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
