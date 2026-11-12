import { useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { useI18n } from "../i18n";
import {
  dismissInstallBanner,
  installBannerHidden,
  promptInstall,
  useInstall,
} from "../lib/install";
import { SectionTitle } from "./FormBits";

export function InstallCard() {
  const { t } = useI18n();
  const { canPrompt, installed, ios } = useInstall();
  const toast = useToast();

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={Smartphone} title={t("inst.title")} />
      {installed ? (
        <p>{t("inst.installed")}</p>
      ) : canPrompt ? (
        <>
          <p>{t("inst.offer")}</p>
          <button
            type="button"
            className="btn btn-primary sm:w-56"
            onClick={async () => {
              if ((await promptInstall()) === "accepted")
                toast(t("inst.started"));
            }}
          >
            {t("inst.button")}
          </button>
        </>
      ) : ios ? (
        <p>{t("inst.ios")}</p>
      ) : (
        <p>{t("inst.android")}</p>
      )}
      <Link
        to="/phone-check"
        className="inline-block font-semibold text-prima-500 underline"
      >
        {t("inst.check")}
      </Link>
    </section>
  );
}

// A gentle one-line offer on the home screen, hidden for 14 days once dismissed
export function InstallBanner() {
  const { t } = useI18n();
  const { canPrompt, installed } = useInstall();
  const [hidden, setHidden] = useState(installBannerHidden);
  if (!canPrompt || installed || hidden) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-prima-500 bg-prima-50 p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Smartphone size={20} className="shrink-0 text-prima-500" />
        {t("inst.banner")}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary sm:w-32"
          onClick={() => void promptInstall()}
        >
          {t("inst.bannerButton")}
        </button>
        <button
          type="button"
          className="min-h-12 px-3 font-semibold text-subtext"
          onClick={() => {
            dismissInstallBanner();
            setHidden(true);
          }}
        >
          {t("upgrade.notNow")}
        </button>
      </div>
    </div>
  );
}
