// Turns a QR module grid into one SVG path. Runs of dark squares in a row are joined, so the path stays short.
export function qrPath(
  size: number,
  isDark: (row: number, col: number) => boolean,
): string {
  let d = "";
  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!isDark(row, col)) {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < size && isDark(row, col + run)) run++;
      d += `M${col} ${row}h${run}v1h-${run}z`;
      col += run;
    }
  }
  return d;
}
