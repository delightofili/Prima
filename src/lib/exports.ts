import { calculateAge } from "./age";
import type { Cell } from "./csv";
import { formatPhone } from "./utils";
import type { Patient } from "../types";

export function patientsToRows(patients: Patient[]): Cell[][] {
  const header = [
    "Card number",
    "Full name",
    "Sex",
    "Date of birth",
    "Age",
    "Phone",
    "Village",
    "LGA",
    "State",
    "Next of kin",
    "Next of kin phone",
    "NHIS number",
    "Blood group",
    "Allergies",
    "Pregnant",
    "Gravida",
    "Para",
    "Registered",
    "Reason for first registration",
  ];

  const rows = patients.map((p) => [
    p.cardNumber,
    p.fullName,
    p.gender === "FEMALE" ? "Female" : "Male",
    p.dob,
    calculateAge(p.dob).label,
    formatPhone(p.phone),
    p.village,
    p.lga,
    p.state,
    p.nextOfKinName,
    formatPhone(p.nextOfKinPhone) ?? p.nextOfKinPhone,
    p.nhisNumber,
    p.bloodGroup,
    p.allergies,
    p.isPregnant ? "Yes" : "No",
    p.gravida,
    p.para,
    new Date(p.createdAt).toLocaleDateString("en-CA"),
    p.initialChiefComplaint,
  ]);

  return [header, ...rows];
}
