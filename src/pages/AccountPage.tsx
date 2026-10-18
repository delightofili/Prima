import { useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  Copy,
  LogOut,
  Pencil,
  Share2,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Field, SectionTitle } from "../components/FormBits";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { useOnline, usePageTitle } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { friendlyError } from "../lib/auth";
import {
  MAX_STAFF,
  createInvite,
  formatInvite,
  listInvites,
  listMembers,
  removeMember,
  revokeInvite,
  updateFacility,
  type Invite,
  type Member,
} from "../lib/team";
import { formatDate } from "../lib/utils";

function EditFacilityDialog({ onClose }: { onClose: () => void }) {
  const { facility, refreshFacility } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(facility?.name ?? "");
  const [lga, setLga] = useState(facility?.lga ?? "");
  const [state, setState] = useState(facility?.state ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateFacility({ name, lga, state });
      await refreshFacility();
      toast("Facility updated");
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <Modal title="Edit facility" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-subtext">
          The facility code stays the same, because it is printed on cards.
        </p>
        <Field label="Facility name">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="LGA">
          <input
            className="input"
            value={lga}
            onChange={(e) => setLga(e.target.value)}
          />
        </Field>
        <Field label="State">
          <input
            className="input"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="font-medium text-danger">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </form>
    </Modal>
  );
}

function InviteDialog({
  code,
  facilityName,
  onClose,
}: {
  code: string;
  facilityName: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const pretty = formatInvite(code);
  const message =
    `Join ${facilityName} on Prima. Open ${window.location.origin}, tap "Create account", then "Join with a code" and enter ${pretty}. ` +
    "The code works once and expires in 7 days.";

  return (
    <Modal title="Invite code" onClose={onClose}>
      <p className="text-subtext">
        Give this code to your colleague. It works once and expires in 7 days.
      </p>
      <p className="rounded-xl bg-prima-50 p-4 text-center font-mono text-3xl font-bold tracking-widest text-prima-900">
        {pretty}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(pretty);
            toast("Code copied");
          }}
        >
          <Copy size={20} className="mr-2" /> Copy
        </button>
        <a
          className="btn btn-primary"
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
        >
          <Share2 size={20} className="mr-2" /> Share on WhatsApp
        </a>
      </div>
    </Modal>
  );
}

export function AccountPage() {
  usePageTitle("Account");
  const { account, facility, role, signOut } = useAuth();
  const toast = useToast();
  const online = useOnline();
  const isAdmin = role === "admin";

  const [members, setMembers] = useState<Member[] | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!isAdmin || !online) return;
    let alive = true;
    (async () => {
      try {
        const [m, i] = await Promise.all([listMembers(), listInvites()]);
        if (alive) {
          setMembers(m);
          setInvites(i);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(friendlyError(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [isAdmin, online, version]);

  if (!account || !facility) return null;
  const limit = MAX_STAFF[facility.plan];

  const invite = async () => {
    try {
      setNewCode(await createInvite("staff"));
      setVersion((v) => v + 1);
    } catch (e) {
      toast(friendlyError(e), "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Account"
        subtitle="You, your facility and your team."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3">
          <SectionTitle icon={ShieldCheck} title="You" />
          <p className="text-lg font-semibold">{account.name}</p>
          <p className="text-subtext">{account.email}</p>
          <p>
            <span className="rounded-full bg-prima-50 px-3 py-1 text-sm font-semibold text-prima-900">
              {role === "admin" ? "Facility admin" : "Staff"}
            </span>
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void signOut()}
          >
            <LogOut size={20} className="mr-2" /> Sign out
          </button>
          <p className="text-sm text-subtext">
            Signing out needs no internet. Records stay on this phone, hidden
            until someone from this facility signs in.
          </p>
        </section>

        <section className="card space-y-3">
          <SectionTitle icon={Building2} title="Facility" />
          <p className="text-lg font-semibold">{facility.name}</p>
          <p className="text-subtext">
            {facility.lga}, {facility.state} · code {facility.code}
          </p>
          <p className="text-sm text-subtext">
            Plan on the server:{" "}
            <strong className="capitalize">{facility.plan}</strong>. The app's
            own plan checks still use the testing switch until the plan day.
          </p>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(true)}
            >
              <Pencil size={20} className="mr-2" /> Edit details
            </button>
          )}
        </section>

        <section className="card space-y-3 md:col-span-2">
          <SectionTitle icon={Users} title="Team" />

          {!isAdmin ? (
            <p className="text-subtext">
              Ask your facility admin to add or remove staff.
            </p>
          ) : !online ? (
            <p className="text-subtext">
              You need internet to manage the team.
            </p>
          ) : error ? (
            <p role="alert" className="font-medium text-danger">
              {error}
            </p>
          ) : !members ? (
            <p className="text-subtext">Loading the team…</p>
          ) : (
            <>
              <p className="text-subtext">
                {members.length} of {limit} staff{" "}
                {limit === 1 ? "account" : "accounts"} used on the{" "}
                {facility.plan} plan.
              </p>
              <ul className="divide-y divide-line">
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {m.full_name}{" "}
                        {m.user_id === account.userId && (
                          <span className="text-subtext">(you)</span>
                        )}
                      </p>
                      <p className="truncate text-sm text-subtext">
                        {m.email} · {m.role === "admin" ? "Admin" : "Staff"} ·
                        joined{" "}
                        {formatDate(
                          new Date(m.joined_at).toLocaleDateString("en-CA"),
                        )}
                      </p>
                    </div>
                    {m.user_id !== account.userId && (
                      <button
                        type="button"
                        aria-label={`Remove ${m.full_name}`}
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-subtext hover:bg-page hover:text-danger"
                        onClick={() => setRemoving(m)}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="btn btn-accent sm:w-64"
                onClick={invite}
              >
                <UserPlus size={20} className="mr-2" /> Create invite code
              </button>

              {invites.length > 0 && (
                <div className="space-y-2 border-t border-line pt-3">
                  <p className="font-semibold">Unused invite codes</p>
                  {invites.map((i) => (
                    <div
                      key={i.code}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="font-mono font-semibold tracking-widest">
                        {formatInvite(i.code)}
                      </span>
                      <span className="text-sm text-subtext">
                        expires{" "}
                        {formatDate(
                          new Date(i.expires_at).toLocaleDateString("en-CA"),
                        )}
                      </span>
                      <button
                        type="button"
                        className="min-h-11 px-2 font-semibold text-danger"
                        onClick={async () => {
                          await revokeInvite(i.code);
                          setVersion((v) => v + 1);
                          toast("Invite cancelled");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.full_name}?`}
          message="They lose access to this facility's records. Their phone is locked the next time it goes online. You can invite them again later."
          confirmLabel="Remove"
          onCancel={() => setRemoving(null)}
          onConfirm={async () => {
            const target = removing;
            setRemoving(null);
            try {
              await removeMember(target.user_id);
              setVersion((v) => v + 1);
              toast(`${target.full_name} removed`);
            } catch (e) {
              toast(friendlyError(e), "error");
            }
          }}
        />
      )}
      {newCode && (
        <InviteDialog
          code={newCode}
          facilityName={facility.name}
          onClose={() => setNewCode(null)}
        />
      )}
      {editing && <EditFacilityDialog onClose={() => setEditing(false)} />}
    </>
  );
}
