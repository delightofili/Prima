import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useOnline } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { ReauthDialog } from "./AuthScreens";

export function SessionBanner() {
  const { cloudOk, account } = useAuth();
  const online = useOnline();
  const [open, setOpen] = useState(false);
  if (cloudOk || !account) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4">
      <p className="flex items-center gap-2 font-semibold">
        <KeyRound size={20} className="shrink-0" />
        {online
          ? "Sign in again to keep syncing. Your records are safe on this phone."
          : "You are offline. Prima works normally and will sync once you sign in again online."}
      </p>
      {online && (
        <button
          type="button"
          className="btn btn-primary sm:w-40"
          onClick={() => setOpen(true)}
        >
          Sign in
        </button>
      )}
      {open && <ReauthDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
