import { PageHeader } from "../components/PageHeader";
import { usePageTitle } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { NOTICE_VERSION } from "../lib/privacy";

export function PrivacyPage() {
  usePageTitle("Privacy notice");
  const { facility } = useAuth();
  const name = facility?.name ?? "this clinic";

  return (
    <>
      <PageHeader
        title="Privacy notice"
        subtitle={`How ${name} looks after your information`}
      />
      <p className="mb-4 rounded-xl border-2 border-accent-500 bg-accent-50 p-3 font-medium">
        Draft ({NOTICE_VERSION}). A lawyer or the facility's data protection
        officer must review this wording, and how long records are kept, before
        real use.
      </p>
      <div className="card max-w-3xl space-y-4 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold">What we keep</h2>
          <p>
            Your name, date of birth, address, phone number, next of kin, and
            your health information: visits, tests, diagnoses, vaccines and
            medicines. For a child, we also keep the name and phone of the
            parent or guardian.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Why we keep it</h2>
          <p>
            To look after you, to remind you of appointments and vaccines, and
            to report totals (never your name) to the health authorities.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Who can see it</h2>
          <p>
            Only staff of {name}, each with their own sign-in. Everything staff
            do in the system is recorded. We do not sell your information.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Where it is kept</h2>
          <p>
            On the clinic's phones and computers, and in a protected online
            database that only this clinic can open.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Text message reminders</h2>
          <p>
            Only if you agree. A reminder gives the date of your visit and never
            your health details. You can stop them at any time by telling us.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Your rights</h2>
          <p>
            You can ask to see your record, to have a mistake corrected, to stop
            text reminders, and to ask for your record to be removed. Some
            health records must be kept for a period set by law, and we will
            explain this to you when you ask. Speak to the person in charge of
            the clinic.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">If you are not happy</h2>
          <p>
            Tell the person in charge first. You can also complain to the
            Nigeria Data Protection Commission, which oversees the Nigeria Data
            Protection Act.
          </p>
        </section>
      </div>
    </>
  );
}
