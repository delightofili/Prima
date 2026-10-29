// The English baseline: every sentence a nurse sees, in one place. Other languages translate these same keys.
// Keys ending in _one / _other are plural forms: a word that changes with a number ("1 year", "34 years").
// {name} in a sentence is filled in by the program. Leave every {name} exactly as it is in a translation.
export const en = {
  // ----- the language itself
  "lang.heading": "Language",
  "lang.help":
    "Choose the language Prima uses on this phone. Names of conditions, complaints and medicines stay in English so reports are the same everywhere.",
  "lang.draftBadge": "Draft",
  "lang.soonBadge": "Coming soon",
  "lang.draftNote":
    "This translation is a draft. Native speakers are still checking it. If a word looks wrong, please tell us.",
  "lang.loadFailed":
    "Could not load this language. Connect to the internet once, then try again.",
  "lang.someEnglish":
    "Some screens are still in English while the translation is finished.",

  // ----- the Account page
  "account.title": "Account",
  "account.subtitle": "You, your facility and your team.",
  "account.you": "You",
  "account.roleAdmin": "Facility admin",
  "account.roleStaff": "Staff",
  "account.signOut": "Sign out",
  "account.signOutNote":
    "Signing out needs no internet. Records stay on this phone, hidden until someone from this facility signs in.",
  "account.facility": "Facility",
  "account.facilityLine": "{lga}, {state} · code {code}",
  "account.planOnServer": "Plan on the server:",
  "account.planTestingNote":
    "The app's own plan checks still use the testing switch until the plan day.",
  "account.editDetails": "Edit details",
  "account.privacy": "Privacy",
  "account.readNotice": "Read the privacy notice",
  "account.auditLink": "Audit log and data requests",
  "facility.editTitle": "Edit facility",
  "facility.codeNote":
    "The facility code stays the same, because it is printed on cards.",
  "facility.name": "Facility name",
  "facility.lga": "LGA",
  "facility.state": "State",
  "facility.updated": "Facility updated",
  "team.title": "Team",
  "team.askAdmin": "Ask your facility admin to add or remove staff.",
  "team.needInternet": "You need internet to manage the team.",
  "team.loading": "Loading the team…",
  "team.count_one": "{used} of {limit} staff account used on the {plan} plan.",
  "team.count_other":
    "{used} of {limit} staff accounts used on the {plan} plan.",
  "team.you": "(you)",
  "team.admin": "Admin",
  "team.staff": "Staff",
  "team.memberLine": "{email} · {role} · joined {date}",
  "team.removeAria": "Remove {name}",
  "team.createInvite": "Create invite code",
  "team.unusedInvites": "Unused invite codes",
  "team.expires": "expires {date}",
  "team.inviteCancelled": "Invite cancelled",
  "team.removeTitle": "Remove {name}?",
  "team.removeMessage":
    "They lose access to this facility's records. Their phone is locked the next time it goes online. You can invite them again later.",
  "team.remove": "Remove",
  "team.removed": "{name} removed",
  "invite.title": "Invite code",
  "invite.help":
    "Give this code to your colleague. It works once and expires in 7 days.",
  "invite.copy": "Copy",
  "invite.codeCopied": "Code copied",
  "invite.whatsapp": "Share on WhatsApp",

  // ----- the bottom tabs and common buttons
  "nav.home": "Home",
  "nav.register": "Register",
  "nav.patients": "Patients",
  "nav.dashboard": "Dashboard",
  "nav.lock": "Lock",
  "nav.account": "Account",
  "nav.lockPrima": "Lock Prima",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.later": "Later",
  "common.tryAgain": "Try again",
  "common.syncNow": "Sync now",
  "common.open": "Open",

  // ----- ages
  "age.years_one": "{count} year",
  "age.years_other": "{count} years",
  "age.months_one": "{count} month",
  "age.months_other": "{count} months",

  // ----- registering a patient
  "register.title": "Register patient",
  "register.subtitle": "Saved on this device first, then synced when online.",
  "register.useFull": "Need more details? Use the full form",
  "register.useQuick": "Use the quick form",
  "register.limitTitle": "You've reached 200 patients",
  "register.limitText":
    "The Free plan holds 200 patients. Basic removes the limit and adds CSV export and the monthly LGA report. See Plans for prices.",
  "register.fullName": "Full name",
  "register.sex": "Sex",
  "register.female": "Female",
  "register.male": "Male",
  "register.age": "Age",
  "register.howToGiveAge": "How to give the age",
  "register.byAge": "Age",
  "register.byBirthDate": "Birth date",
  "register.agePlaceholder": "e.g. 34",
  "register.years": "Years",
  "register.months": "Months",
  "register.yearsOrMonths": "Years or months",
  "register.dateOfBirth": "Date of birth",
  "register.estimateNote":
    "Saved as an estimate. The profile will ask for the real date later.",
  "register.ageIs": "Age {age}.",
  "register.village": "Village or area",
  "register.villagesRecent": "Villages used recently",
  "register.pregnantNow": "Pregnant now",
  "register.reason": "Reason for visit",
  "register.commonReasons": "Common reasons",
  "register.orTypeIt": "Or type it",
  "register.registrationOnly": "Registration only (no visit now)",
  "register.phoneOptional": "Phone (optional)",
  "register.guardianOptional": "Parent or guardian (optional)",
  "register.noticeTitle": "Privacy notice explained",
  "register.noticeHelp":
    "Tell the patient how their information is used. You can record this later from the profile.",
  "register.duplicateExact": "This patient may already be registered.",
  "register.duplicateSimilar": "A similar patient is already registered.",
  "register.differentPerson": "This is a different person",
  "register.planFull": "The Free plan is full. See Plans to add more patients.",
  "register.saveFailed":
    "Could not save this patient. Please check the details and try again.",
  "register.saving": "Saving…",
  "register.submit": "Register",
  "register.submitAndVisit": "Register and add visit",
  "register.unsaved": "Unsaved changes",

  // ----- the messages under a box that is not filled in right
  "err.nameRequired": "Enter the patient's name",
  "err.nameShort": "Name is too short",
  "err.nameLong": "Name is too long",
  "err.sexRequired": "Select female or male",
  "err.ageNumber": "Enter the age as a number",
  "err.ageUseMonths": "For a baby under 1 year, choose months",
  "err.ageTooOld": "Age cannot be more than 120 years",
  "err.ageUseYears": "Over 59 months, choose years",
  "err.dobRequired": "Enter the date of birth",
  "err.dobFuture": "Date of birth cannot be in the future",
  "err.dobCheck": "Check the date of birth",
  "err.villageRequired": "Enter the village or area",
  "err.villageLong": "Village name is too long",
  "err.phoneInvalid": "Enter a valid Nigerian number, e.g. 08031234567",
  "err.reasonRequired": "Say why the patient came, or tick Registration only",
  "err.reasonLong": "Keep it under 200 characters",

  // ----- the hint under the complaint box
  "complaint.warnPhone":
    "This looks like a phone number. Keep contact details and names out of the complaint. They have their own boxes.",
  "complaint.warnEmail":
    "This looks like an email address. Keep contact details and names out of the complaint. They have their own boxes.",
  "complaint.recognised": "Recognised: {terms}",
  "complaint.didYouMean": "Did you mean:",
  "complaint.vague":
    "Say what the patient feels, for example fever, cough or stomach pain.",
  "complaint.unknown":
    "Prima does not recognise this complaint. You can still save it.",

  // ----- after a patient is registered
  "saved.title": "Patient registered",
  "saved.about": "about {age}",
  "saved.firstReason": "Reason for first registration:",
  "saved.recordVisit": "Record the visit",
  "saved.viewProfile": "View profile",
  "saved.printCard": "Print card",
  "saved.another": "Register another patient",

  // ----- what a quick registration left for later
  "record.finishTitle": "Finish this record",
  "record.addDetails": "Add these details",
  "record.nextOfKin": "Next of kin",
  "record.nextOfKinHelp": "Someone to call if the patient cannot be reached.",
  "record.birthDate": "Birth date is an estimate",
  "record.birthDateHelp": "Enter the real date when someone knows it.",
  "record.guardian": "Parent or guardian",
  "record.guardianHelp": "Needed for reminders and for the family record.",

  // ----- the sync badge, its panel and the banners
  "sync.offline": "Offline",
  "sync.offlineSaved": "Offline · {count} saved",
  "sync.offlineDetail":
    "There is no internet. Everything you record is saved on this phone and uploads by itself when the connection is back.",
  "sync.signin": "Sign in to sync",
  "sync.signinDetail":
    "Prima is not signed in to the cloud on this phone, so nothing uploads. Records are safe on this phone.",
  "sync.schema": "Database update needed",
  "sync.schemaDetail":
    "The cloud database is missing something this version of Prima needs, so some records cannot upload. They are safe on this phone. Your admin should run the latest SQL, then tap Retry.",
  "sync.working": "Syncing…",
  "sync.workingDetail": "Uploading and downloading now.",
  "sync.paused": "Paused · {count} waiting",
  "sync.pausedDetail":
    "Low Battery Mode has paused syncing. Tap Sync now, plug in, or switch it off.",
  "sync.attention_one": "{count} needs attention",
  "sync.attention_other": "{count} need attention",
  "sync.attentionDetail_one":
    "{count} record could not be uploaded after several tries. It is safe on this phone. Open Sync details.",
  "sync.attentionDetail_other":
    "{count} records could not be uploaded after several tries. They are safe on this phone. Open Sync details.",
  "sync.upgrade": "{count} waiting for upgrade",
  "sync.upgradeDetail_one":
    "{count} patient is saved on this phone but not uploaded, because the Free plan is full.",
  "sync.upgradeDetail_other":
    "{count} patients are saved on this phone but not uploaded, because the Free plan is full.",
  "sync.cloudDown": "Cloud not reachable · {count} waiting",
  "sync.cloudDownDetail":
    "Prima cannot reach the cloud right now. Everything is saved on this phone and uploads by itself when it can.",
  "sync.retrying": "Retrying in {seconds} s · {count} waiting",
  "sync.retryingDetail":
    "A record could not upload and will be tried again shortly.",
  "sync.waiting": "{count} waiting to upload",
  "sync.waitingDetail": "These will upload in the next few seconds.",
  "sync.synced": "Synced",
  "sync.syncedDetail": "Everything on this phone is in the cloud.",
  "sync.badgeAria": "Sync status: {label}. Tap for details.",
  "sync.panelTitle": "Sync details",
  "sync.panelCounts":
    "{waiting} waiting to upload, {failed} that need attention. Everything stays safe on this phone.",
  "sync.itemWaiting": "{table} · waiting",
  "sync.itemFailed": "{table} · needs attention",
  "sync.tries_one": "{count} try",
  "sync.tries_other": "{count} tries",
  "sync.retryFailed": "Retry the ones that need attention",
  "sync.openDoctor": "Open Sync Doctor (for admins)",
  "sync.openDoctorShort": "Open Sync Doctor",
  "sync.table.patients": "patients",
  "sync.table.visits": "visits",
  "sync.table.immunizations": "vaccines",
  "sync.table.guardians": "guardians",
  "sync.table.reminders": "reminders",
  "sync.table.audit": "activity log",
  "syncErr.limit":
    "Waiting for a plan upgrade. The record is safe on this phone.",
  "syncErr.schema":
    "The cloud database needs an update before this can upload. Tell your admin. The record is safe on this phone.",
  "syncErr.bug":
    "Prima hit a problem with this record. It is safe on this phone. Tell support.",
  "syncErr.permission":
    "The cloud did not allow this record. It is safe on this phone. Tell your admin.",
  "syncErr.network": "No connection to the cloud. It will upload by itself.",
  "syncErr.auth": "Sign in again to keep syncing.",
  "syncErr.foreignKey": "Waiting for a related record to upload first.",
  "syncErr.other":
    "The cloud did not accept this record yet. It stays safe on this phone. Tap Retry now.",
  "banner.seePlans": "See plans",
  "banner.nothingLost": "Nothing is lost.",
  "banner.askAdmin": "Ask your facility admin to upgrade.",

  // ----- Low Battery Mode
  "power.title": "Low Battery Mode",
  "power.bannerOn":
    "Low Battery Mode is on. Everything is saved on this phone.",
  "power.waiting_one":
    "{count} record is waiting to upload. Syncing is paused.",
  "power.waiting_other":
    "{count} records are waiting to upload. Syncing is paused.",
  "power.waitingNone": "Nothing is waiting to upload. Syncing is paused.",
  "power.turnOff": "Turn off",
  "power.explain":
    "When it is on, Prima stops syncing in the background, uses dark colours and no animations. Everything you register is still saved on this phone at once. Syncing waits until you tap Sync now, plug in, or switch it off.",
  "power.auto": "Automatic",
  "power.autoHelp":
    "Turns on at 20% battery and off again at 30%, or when charging",
  "power.on": "Always on",
  "power.onHelp":
    "Use this when you will not be able to charge for a long time",
  "power.off": "Off",
  "power.offHelp": "Never switch it on by itself",
  "power.batteryNow": "Battery now: {percent}%.",
  "power.batteryNowCharging": "Battery now: {percent}%, charging.",
  "power.isOn": "Low Battery Mode is on.",
  "power.isOff": "Low Battery Mode is off.",
  "power.unsupported":
    "This phone's browser does not report the battery, so Automatic cannot switch it on. Use Always on when the battery is low.",
  "power.oledNote":
    "Dark colours save a little power only on phones with an OLED screen. The biggest saving is your phone's own brightness: turn it down.",

  // ----- getting a new version of the app
  "update.ready": "A new version of Prima is ready.",
  "update.help":
    "Finish anything you are saving first. Your records stay on this phone.",
  "update.now": "Update now",
  "update.offlineReady": "Prima is ready to work without internet.",
} as const;

export type Key = keyof typeof en;

// "sync.attention" is a PluralBase because both sync.attention_one and sync.attention_other exist
export type PluralBase = {
  [K in Key]: K extends `${infer B}_other` ? B : never;
}[Key];
