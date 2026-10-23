import { useMemo, useState, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import { downloadBlob } from "../lib/download";
import {
  indicatorList,
  parseMapping,
  templateJson,
  validateConfig,
  type Dhis2Config,
} from "../lib/dhis2";
import { Field } from "./FormBits";
import { Modal } from "./Modal";

export function Dhis2MappingDialog({
  initial,
  onSave,
  onClose,
}: {
  initial: Dhis2Config;
  onSave: (cfg: Dhis2Config) => Promise<void>;
  onClose: () => void;
}) {
  const [cfg, setCfg] = useState<Dhis2Config>(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, ReturnType<typeof indicatorList>>();
    for (const i of indicatorList())
      map.set(i.group, [...(map.get(i.group) ?? []), i]);
    return [...map.entries()];
  }, []);

  const setItem = (
    key: string,
    field: "dataElement" | "categoryOptionCombo",
    value: string,
  ) => {
    setCfg((prev) => {
      const current = prev.items[key] ?? { dataElement: "" };
      const next = { ...current, [field]: value.trim() };
      const items = { ...prev.items };
      if (!next.dataElement && !next.categoryOptionCombo) delete items[key];
      else items[key] = next;
      return { ...prev, items };
    });
  };

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setCfg(parseMapping(await file.text()));
      setProblems([]);
    } catch (err) {
      setProblems([
        err instanceof Error ? err.message : "Could not read the file.",
      ]);
    }
  };

  const save = async () => {
    const found = validateConfig(cfg);
    setProblems(found);
    if (found.length > 0) return;
    setBusy(true);
    await onSave(cfg);
    setBusy(false);
    onClose();
  };

  return (
    <Modal title="DHIS2 mapping" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-subtext">
          DHIS2 needs to know which of its data fields each Prima figure belongs
          to. Your district M&amp;E officer can give you these codes (each is 11
          letters and numbers). Download the template, have it filled in once,
          and import it here.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              downloadBlob(
                "prima-dhis2-mapping-template.json",
                new Blob([templateJson()], { type: "application/json" }),
              )
            }
          >
            <Download size={20} className="mr-2" /> Template
          </button>
          <label className="btn btn-secondary cursor-pointer">
            <Upload size={20} className="mr-2" /> Import mapping
            <input
              type="file"
              className="sr-only"
              onChange={(e) => void importFile(e)}
            />
          </label>
        </div>

        <Field label="Facility code in DHIS2 (organisation unit)">
          <input
            className="input font-mono"
            maxLength={11}
            autoCapitalize="none"
            spellCheck={false}
            value={cfg.orgUnit}
            onChange={(e) => setCfg({ ...cfg, orgUnit: e.target.value.trim() })}
          />
        </Field>
        <Field label="Data set code (optional)">
          <input
            className="input font-mono"
            maxLength={11}
            autoCapitalize="none"
            spellCheck={false}
            value={cfg.dataSet ?? ""}
            onChange={(e) =>
              setCfg({ ...cfg, dataSet: e.target.value.trim() || undefined })
            }
          />
        </Field>

        {groups.map(([group, list]) => {
          const mapped = list.filter(
            (i) => cfg.items[i.key]?.dataElement,
          ).length;
          return (
            <details
              key={group}
              className="rounded-xl border-2 border-line bg-white"
            >
              <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3 font-semibold">
                {group}
                <span className="text-sm font-normal text-subtext">
                  {mapped} of {list.length} mapped
                </span>
              </summary>
              <div className="space-y-4 border-t-2 border-line p-3">
                {list.map((i) => (
                  <div key={i.key} className="space-y-2">
                    <p className="font-medium">{i.label}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        className="input font-mono"
                        placeholder="Data element"
                        aria-label={`${i.label}: data element`}
                        maxLength={11}
                        autoCapitalize="none"
                        spellCheck={false}
                        value={cfg.items[i.key]?.dataElement ?? ""}
                        onChange={(e) =>
                          setItem(i.key, "dataElement", e.target.value)
                        }
                      />
                      <input
                        className="input font-mono"
                        placeholder="Category option combo (if needed)"
                        aria-label={`${i.label}: category option combo`}
                        maxLength={11}
                        autoCapitalize="none"
                        spellCheck={false}
                        value={cfg.items[i.key]?.categoryOptionCombo ?? ""}
                        onChange={(e) =>
                          setItem(i.key, "categoryOptionCombo", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}

        {problems.length > 0 && (
          <ul role="alert" className="space-y-1 font-medium text-danger">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            className="btn btn-secondary md:w-36"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary md:w-48"
            disabled={busy}
            onClick={() => void save()}
          >
            Save mapping
          </button>
        </div>
      </div>
    </Modal>
  );
}
