// Run from the project root:  node scripts/check-prima.mjs
// Reads your source files and says, for every file from Day 14 to Day 19, whether it is the right version.
// It changes nothing. It prints OK, MISSING (the file is not there) or OLD (the file is there but is not the new version).
import { existsSync, readFileSync } from "node:fs";

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);

// [file, what it is, [must contain], [must NOT contain], note]
const CHECKS = [
  // Day 14
  ["src/lib/pin.ts", "PIN lock logic", ["createPin"], []],
  ["src/lib/audit.ts", "audit log helper", ["logAudit"], []],
  // Day 15
  ["src/lib/backup.ts", "encrypted backup", ["createBackup"], []],
  ["src/lib/storage.ts", "storage protection", ["requestPersistence"], []],
  [".github/workflows/keepalive.yml", "keep-alive job", ["keepalive"], []],
  // Day 16
  ["vite.config.ts", "PWA setup", ["VitePWA", "__BUILD__"], []],
  ["src/components/UpdatePrompt.tsx", "update prompt", ["useRegisterSW"], []],
  ["src/lib/install.ts", "install button logic", ["beforeinstallprompt"], []],
  ["src/pages/PhoneCheckPage.tsx", "phone check page", ["TapTest"], []],
  ["public/maskable-512.png", "app icon", [], []],
  ["public/_headers", "hosting headers", ["no-cache"], []],
  // Day 17
  ["src/lib/fhir.ts", "FHIR export", ["buildFhir"], []],
  ["src/lib/dhis2.ts", "DHIS2 export", ["buildDataValueSet"], []],
  ["src/lib/icd10Data.ts", "diagnosis list", ["ICD10_DATA"], []],
  ["src/lib/serviceCodes.ts", "service line codes", ["SERVICE_LINES"], []],
  ["src/lib/lgaReport.ts", "monthly report uses prefix matching", ["SERVICE_LINES"], ["const MATERNAL"]],
  // Day 18
  ["src/lib/complaintCheck.ts", "complaint check", ["checkComplaint"], []],
  ["src/data/complaintTerms.json", "complaint word list", ["Fever"], []],
  ["src/lib/cardCode.ts", "QR card code", ["PRIMA:"], []],
  ["src/components/QrScanner.tsx", "QR scanner", ["BarcodeDetector"], []],
  ["src/pages/ScanPage.tsx", "scan page", ["parseCard"], []],
  ["src/pages/PatientCardPage.tsx", "patient card page", ["PatientCard"], []],
  ["src/components/StickyActions.tsx", "sticky save bar", ["useKeyboardInset"], []],
  ["src/components/Stepper.tsx", "vitals stepper", ["nextValue"], []],
  ["src/components/VisitForm.tsx", "visit form uses steppers", ["Stepper", "ComplaintHint", "StickyActions"], [], "edit your existing file (Day 18, step 5)"],
  ["src/index.css", "styles for Day 18 and 19", ["--tabbar-h", ".stepper-btn", 'data-power="low"', "@media print"], [], "add the CSS from Day 18 and Day 19"],
  // Day 19
  ["src/lib/estimateDob.ts", "estimated birth dates", ["estimateDob"], []],
  ["src/lib/quickRegister.ts", "quick register logic", ["validateQuick", "quickToValues"], []],
  ["src/lib/topValues.ts", "village and reason chips", ["topVillages", "toggleTerm"], []],
  ["src/lib/duplicateHint.ts", "duplicate check for quick register", ["findDuplicateHint"], []],
  ["src/lib/completeness.ts", "what a quick register left empty", ["recordGaps"], []],
  ["src/components/QuickRegisterForm.tsx", "quick register form", ["validateQuick", "StickyActions"], []],
  ["src/hooks/useRegisterMode.ts", "quick or full form choice", ["prima_register_mode"], []],
  ["src/pages/RegisterPage.tsx", "register page offers the quick form", ["QuickRegisterForm"], [], "replace with the Day 19 version"],
  ["src/components/CompleteRecordCard.tsx", "finish this record card", ["recordGaps"], []],
  ["src/lib/timing.ts", "registration timing maths", ["summarize"], []],
  ["src/lib/timingStore.ts", "registration timing storage", ["saveTiming"], []],
  ["src/hooks/useRegistrationTiming.ts", "registration timing hook", ["startedAt"], ["useRef(Date.now())"], "the old version calls Date.now() while drawing, which the lint rejects"],
  ["src/components/TimingCard.tsx", "registration speed card", ["summarize"], []],
  ["src/lib/power.ts", "Low Battery Mode", ["nextActive", "initPower"], []],
  ["src/components/PowerCard.tsx", "Low Battery Mode card", ["setPowerMode"], []],
  ["src/components/PowerBanner.tsx", "Low Battery Mode banner", ["usePower"], []],
  ["src/main.tsx", "starts Low Battery Mode", ["initPower"], [], "add: import { initPower } from './lib/power'; initPower();"],
  ["src/types.ts", "patient type has the estimate flag", ["dobEstimated"], [], "add dobEstimated?: boolean to Patient"],
  ["src/lib/schema.ts", "registration schema", ["dobEstimated"], [], "add dobEstimated and the 3-character complaint rule"],
  ["src/lib/patients.ts", "patient save functions", ["dobEstimated"], [], "add dobEstimated to fieldsFrom and valuesFromPatient"],
  // The sync fix
  ["src/lib/syncErrors.ts", "tells failures apart", ["export function classify"], []],
  ["src/lib/syncHealth.ts", "sync state store", ["getSyncHealth", "SCHEMA_TAG", "beginWork", "nextRetryAt", "recordProblem", "setSchemaProblem", "markStalled", "resetWork", "setNextRetry"], [], "replace the whole file"],
  ["src/lib/supabase.ts", "cloud client with a 40 second limit", ["fetchWithTimeout"], [], "replace the whole file"],
  ["src/lib/syncService.ts", "sync engine", ["handleFailure", "classify", "runLimitMs", "dob_estimated", "setRunLimitForTests"], ["isNetworkError"], "replace the whole file"],
  ["src/lib/syncState.ts", "what the badge says", ["describeSync"], []],
  ["src/lib/syncDoctor.ts", "Sync Doctor checks", ["checkCloud", "requeueAll"], []],
  ["src/hooks/useSyncState.ts", "sync state hook", ["useSecond", "describeSync"], ["Date.now();\n}"], "the old version calls Date.now() while drawing"],
  ["src/components/SyncBadge.tsx", "sync badge", ["useSyncState"], ["Syncing {"]],
  ["src/components/StatusBanner.tsx", "status banner", ["useSyncState", "schema"], []],
  ["src/pages/SyncDoctorPage.tsx", "Sync Doctor page", ["checkCloud"], []],
  ["src/App.tsx", "routes", ["sync-doctor", "scan", "patients/:id/card", "phone-check"], [], "add the Sync Doctor route"],
  ["src/components/AppShell.tsx", "app shell shows the banners", ["StatusBanner", "PowerBanner"], [], "render <StatusBanner /> and <PowerBanner /> under <SessionBanner />"],
  ["src/pages/AccountPage.tsx", "account page cards", ["PowerCard"], [], "render <PowerCard />"],
];

