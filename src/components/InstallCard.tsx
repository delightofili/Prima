import { useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { useToast } from "../hooks/useToast";
import {
  dismissInstallBanner,
  installBannerHidden,
  promptInstall,
  useInstall,
} from "../lib/install";
import { SectionTitle } from "./FormBits";

export function InstallCard() {
  const { canPrompt, installed, ios } = useInstall();
  const toast = useToast();

  return (
    <section className="card space-y-3 md:col-span-2">
      <SectionTitle icon={Smartphone} title="Install on this phone" />
      {installed ? (
        <p>
          Prima is installed. It opens from your home screen and works with no
          signal.
        </p>
      ) : canPrompt ? (
        <>
          <p>
            Install Prima to open it from your home screen, full screen, and use
            it with no signal.
          </p>
          <button
            type="button"
            className="btn btn-primary sm:w-56"
            onClick={async () => {
              if ((await promptInstall()) === "accepted")
                toast("Prima is installing");
            }}
          >
            Install Prima
          </button>
        </>
      ) : ios ? (
        <p>
          On iPhone or iPad: tap the Share button in Safari, then "Add to Home
          Screen".
        </p>
      ) : (
        <p>
          In Chrome, tap the menu (three dots), then "Install app" or "Add to
          Home screen". If you do not see it, open Prima in Chrome itself, not
          inside another app.
        </p>
      )}
      <Link
        to="/phone-check"
        className="inline-block font-semibold text-prima-500 underline"
      >
        Check how well this phone suits Prima
      </Link>
    </section>
  );
}

// A gentle one-line offer on the home screen, hidden for 14 days once dismissed
export function InstallBanner() {
  const { canPrompt, installed } = useInstall();
  const [hidden, setHidden] = useState(installBannerHidden);
  if (!canPrompt || installed || hidden) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-prima-500 bg-prima-50 p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Smartphone size={20} className="shrink-0 text-prima-500" />
        Put Prima on your home screen. It opens full screen and works with no
        signal.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary sm:w-32"
          onClick={() => void promptInstall()}
        >
          Install
        </button>
        <button
          type="button"
          className="min-h-12 px-3 font-semibold text-subtext"
          onClick={() => {
            dismissInstallBanner();
            setHidden(true);
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
