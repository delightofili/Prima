type Tone = "teal" | "orange" | "pink";

const BAR: Record<Tone, string> = {
  teal: "bg-prima-500",
  orange: "bg-accent-500",
  pink: "bg-pregnant",
};

export function StatTile({
  label,
  value,
  tone = "teal",
}: {
  label: string;
  value: number;
  tone?: Tone;
}) {
  return (
    <div className="card relative overflow-hidden pl-5">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${BAR[tone]}`} />
      <p className="text-sm font-semibold text-subtext">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