let ok = 0, bad = 0;
const rows = [];
for (const [file, what, must, mustNot, note] of CHECKS) {
  const text = read(file);
  let status = "OK", why = "";
  if (text === null) { status = "MISSING"; why = note ?? "create this file"; }
  else {
    const lacking = must.filter((m) => !text.includes(m));
    const present = mustNot.filter((m) => text.includes(m));
    if (lacking.length) { status = "OLD"; why = `does not contain: ${lacking.join(", ")}${note ? ` (${note})` : ""}`; }
    else if (present.length) { status = "OLD"; why = `still contains the old code: ${present.join(", ")}${note ? ` (${note})` : ""}`; }
  }
  if (status === "OK") ok++; else bad++;
  rows.push([status, file, what, why]);
}

// packages
const pkg = read("package.json");
const deps = pkg ? JSON.parse(pkg) : {};
const have = { ...(deps.dependencies ?? {}), ...(deps.devDependencies ?? {}) };
for (const name of ["qrcode", "jsqr", "vite-plugin-pwa", "@types/qrcode"]) {
  const status = have[name] ? "OK" : "MISSING";
  if (status === "OK") ok++; else bad++;
  rows.push([status, `package.json: ${name}`, "package", have[name] ? "" : `run: npm install ${name === "@types/qrcode" ? "-D " : ""}${name}`]);
}

const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
console.log("\nPrima file check\n");
for (const [status, file, what, why] of rows) {
  const mark = status === "OK" ? "OK     " : status === "OLD" ? "OLD    " : "MISSING";
  if (status !== "OK") console.log(`${mark} ${pad(file, 44)} ${what}\n        -> ${why}`);
}
console.log(`\n${ok} correct, ${bad} to fix.${bad === 0 ? " Everything from Day 14 to Day 19 is in place." : ""}`);
console.log("Next: run  npx tsc -b  and  npm run lint  and  npm run build.\n");
process.exit(bad ? 1 : 0);
