export type Cell = string | number | boolean | null | undefined;

const guard = (s: string) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);

export function toCsv(rows: Cell[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return "";
          const raw = typeof cell === "string" ? guard(cell) : String(cell);
          return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
        })
        .join(","),
    )
    .join("\r\n");
}

export function downloadCsv(filename: string, rows: Cell[][]) {
  const blob = new Blob(["\uFEFF" + toCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
