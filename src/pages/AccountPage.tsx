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
import { Link } from "react-router-dom";
import { SecurityCard } from "../components/SecurityCard";
import { useCan } from "../hooks/useCan";
import { BackupCard } from "../components/BackupCard";
import { PlanCard } from "../components/PlanCard";
import { InstallCard } from "../components/InstallCard";
import { PowerCard } from "../components/PowerCard";
import { LanguageCard } from "../components/LanguageCard";
import { useI18n } from "../i18n";

function EditFacilityDialog({ onClose }: { onClose: () => void }) {
  const { facility, refreshFacility } = useAuth();
  const { t } = useI18n();
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
      toast(t("facility.updated"));
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <Modal title={t("facility.editTitle")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-subtext">{t("facility.codeNote")}</p>
        <Field label={t("facility.name")}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t("facility.lga")}>
          <input
            className="input"
            value={lga}
            onChange={(e) => setLga(e.target.value)}
          />
        </Field>
        <Field label={t("facility.state")}>
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
          {t("common.save")}
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
  const { t } = useI18n();
  const pretty = formatInvite(code);
  const message =
    `Join ${facilityName} on Prima. Open ${window.location.origin}, tap "Create account", then "Join with a code" and enter ${pretty}. ` +
    "The code works once and expires in 7 days.";

  return (
    <Modal title={t("invite.title")} onClose={onClose}>
      <p className="text-subtext">{t("invite.help")}</p>
      <p className="rounded-xl bg-prima-50 p-4 text-center font-mono text-3xl font-bold tracking-widest text-prima-900">
        {pretty}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(pretty);
            toast(t("invite.codeCopied"));
          }}
        >
          <Copy size={20} className="mr-2" /> {t("invite.copy")}
        </button>
        <a
          className="btn btn-primary"
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
        >
          <Share2 size={20} className="mr-2" /> {t("invite.whatsapp")}
        </a>
      </div>
    </Modal>
  );
}

export function AccountPage() {
  const { t, tp, date } = useI18n();
  usePageTitle(t("account.title"));
  const can = useCan();
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
      <PageHeader title={t("account.title")} subtitle={t("account.subtitle")} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LanguageCard />
        <section className="card space-y-3">
          <SectionTitle icon={ShieldCheck} title={t("account.you")} />
          <p className="text-lg font-semibold">{account.name}</p>
          <p className="text-subtext">{account.email}</p>
          <p>
            <span className="rounded-full bg-prima-50 px-3 py-1 text-sm font-semibold text-prima-900">
              {t(role === "admin" ? "account.roleAdmin" : "account.roleStaff")}
            </span>
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void signOut()}
          >
            <LogOut size={20} className="mr-2" /> {t("account.signOut")}
          </button>
          <p className="text-sm text-subtext">{t("account.signOutNote")}</p>
        </section>

        <section className="card space-y-3">
          <SectionTitle icon={Building2} title={t("account.facility")} />
          <p className="text-lg font-semibold">{facility.name}</p>
          <p className="text-subtext">
            {t("account.facilityLine", {
              lga: facility.lga,
              state: facility.state,
              code: facility.code,
            })}
          </p>
          <p className="text-sm text-subtext">
            {t("account.planOnServer")}{" "}
            <strong className="capitalize">{facility.plan}</strong>.{" "}
            {t("account.planTestingNote")}
          </p>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(true)}
            >
              <Pencil size={20} className="mr-2" /> {t("account.editDetails")}
            </button>
          )}
        </section>

        <SecurityCard />
        <PlanCard />
        <InstallCard />
        <PowerCard />
        {can("backup") && <BackupCard />}

        <section className="card space-y-3 md:col-span-2">
          <h2 className="text-lg font-bold">{t("account.privacy")}</h2>
          <Link
            to="/privacy"
            className="block font-semibold text-prima-500 underline"
          >
            {t("account.readNotice")}
          </Link>
          {can("viewAudit") && (
            <Link to="/admin" className="btn btn-secondary sm:w-64">
              {t("account.auditLink")}
            </Link>
          )}
        </section>

        <section className="card space-y-3 md:col-span-2">
          <SectionTitle icon={Users} title={t("team.title")} />

          {!isAdmin ? (
            <p className="text-subtext">{t("team.askAdmin")}</p>
          ) : !online ? (
            <p className="text-subtext">{t("team.needInternet")}</p>
          ) : error ? (
            <p role="alert" className="font-medium text-danger">
              {error}
            </p>
          ) : !members ? (
            <p className="text-subtext">{t("team.loading")}</p>
          ) : (
            <>
              <p className="text-subtext">
                {tp("team.count", limit, {
                  used: members.length,
                  limit,
                  plan: facility.plan,
                })}
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
                          <span className="text-subtext">{t("team.you")}</span>
                        )}
                      </p>
                      <p className="truncate text-sm text-subtext">
                        {t("team.memberLine", {
                          email: m.email,
                          role: t(
                            m.role === "admin" ? "team.admin" : "team.staff",
                          ),
                          date: date(new Date(m.joined_at)),
                        })}
                      </p>
                    </div>
                    {m.user_id !== account.userId && (
                      <button
                        type="button"
                        aria-label={t("team.removeAria", { name: m.full_name })}
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
                <UserPlus size={20} className="mr-2" /> {t("team.createInvite")}
              </button>

              {invites.length > 0 && (
                <div className="space-y-2 border-t border-line pt-3">
                  <p className="font-semibold">{t("team.unusedInvites")}</p>
                  {invites.map((i) => (
                    <div
                      key={i.code}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="font-mono font-semibold tracking-widest">
                        {formatInvite(i.code)}
                      </span>
                      <span className="text-sm text-subtext">
                        {t("team.expires", {
                          date: date(new Date(i.expires_at)),
                        })}
                      </span>
                      <button
                        type="button"
                        className="min-h-11 px-2 font-semibold text-danger"
                        onClick={async () => {
                          await revokeInvite(i.code);
                          setVersion((v) => v + 1);
                          toast(t("team.inviteCancelled"));
                        }}
                      >
                        {t("common.cancel")}
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
          title={t("team.removeTitle", { name: removing.full_name })}
          message={t("team.removeMessage")}
          confirmLabel={t("team.remove")}
          onCancel={() => setRemoving(null)}
          onConfirm={async () => {
            const target = removing;
            setRemoving(null);
            try {
              await removeMember(target.user_id);
              setVersion((v) => v + 1);
              toast(t("team.removed", { name: target.full_name }));
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
