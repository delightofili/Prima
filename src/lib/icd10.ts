import { normalize } from "./utils";

export interface Icd10 {
  code: string;
  label: string;
  aka?: string;
}

export const ICD10: Icd10[] = [
  { code: "B54", label: "Malaria, unspecified", aka: "malaria fever chills" },
  {
    code: "B50.9",
    label: "Plasmodium falciparum malaria, unspecified",
    aka: "malaria falciparum",
  },
  { code: "R50.9", label: "Fever, unspecified", aka: "high temperature" },
  {
    code: "J06.9",
    label: "Acute upper respiratory infection, unspecified",
    aka: "cold catarrh cough",
  },
  {
    code: "J03.9",
    label: "Acute tonsillitis, unspecified",
    aka: "sore throat",
  },
  { code: "J20.9", label: "Acute bronchitis, unspecified", aka: "chest cough" },
  {
    code: "J18.9",
    label: "Pneumonia, unspecified organism",
    aka: "chest infection",
  },
  { code: "J45.9", label: "Asthma, unspecified", aka: "wheeze breathless" },
  {
    code: "A09",
    label: "Diarrhoea and gastroenteritis, presumed infectious",
    aka: "loose stool stooling",
  },
  { code: "E86", label: "Volume depletion", aka: "dehydration" },
  { code: "A01.0", label: "Typhoid fever", aka: "typhoid" },
  { code: "B82.9", label: "Intestinal parasitism, unspecified", aka: "worms" },
  { code: "K29.7", label: "Gastritis, unspecified", aka: "ulcer stomach pain" },
  { code: "K30", label: "Dyspepsia", aka: "indigestion heartburn" },
  { code: "K59.0", label: "Constipation", aka: "hard stool" },
  {
    code: "R10.4",
    label: "Other and unspecified abdominal pain",
    aka: "stomach ache belly pain",
  },
  { code: "R11", label: "Nausea and vomiting", aka: "vomiting" },
  {
    code: "N39.0",
    label: "Urinary tract infection, site not specified",
    aka: "uti painful urine",
  },
  { code: "N76.0", label: "Acute vaginitis", aka: "vaginal discharge" },
  {
    code: "I10",
    label: "Essential (primary) hypertension",
    aka: "high blood pressure bp",
  },
  {
    code: "E11.9",
    label: "Type 2 diabetes mellitus without complications",
    aka: "diabetes sugar",
  },
  { code: "D64.9", label: "Anaemia, unspecified", aka: "anemia low blood" },
  {
    code: "E46",
    label: "Unspecified protein-energy malnutrition",
    aka: "malnutrition underweight",
  },
  {
    code: "E43",
    label: "Unspecified severe protein-energy malnutrition",
    aka: "severe malnutrition kwashiorkor marasmus",
  },
  { code: "H10.9", label: "Conjunctivitis, unspecified", aka: "red eye" },
  {
    code: "H66.9",
    label: "Otitis media, unspecified",
    aka: "ear infection ear pain",
  },
  {
    code: "L08.9",
    label: "Local infection of skin and subcutaneous tissue, unspecified",
    aka: "boil abscess wound infection",
  },
  {
    code: "L30.9",
    label: "Dermatitis, unspecified",
    aka: "rash eczema itching",
  },
  {
    code: "B35.9",
    label: "Dermatophytosis, unspecified",
    aka: "ringworm fungal",
  },
  { code: "B86", label: "Scabies", aka: "itch" },
  { code: "B37.9", label: "Candidiasis, unspecified", aka: "thrush yeast" },
  { code: "M54.5", label: "Low back pain", aka: "waist pain" },
  { code: "M25.5", label: "Pain in joint", aka: "joint pain arthritis" },
  { code: "R51", label: "Headache", aka: "head pain" },
  { code: "R05", label: "Cough" },
  { code: "R42", label: "Dizziness and giddiness", aka: "dizzy" },
  { code: "R53", label: "Malaise and fatigue", aka: "weakness tired" },
  {
    code: "K02.9",
    label: "Dental caries, unspecified",
    aka: "tooth toothache",
  },
  { code: "B05.9", label: "Measles without complication", aka: "measles" },
  { code: "B01.9", label: "Varicella without complication", aka: "chickenpox" },
  {
    code: "Z34.9",
    label: "Supervision of normal pregnancy, unspecified",
    aka: "antenatal anc pregnancy",
  },
  {
    code: "Z39.2",
    label: "Routine postpartum follow-up",
    aka: "postnatal after delivery",
  },
  {
    code: "Z00.1",
    label: "Routine child health examination",
    aka: "child welfare growth monitoring",
  },
  {
    code: "Z30.9",
    label: "Contraceptive management, unspecified",
    aka: "family planning",
  },
  { code: "T14.9", label: "Injury, unspecified", aka: "wound cut trauma" },
];

const INDEX = ICD10.map((d) => ({
  d,
  text: normalize(`${d.label} ${d.aka ?? ""}`),
  label: normalize(d.label),
  code: d.code.toLowerCase(),
}));

export function searchDiagnoses(query: string, limit = 6): Icd10[] {
  const t = normalize(query);
  if (t.length < 2) return [];
  const starts: Icd10[] = [];
  const contains: Icd10[] = [];
  for (const row of INDEX) {
    if (row.label.startsWith(t) || row.code.startsWith(t)) starts.push(row.d);
    else if (row.text.includes(t)) contains.push(row.d);
  }
  return [...starts, ...contains].slice(0, limit);
}
