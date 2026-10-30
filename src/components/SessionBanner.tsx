import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useOnline } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { ReauthDialog } from "./AuthScreens";
import { useI18n } from "../i18n";

export function SessionBanner() {
  const { cloudOk, account } = useAuth();
  const online = useOnline();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (cloudOk || !account) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4">
      <p className="flex items-center gap-2 font-semibold">
        <KeyRound size={20} className="shrink-0" />
        {online ? t("session.reauth") : t("session.offline")}
      </p>
      {online && (
        <button
          type="button"
          className="btn btn-primary sm:w-40"
          onClick={() => setOpen(true)}
        >
          {t("auth.signIn")}
        </button>
      )}
      {open && <ReauthDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
