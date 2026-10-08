import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-base font-semibold">{label}</span>
      {children}
      {hint && !error && (
        <span className="block text-sm text-subtext">{hint}</span>
      )}
      {error && (
        <span role="alert" className="block text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

export function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold">
      <Icon size={22} className="text-prima-500" /> {title}
    </h2>
  );
}
