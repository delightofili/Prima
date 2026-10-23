// Which ICD-10 codes count toward each monthly service line.
// Prefix match on purpose: Z34.0, Z34.8 and Z34.9 are all antenatal care.
export interface ServiceLine {
  key: "anc" | "pnc" | "childWelfare" | "familyPlanning";
  label: string;
  prefixes: string[];
}

export const SERVICE_LINES: ServiceLine[] = [
  { key: "anc", label: "Antenatal visits", prefixes: ["Z34", "Z35"] },
  { key: "pnc", label: "Postnatal visits", prefixes: ["Z39"] },
  {
    key: "childWelfare",
    label: "Child welfare visits",
    prefixes: ["Z00.1", "Z76.2"],
  },
  { key: "familyPlanning", label: "Family planning visits", prefixes: ["Z30"] },
];

export const inService = (code: string | undefined, line: ServiceLine) =>
  !!code && line.prefixes.some((p) => code.startsWith(p));

export const isAncCode = (code?: string) => inService(code, SERVICE_LINES[0]);
