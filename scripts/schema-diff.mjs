// Compares the two fingerprints made by supabase/inventory.sql.
//   node scripts/schema-diff.mjs staging.csv production.csv
// It only reads. It prints what is missing from production, what only production has, and what is different.
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { pathToFileURL } from "node:url";

// A small CSV reader: quoted values, commas and doubled quotes inside them, Windows or Unix line ends
export function parseCsv(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  const t = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (quoted) {
      if (ch === '"' && t[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

// {kind, name} -> fingerprint, or an explanation of what is wrong with the file
export function load(text, label) {
  const rows = parseCsv(text);
  if (rows.length === 0)
    return {
      error: `${label} is empty. Did the query run, and did you press Download CSV?`,
    };
  const head = rows[0].map((c) => c.trim().toLowerCase());
  const [ki, ni, fi] = ["kind", "name", "fingerprint"].map((c) =>
    head.indexOf(c),
  );
  if (ki < 0 || ni < 0 || fi < 0)
    return {
      error: `${label} does not have the columns kind, name and fingerprint. It must be the result of supabase/inventory.sql.`,
    };
  const map = new Map();
  for (const r of rows.slice(1)) map.set(`${r[ki]}\u0000${r[ni]}`, r[fi]);
  if (map.size === 0) return { error: `${label} has a header but no rows.` };
  return { map };
}

export function compare(a, b) {
  const only = (x, y) => [...x.keys()].filter((k) => !y.has(k)).sort();
  return {
    missingFromB: only(a, b),
    onlyInB: only(b, a),
    different: [...a.keys()]
      .filter((k) => b.has(k) && a.get(k) !== b.get(k))
      .sort(),
  };
}

const show = (k) => {
  const [kind, name] = k.split("\u0000");
  return `  ${kind.padEnd(15)} ${name}`;
};

export function main(argv = process.argv.slice(2), log = console.log) {
  if (argv.length !== 2) {
    log("Use:  node scripts/schema-diff.mjs staging.csv production.csv");
    return 2;
  }
  const [fa, fb] = argv;
  for (const f of argv)
    if (!existsSync(f)) {
      log(`There is no file called ${f}.`);
      return 2;
    }
  const A = load(readFileSync(fa, "utf8"), basename(fa));
  const B = load(readFileSync(fb, "utf8"), basename(fb));
  for (const x of [A, B])
    if (x.error) {
      log(x.error);
      return 2;
    }
  const d = compare(A.map, B.map);
  const nameA = basename(fa),
    nameB = basename(fb);
  log(
    `\nCompared ${nameA} (${A.map.size} objects) with ${nameB} (${B.map.size} objects)\n`,
  );
  if (d.missingFromB.length) {
    log(`ONLY IN ${nameA} (missing from ${nameB}):`);
    d.missingFromB.forEach((k) => log(show(k)));
    log("");
  }
  if (d.onlyInB.length) {
    log(`ONLY IN ${nameB}:`);
    d.onlyInB.forEach((k) => log(show(k)));
    log("");
  }
  if (d.different.length) {
    log(
      "IN BOTH, BUT DIFFERENT (the code, the columns, a policy, or who is allowed to do what):",
    );
    d.different.forEach((k) => log(show(k)));
    log("");
  }
  const same =
    !d.missingFromB.length && !d.onlyInB.length && !d.different.length;
  log(
    same
      ? "IDENTICAL: every table, view, function, policy, trigger, index and permission matches.\n"
      : `${d.missingFromB.length + d.onlyInB.length + d.different.length} difference(s). Fix them, run inventory.sql on the one you changed, and compare again.\n`,
  );
  return same ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exit(main());
