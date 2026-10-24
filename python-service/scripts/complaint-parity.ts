import { readFileSync } from "node:fs";
import { checkComplaint } from "../../src/lib/complaintCheck.js";
const cases = JSON.parse(
  readFileSync(new URL("../tests/complaint_cases.json", import.meta.url), "utf-8"),
) as { text: string; expected: unknown }[];
let bad = 0;
for (const c of cases) {
  const got = JSON.stringify(checkComplaint(c.text));
  const want = JSON.stringify(c.expected);
  if (got !== want) {
    bad++;
    if (bad <= 5)
      console.log(
        "DIFF",
        JSON.stringify(c.text),
        "\n  ts:",
        got,
        "\n  py:",
        want,
      );
  }
}
console.log(
  bad === 0
    ? `PARITY OK: ${cases.length} recorded cases identical in TypeScript and Python`
    : `${bad} of ${cases.length} differ`,
);
process.exit(bad ? 1 : 0);
