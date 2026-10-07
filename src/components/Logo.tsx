export function Logo({
  light = false,
  size = 36,
}: {
  light?: boolean;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <rect
          width="40"
          height="40"
          rx="10"
          fill={light ? "#ffffff" : "#0F766E"}
        />
        <path
          d="M17 9h6v8h8v6h-8v8h-6v-8H9v-6h8z"
          fill={light ? "#0F766E" : "#ffffff"}
        />
      </svg>
      <span
        className={`text-xl font-bold tracking-tight ${light ? "text-white" : "text-prima-900"}`}
      >
        Prima
      </span>
    </div>
  );
}
