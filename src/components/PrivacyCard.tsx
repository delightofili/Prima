import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { recordNotice } from "../lib/privacy";
import { formatDate } from "../lib/utils";
import type { Patient } from "../types";
import { Modal } from "./Modal";

export function PrivacyCard({ patient }: { patient: Patient }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  return (
    <section className="card space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <ShieldCheck size={20} className="text-prima-500" /> Privacy notice
      </h2>
      {patient.noticeAt ? (
        <p>
          Explained on{" "}
          {formatDate(new Date(patient.noticeAt).toLocaleDateString("en-CA"))}{" "}
          (version {patient.noticeVersion}).
        </p>
      ) : (
        <>
          <p className="rounded-xl bg-accent-50 p-3 font-medium">
            Not recorded yet.
          </p>
          <button
            type="button"
            className="btn btn-secondary sm:w-56"
            onClick={() => setOpen(true)}
          >
            Record it now
          </button>
        </>
      )}
      <Link
        to="/privacy"
        className="inline-block font-semibold text-prima-500 underline"
      >
        Read the privacy notice
      </Link>

      {open && (
        <Modal
          title="Explain the privacy notice"
          onClose={() => setOpen(false)}
        >
          <p>Say this to the patient (or their guardian):</p>
          <blockquote className="rounded-xl bg-page p-3 italic">
            “We keep your health information to look after you, and only our
            staff can see it. You can ask to see it, to correct it, or to have
            it removed. Text reminders are optional.”
          </blockquote>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              await recordNotice(patient.id);
              toast("Privacy notice recorded");
              setOpen(false);
            }}
          >
            Yes, I explained this
          </button>
        </Modal>
      )}
    </section>
  );
}
