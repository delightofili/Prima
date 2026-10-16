import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessageSquare } from "lucide-react";
import { formatDate } from "../lib/utils";

function ConsentDialog({
  who,
  phone,
  onYes,
  onClose,
}: {
  who: string;
  phone: string;
  onYes: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-prima-50 p-2 text-prima-500">
            <MessageSquare size={22} />
          </span>
          <div>
            <h2 id="consent-title" className="text-lg font-bold">
              Confirm SMS consent
            </h2>
            <p className="mt-1">
              Has <strong>{who}</strong> agreed to receive appointment reminders
              by SMS on <strong>{phone}</strong>?
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-subtext">
              <li>
                Messages only give the date of the visit, never health details.
              </li>
              <li>
                They can stop at any time, and you can switch this off here.
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            autoFocus
            className="btn btn-secondary md:w-36"
            onClick={onClose}
          >
            Not yet
          </button>
          <button
            type="button"
            className="btn btn-primary md:w-48"
            onClick={onYes}
          >
            Yes, they agreed
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface Props {
  who: string;
  phone: string;
  consented: boolean;
  since?: number;
  disabled?: boolean;
  note?: string;
  onChange: (on: boolean) => void | Promise<void>;
}

export function SmsConsentToggle({
  who,
  phone,
  consented,
  since,
  disabled,
  note,
  onChange,
}: Props) {
  const [asking, setAsking] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        role="switch"
        aria-checked={consented}
        disabled={disabled}
        onClick={() => (consented ? void onChange(false) : setAsking(true))}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border-2 border-line bg-white px-3 text-left font-semibold disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          <MessageSquare size={20} className="text-prima-500" /> Appointment
          reminders by SMS
        </span>
        <span
          className={`relative h-7 w-12 shrink-0 rounded-full ${consented ? "bg-prima-500" : "bg-line"}`}
        >
          <span
            className={`absolute top-0.5 size-6 rounded-full bg-white transition-all ${
              consented ? "left-[1.375rem]" : "left-0.5"
            }`}
          />
        </span>
      </button>

      {consented && since && (
        <p className="text-sm text-subtext">
          Consent recorded on{" "}
          {formatDate(new Date(since).toLocaleDateString("en-CA"))}.
        </p>
      )}
      {note && <p className="text-sm text-subtext">{note}</p>}

      {asking && (
        <ConsentDialog
          who={who}
          phone={phone}
          onClose={() => setAsking(false)}
          onYes={() => {
            setAsking(false);
            void onChange(true);
          }}
        />
      )}
    </div>
  );
}
