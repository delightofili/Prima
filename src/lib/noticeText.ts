// The two statements every person accepts at first sign-in (the onboarding wizard).
//
// English only, on purpose, for now: this is the wording a lawyer reviews (docs/gate/NDPA.md, section 4). The translations into Igbo, Hausa
// and Yoruba are made AFTER that review, and checked by native speakers. If the wording changes in any way that matters, raise NOTICE_VERSION:
// everyone is then asked again, and the database keeps the old acceptance as history.

export const NOTICE_VERSION = "1"; // digits only, 1 to 3 of them: the database refuses anything else

export const INTENDED_USE = {
  paragraphs: [
    "Prima is a patient register and visit record for primary health centres. It helps you register patients, record visits, vitals and vaccines, find a patient again, and report counts to the LGA. It works with no internet.",
    "Prima is not a doctor. It does not diagnose, choose a treatment or work out a dose. When it marks a value or a vaccine that is due, that is a reminder to look, not an instruction.",
    "You stay responsible for every care decision. If something on the screen does not match what you see in the patient, trust the patient and check the record.",
  ],
  tick: "I understand that Prima records information, and that I stay responsible for care decisions.",
} as const;

export const CONFIDENTIALITY = {
  points: [
    "Patient information is private. Use it only to care for the patient and to do your work at this facility.",
    "Do not share patient names, phone numbers or records on WhatsApp, in photos or screenshots, or with anyone who does not need them for care.",
    "Keep Prima locked. Use a PIN, never share your sign-in, and lock the phone when you put it down.",
    "If a phone is lost or stolen, or you think someone saw records they should not, tell the facility admin at once.",
    "Patients can ask to see, correct or remove their information. Do not refuse. Tell the facility admin.",
  ],
  tick: "I will keep patient information private, as written above.",
} as const;
