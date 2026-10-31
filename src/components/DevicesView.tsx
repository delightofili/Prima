import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BatteryLow,
  CircleCheck,
  Clock,
  CloudUpload,
  Info,
  Pencil,
  RefreshCw,
  Smartphone,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useSyncState } from "../hooks/useSyncState";
import { useClock, useDevices } from "../hooks/useDevices";
import { useToast } from "../hooks/useToast";
import { removeDevice, renameDevice } from "../lib/deviceApi";
import {
  MINUTE,
  classifyDevice,
  deviceLabelFromAgent,
  newestBuildOf,
  sortByNeed,
  spanMsg,
  summarize,
  type Context,
  type DeviceRow,
  type Flag,
  type Verdict,
} from "../lib/deviceHealth";
import { getDeviceId } from "../lib/deviceStatus";
import { useI18n } from "../i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./FormBits";
import { Modal } from "./Modal";
import { StatTile } from "./StatTile";

const nameOf = (r: DeviceRow) => r.label ?? r.deviceName;

function RenameDialog({
  row,
  onClose,
  onSaved,
}: {
  row: DeviceRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [value, setValue] = useState(row.label ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await renameDevice(row.id, value);
      toast(t("dev.renamed"));
      onSaved();
      onClose();
    } catch {
      setError(t("dev.failed"));
      setBusy(false);
    }
  };

  return (
    <Modal title={t("dev.renameTitle")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-subtext">{t("dev.renameHelp")}</p>
        <Field label={t("dev.renameField")}>
          <input
            className="input"
            maxLength={60}
            value={value}
            placeholder={row.deviceName}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="font-medium text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            className="btn btn-secondary md:w-36"
            onClick={onClose}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="btn btn-primary md:w-44"
            disabled={busy}
          >
            {t("common.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// The coloured edge of a card is its own little element, so it shows whatever order the stylesheet is read in
const STRIPE = {
  bad: "bg-danger",
  warn: "bg-accent-500",
  ok: "bg-prima-500",
} as const;
const Stripe = ({ level }: { level: keyof typeof STRIPE }) => (
  <span
    aria-hidden
    className={`absolute inset-y-0 left-0 w-1.5 ${STRIPE[level]}`}
  />
);

function DeviceCard({
  row,
  verdict,
  serverNow,
  isThis,
  onRename,
  onRemove,
}: {
  row: DeviceRow;
  verdict: Verdict;
  serverNow: number;
  isThis: boolean;
  onRename: () => void;
  onRemove: () => void;
}) {
  const { t, tp, tm } = useI18n();
  const span = (ms: number) => tm(spanMsg(ms));
  const seenAge = Math.max(0, serverNow - row.seenAt);
  // Time since the last good sync is measured on the device's own clock at both ends, so a wrong clock cannot distort it
  const syncAge =
    row.lastSyncAt !== null && row.deviceTime !== null
      ? Math.max(0, row.deviceTime - row.lastSyncAt)
      : null;

  const flagText = (f: Flag): string => {
    switch (f.id) {
      case "failed":
        return tp("dev.flag.failed", f.count ?? 0);
      case "unseen":
        return t("dev.flag.unseen", { span: span(f.ms ?? 0) });
      case "stuck":
        return tp("dev.flag.stuck", f.count ?? 0, { span: span(f.ms ?? 0) });
      case "behind":
        return f.many
          ? t("dev.flag.behindMany")
          : tp("dev.flag.behind", f.count ?? 0);
      case "never":
        return t("dev.flag.never");
      case "clock":
        return t("dev.flag.clock", { span: span(f.ms ?? 0) });
      case "oldApp":
        return t("dev.flag.oldApp");
      case "lowBattery":
        return t("dev.flag.lowBattery", { percent: f.percent ?? 0 });
      case "powerSaving":
        return t("dev.flag.powerSaving");
    }
  };

  const chip =
    verdict.level === "bad"
      ? {
          text: t("dev.sumBad"),
          cls: "bg-danger/10 text-danger",
          Icon: TriangleAlert,
        }
      : verdict.level === "warn"
        ? { text: t("dev.sumWarn"), cls: "bg-accent-50 text-ink", Icon: Clock }
        : {
            text: t("dev.ok"),
            cls: "bg-prima-50 text-prima-900",
            Icon: CircleCheck,
          };

  return (
    <li className="card relative space-y-3 overflow-hidden">
      <Stripe level={verdict.level} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            <Smartphone size={18} className="shrink-0 text-prima-500" />
            <span className="break-words">{nameOf(row)}</span>
            {isThis && (
              <span className="rounded-full bg-prima-50 px-2 py-0.5 text-xs font-semibold text-prima-900">
                {t("dev.thisDevice")}
              </span>
            )}
          </p>
          {row.label && (
            <p className="break-words text-sm text-subtext">{row.deviceName}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${chip.cls}`}
        >
          <chip.Icon size={16} className="shrink-0" />
          {chip.text}
        </span>
      </div>

      <ul className="space-y-1 text-sm">
        <li>
          {seenAge < MINUTE
            ? t("dev.lastSeenNow")
            : t("dev.lastSeen", { span: span(seenAge) })}
        </li>
        <li>
          {syncAge !== null
            ? t("dev.lastSync", { span: span(syncAge) })
            : t("dev.lastSyncNever")}
        </li>
        <li>
          {row.waiting > 0
            ? t("sync.waiting", { count: row.waiting })
            : row.failed === 0
              ? t("dev.waitingNone")
              : null}
        </li>
        {row.userName && (
          <li className="text-subtext">
            {t("dev.usedBy", { name: row.userName })}
          </li>
        )}
        {row.appVersion && row.appVersion !== "unknown" && (
          <li className="text-subtext">
            {t("dev.version", { build: row.appVersion })}
          </li>
        )}
        {row.battery !== null && (
          <li className="flex items-center gap-1.5 text-subtext">
            <BatteryLow size={14} className="shrink-0" />
            {t(row.charging ? "dev.batteryCharging" : "dev.battery", {
              percent: row.battery,
            })}
          </li>
        )}
      </ul>

      {verdict.flags.length > 0 && (
        <ul className="space-y-1.5">
          {verdict.flags.map((f) => (
            <li
              key={f.id}
              className={`flex items-start gap-2 text-sm ${f.severity === "bad" ? "font-semibold text-danger" : f.severity === "warn" ? "font-medium" : "text-subtext"}`}
            >
              {f.severity === "info" ? (
                <Info size={16} className="mt-0.5 shrink-0" />
              ) : (
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              )}
              <span>{flagText(f)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-prima-500 hover:bg-prima-50"
          onClick={onRename}
        >
          <Pencil size={16} /> {t("dev.rename")}
        </button>
        {!isThis && (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-danger hover:bg-danger/10"
            onClick={onRemove}
          >
            <Trash2 size={16} /> {t("dev.remove")}
          </button>
        )}
      </div>
    </li>
  );
}

// Shown when the cloud list is not available, so the screen is never empty: what this phone knows about itself
function LocalCard({ id }: { id: string }) {
  const { t, tm } = useI18n();
  const { state, counts } = useSyncState();
  return (
    <li className="card relative space-y-2 overflow-hidden">
      <Stripe level="ok" />
      <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
        <Smartphone size={18} className="shrink-0 text-prima-500" />
        <span className="break-words">
          {deviceLabelFromAgent(navigator.userAgent, id)}
        </span>
        <span className="rounded-full bg-prima-50 px-2 py-0.5 text-xs font-semibold text-prima-900">
          {t("dev.thisDevice")}
        </span>
      </p>
      <p className="font-medium">{tm(state.label)}</p>
      <p className="text-sm text-subtext">
        {counts.waiting > 0
          ? t("sync.waiting", { count: counts.waiting })
          : t("dev.waitingNone")}
      </p>
    </li>
  );
}

export function DevicesView() {
  const { t, tm } = useI18n();
  const toast = useToast();
  const { data, problem, fetchedAt, busy, refresh } = useDevices();
  const clock = useClock();
  const [thisId, setThisId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<DeviceRow | null>(null);
  const [removing, setRemoving] = useState<DeviceRow | null>(null);

  useEffect(() => {
    void getDeviceId().then(setThisId);
  }, []);

  const items = useMemo(() => {
    if (!data) return [];
    const ctx: Context = {
      now: data.serverNow,
      facilityPulse: data.facilityPulse,
      newestBuild: newestBuildOf(data.rows),
    };
    return sortByNeed(
      data.rows.map((row) => ({ row, verdict: classifyDevice(row, ctx) })),
    );
  }, [data]);
  const summary = useMemo(() => summarize(items), [items]);

  const others = items.filter((i) => i.row.id !== thisId).length;
  const showLocal = thisId !== null && !items.some((i) => i.row.id === thisId);
  const updated = fetchedAt === null ? null : Math.max(0, clock - fetchedAt);

  const problemText = problem
    ? t(
        (
          {
            offline: "dev.offline",
            setup: "dev.setup",
            signin: "dev.signin",
            forbidden: "dev.forbidden",
            failed: "dev.failed",
          } as const
        )[problem],
      )
    : null;

  return (
    <div className="space-y-5">
      <section className="card space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Smartphone size={20} className="text-prima-500" />{" "}
              {t("dev.title")}
            </h2>
            <p className="text-subtext">{t("dev.help")}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary sm:w-44"
            disabled={busy}
            onClick={() => void refresh()}
          >
            <RefreshCw
              size={18}
              className={`mr-2 ${busy ? "animate-spin" : ""}`}
            />{" "}
            {busy ? t("dev.refreshing") : t("dev.refresh")}
          </button>
        </div>
        {updated !== null && (
          <p className="text-sm text-subtext">
            {updated < MINUTE
              ? t("dev.updatedNow")
              : t("dev.updated", { span: tm(spanMsg(updated)) })}
          </p>
        )}
      </section>

      {problemText && (
        <p role="alert" className="rounded-xl bg-accent-50 p-3 font-medium">
          {problemText}
        </p>
      )}

      {data && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label={t("dev.sumDevices")}
            value={summary.total}
            icon={Smartphone}
          />
          <StatTile label={t("dev.ok")} value={summary.ok} icon={CircleCheck} />
          <StatTile
            label={t("dev.sumWarn")}
            value={summary.warn}
            icon={Clock}
            tone="orange"
          />
          <StatTile
            label={t("dev.sumBad")}
            value={summary.bad}
            icon={TriangleAlert}
            tone="orange"
          />
          <StatTile
            label={t("dev.sumWaiting")}
            value={summary.waiting}
            icon={CloudUpload}
            tone="orange"
          />
        </section>
      )}

      <ul className="grid gap-3 lg:grid-cols-2">
        {showLocal && thisId && <LocalCard id={thisId} />}
        {items.map(({ row, verdict }) => (
          <DeviceCard
            key={row.id}
            row={row}
            verdict={verdict}
            serverNow={data?.serverNow ?? 0}
            isThis={row.id === thisId}
            onRename={() => setRenaming(row)}
            onRemove={() => setRemoving(row)}
          />
        ))}
      </ul>

      {data && others === 0 && !problem && (
        <p className="rounded-xl bg-page p-3 text-subtext">{t("dev.none")}</p>
      )}

      {renaming && (
        <RenameDialog
          row={renaming}
          onClose={() => setRenaming(null)}
          onSaved={() => void refresh()}
        />
      )}
      {removing && (
        <ConfirmDialog
          title={t("dev.removeTitle", { name: nameOf(removing) })}
          message={t("dev.removeText")}
          confirmLabel={t("dev.remove")}
          onCancel={() => setRemoving(null)}
          onConfirm={async () => {
            const gone = removing;
            setRemoving(null);
            try {
              await removeDevice(gone.id);
              toast(t("dev.removed", { name: nameOf(gone) }));
              await refresh();
            } catch {
              toast(t("dev.failed"), "error");
            }
          }}
        />
      )}
    </div>
  );
}
