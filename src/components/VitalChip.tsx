import type { LucideIcon } from "lucide-react";
import type { Flag } from "../lib/vitals";

const TONE: Record<Flag, string> = {
  normal: "bg-prima-50 text-prima-900",
  warn: "bg-accent-50 text-ink ring-2 ring-accent-500",
  danger: "bg-danger/10 text-danger ring-2 ring-danger",
};

export function VitalChip({
  icon: Icon,
  text,
  flag = "normal",
  note,
}: {
  icon: LucideIcon;
  text: string;
  flag?: Flag;
  note?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${TONE[flag]}`}
    >
      <Icon size={16} />
      {text}
      {note && <strong> · {note}</strong>}
    </span>
  );
}
