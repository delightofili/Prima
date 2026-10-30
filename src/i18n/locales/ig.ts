// Igbo (Asụsụ Igbo). STATUS: DRAFT. Written as a first version for a native speaker to check and correct.
// Rules for whoever edits this file:
//   1. Keep every {name} exactly as it is. The program fills it in (a number, a name, a time).
//   2. Igbo has no plural form, so only the "_other" lines are needed. Do not add "_one" lines.
//   3. Clinical names (conditions, complaints, medicines) stay in English on purpose. Do not translate them here.
//   4. Use the letters ị ọ ụ ṅ. Save the file as UTF-8.
//   5. If a line is missing, Prima shows the English one. A missing line is safer than a wrong one.
import type { Key } from "./en";

export const dict: Partial<Record<Key, string>> = {
  // ----- the language itself
  "lang.heading": "Asụsụ",
  "lang.help":
    "Họrọ asụsụ Prima ga-eji n'ekwentị a. Aha ọrịa, nsogbu na ọgwụ ga-anọgide n'asụsụ Bekee ka akụkọ niile ghara ịdị iche n'ebe ọ bụla.",
  "lang.draftBadge": "Ụdị mbụ",
  "lang.soonBadge": "Na-abịa",
  "lang.draftNote":
    "Nsụgharị a bụ ụdị mbụ. Ndị na-asụ Igbo ka na-enyocha ya. Ọ bụrụ na okwu ọ bụla dị ka nke na-ezighị ezi, biko gwa anyị.",
  "lang.loadFailed":
    "Enweghị ike inweta asụsụ a. Jikọọ na ịntanetị otu ugboro, wee nwaa ọzọ.",
  "lang.someEnglish":
    "Ụfọdụ ihuenyo ka dị n'asụsụ Bekee ruo mgbe a ga-emechaa nsụgharị ahụ.",

  // ----- the Account page
  "account.title": "Akaụntụ",
  "account.subtitle": "Gị, ụlọ ọgwụ gị na ndị otu gị.",
  "account.you": "Gị",
  "account.roleAdmin": "Onye nchịkwa ụlọ ọgwụ",
  "account.roleStaff": "Onye ọrụ",
  "account.signOut": "Pụọ",
  "account.signOutNote":
    "Ịpụ anaghị achọ ịntanetị. Ndekọ na-anọgide n'ekwentị a, ebe e zoro ha, ruo mgbe onye si n'ụlọ ọgwụ a banyere.",
  "account.facility": "Ụlọ ọgwụ",
  "account.facilityLine": "{lga}, {state} · koodu {code}",
  "account.planOnServer": "Atụmatụ dị na sava:",
  "account.planTestingNote":
    "Nyocha atụmatụ nke ngwa ahụ ka na-eji mgbanwe nnwale ruo ụbọchị atụmatụ ahụ.",
  "account.editDetails": "Gbanwee nkọwa",
  "account.privacy": "Nzuzo",
  "account.readNotice": "Gụọ ọkwa nzuzo",
  "account.auditLink": "Ndekọ ihe emere na arịrịọ data",
  "facility.editTitle": "Gbanwee ụlọ ọgwụ",
  "facility.codeNote":
    "Koodu ụlọ ọgwụ ga-anọgide otu a, n'ihi na e biputara ya na kaadị.",
  "facility.name": "Aha ụlọ ọgwụ",
  "facility.lga": "LGA",
  "facility.state": "Steeti",
  "facility.updated": "E melitela ụlọ ọgwụ",
  "team.title": "Ndị otu",
  "team.askAdmin":
    "Gwa onye nchịkwa ụlọ ọgwụ gị ka o tinye ma ọ bụ wepụ ndị ọrụ.",
  "team.needInternet": "Ị chọrọ ịntanetị iji chịkwaa ndị otu.",
  "team.loading": "Na-ebudata ndị otu…",
  "team.count_other":
    "A na-eji akaụntụ ndị ọrụ {used} n'ime {limit} n'atụmatụ {plan}.",
  "team.you": "(gị)",
  "team.admin": "Onye nchịkwa",
  "team.staff": "Onye ọrụ",
  "team.memberLine": "{email} · {role} · sonyere {date}",
  "team.removeAria": "Wepụ {name}",
  "team.createInvite": "Mepụta koodu oku",
  "team.unusedInvites": "Koodu oku ndị a na-ejibeghị",
  "team.expires": "ga-agwụ {date}",
  "team.inviteCancelled": "E kagburu oku ahụ",
  "team.removeTitle": "Wepụ {name}?",
  "team.removeMessage":
    "Ha ga-atụfu ohere ịbanye n'ndekọ ụlọ ọgwụ a. A ga-akpọchi ekwentị ha mgbe ọ banyere n'ịntanetị ọzọ. Ị nwere ike ịkpọ ha ọzọ n'oge ọzọ.",
  "team.remove": "Wepụ",
  "team.removed": "E wepụrụ {name}",
  "invite.title": "Koodu oku",
  "invite.help":
    "Nye onye ọrụ ibe gị koodu a. Ọ na-arụ ọrụ otu ugboro ma na-agwụ n'ụbọchị 7.",
  "invite.copy": "Detuo",
  "invite.codeCopied": "E detuola koodu ahụ",
  "invite.whatsapp": "Kekọrịta na WhatsApp",

  // ----- the bottom tabs and common buttons
  "nav.home": "Ụlọ",
  "nav.register": "Debanye aha",
  "nav.patients": "Ndị ọrịa",
  "nav.dashboard": "Nchịkọta",
  "nav.lock": "Kpọchie",
  "nav.account": "Akaụntụ",
  "nav.lockPrima": "Kpọchie Prima",
  "common.cancel": "Kagbuo",
  "common.save": "Chekwaa",
  "common.later": "Mgbe ọzọ",
  "common.tryAgain": "Nwaa ọzọ",
  "common.syncNow": "Bulite ugbu a",
  "common.open": "Meghee",

  // ----- ages
  "age.years_other": "afọ {count}",
  "age.months_other": "ọnwa {count}",

  // ----- registering a patient
  "register.title": "Debanye onye ọrịa aha",
  "register.subtitle":
    "A na-echekwa ya n'ekwentị a mbụ, wee bulite mgbe ịntanetị dị.",
  "register.useFull": "Ị chọrọ ozi ndị ọzọ? Jiri fọọmụ zuru ezu",
  "register.useQuick": "Jiri fọọmụ ngwa ngwa",
  "register.limitTitle": "Ị rutela ndị ọrịa 200",
  "register.limitText":
    "Atụmatụ efu na-ejide ndị ọrịa 200. Basic na-ewepụ oke ahụ wee tinye mbupụ CSV na akụkọ LGA kwa ọnwa. Lee Plans maka ọnụahịa.",
  "register.fullName": "Aha zuru ezu",
  "register.sex": "Nwoke ma ọ bụ nwanyị",
  "register.female": "Nwanyị",
  "register.male": "Nwoke",
  "register.age": "Afọ",
  "register.howToGiveAge": "Otu esi enye afọ",
  "register.byAge": "Afọ",
  "register.byBirthDate": "Ụbọchị amụrụ",
  "register.agePlaceholder": "dịka 34",
  "register.years": "Afọ",
  "register.months": "Ọnwa",
  "register.yearsOrMonths": "Afọ ma ọ bụ ọnwa",
  "register.dateOfBirth": "Ụbọchị amụrụ",
  "register.estimateNote":
    "A ga-echekwa ya dị ka atụmatụ. Ndekọ onye ọrịa ga-ajụ ụbọchị n'ezie mgbe e mesịrị.",
  "register.ageIs": "Ọ dị {age}.",
  "register.village": "Obodo ma ọ bụ mpaghara",
  "register.villagesRecent": "Obodo ejirila n'oge na-adịbeghị anya",
  "register.pregnantNow": "Ọ dị ime ugbu a",
  "register.reason": "Ihe kpatara ọbịbịa",
  "register.commonReasons": "Ihe kpatara ọbịbịa a na-ahụkarị",
  "register.orTypeIt": "Ma ọ bụ dee ya",
  "register.registrationOnly": "Ndebanye aha naanị (enweghị nleta ugbu a)",
  "register.phoneOptional": "Ekwentị (nhọrọ)",
  "register.guardianOptional": "Nne, nna ma ọ bụ onye na-elekọta (nhọrọ)",
  "register.noticeTitle": "E kọwara ọkwa nzuzo",
  "register.noticeHelp":
    "Gwa onye ọrịa otú a ga-esi jiri ozi ya. Ị nwere ike dekọọ nke a mgbe e mesịrị site na ndekọ onye ọrịa.",
  "register.duplicateExact":
    "Onye ọrịa a nwere ike ịbụ onye e debanyelarị aha ya.",
  "register.duplicateSimilar": "E debanyelarị onye ọrịa yiri nke a.",
  "register.differentPerson": "Nke a bụ onye ọzọ",
  "register.planFull": "Atụmatụ efu juru. Lee Plans iji tinye ndị ọrịa ọzọ.",
  "register.saveFailed":
    "Enweghị ike ichekwa onye ọrịa a. Biko lelee ozi ndị ahụ wee nwaa ọzọ.",
  "register.saving": "Na-echekwa…",
  "register.submit": "Debanye aha",
  "register.submitAndVisit": "Debanye aha ma tinye nleta",
  "register.unsaved": "Mgbanwe ndị a echekwabeghị",

  // ----- the messages under a box that is not filled in right
  "err.nameRequired": "Tinye aha onye ọrịa",
  "err.nameShort": "Aha dị mkpụmkpụ nke ukwuu",
  "err.nameLong": "Aha dị ogologo nke ukwuu",
  "err.sexRequired": "Họrọ nwanyị ma ọ bụ nwoke",
  "err.ageNumber": "Tinye afọ dị ka nọmba",
  "err.ageUseMonths": "Maka nwa na-erubeghị otu afọ, họrọ ọnwa",
  "err.ageTooOld": "Afọ enweghị ike ịkarị afọ 120",
  "err.ageUseYears": "Karịa ọnwa 59, họrọ afọ",
  "err.dobRequired": "Tinye ụbọchị amụrụ",
  "err.dobFuture": "Ụbọchị amụrụ enweghị ike ịbụ n'ọdịnihu",
  "err.dobCheck": "Lelee ụbọchị amụrụ",
  "err.villageRequired": "Tinye obodo ma ọ bụ mpaghara",
  "err.villageLong": "Aha obodo dị ogologo nke ukwuu",
  "err.phoneInvalid": "Tinye nọmba ekwentị Naịjirịa ziri ezi, dịka 08031234567",
  "err.reasonRequired":
    "Kọwaa ihe kpatara onye ọrịa ji bịa, ma ọ bụ họrọ Ndebanye aha naanị",
  "err.reasonLong": "Debe ya n'okpuru mkpụrụedemede 200",

  // ----- the hint under the complaint box
  "complaint.warnPhone":
    "Nke a dị ka nọmba ekwentị. Etinyela ozi ịkpọtụrụ onye na aha n'ime ihe kpatara ọbịbịa. Ha nwere igbe nke ha.",
  "complaint.warnEmail":
    "Nke a dị ka adreesị email. Etinyela ozi ịkpọtụrụ onye na aha n'ime ihe kpatara ọbịbịa. Ha nwere igbe nke ha.",
  "complaint.recognised": "Amatara: {terms}",
  "complaint.didYouMean": "Ị chọrọ ịsị:",
  "complaint.vague":
    "Kwuo ihe onye ọrịa na-enwe, dịka ahụ ọkụ, ụkwara ma ọ bụ afọ ọwụwa.",
  "complaint.unknown": "Prima amataghị nsogbu a. Ị ka nwere ike ichekwa ya.",

  // ----- after a patient is registered
  "saved.title": "E debanyela onye ọrịa",
  "saved.about": "ihe dị ka {age}",
  "saved.firstReason": "Ihe kpatara ndebanye aha mbụ:",
  "saved.recordVisit": "Dekọọ nleta",
  "saved.viewProfile": "Lee ndekọ onye ọrịa",
  "saved.printCard": "Bipụta kaadị",
  "saved.another": "Debanye onye ọrịa ọzọ",

  // ----- what a quick registration left for later
  "record.finishTitle": "Mezue ndekọ a",
  "record.addDetails": "Tinye ozi ndị a",
  "record.nextOfKin": "Onye ikwu kacha nso",
  "record.nextOfKinHelp":
    "Onye a ga-akpọ ma ọ bụrụ na enweghị ike ịchọta onye ọrịa.",
  "record.birthDate": "Ụbọchị amụrụ bụ atụmatụ",
  "record.birthDateHelp": "Tinye ụbọchị n'ezie mgbe mmadụ matara ya.",
  "record.guardian": "Nne, nna ma ọ bụ onye na-elekọta",
  "record.guardianHelp": "A chọrọ ya maka ncheta na ndekọ ezinụlọ.",

  // ----- the sync badge, its panel and the banners
  "sync.offline": "Enweghị ịntanetị",
  "sync.offlineSaved": "Enweghị ịntanetị · {count} echekwara",
  "sync.offlineDetail":
    "Enweghị ịntanetị. Ihe niile ị dekọrọ na-echekwa n'ekwentị a, ọ ga-ebulitekwa n'onwe ya mgbe ịntanetị lọghachiri.",
  "sync.signin": "Banye iji bulite",
  "sync.signinDetail":
    "Prima abanyeghị n'igwe ojii n'ekwentị a, ya mere ọ dịghị ihe na-ebulite. Ndekọ ndị a dị nchebe n'ekwentị a.",
  "sync.schema": "Achọrọ mmelite nchekwa data",
  "sync.schemaDetail":
    "Nchekwa data dị n'igwe ojii enweghị ihe ụdị Prima a chọrọ, ya mere ụfọdụ ndekọ enweghị ike ibulite. Ha dị nchebe n'ekwentị a. Onye nchịkwa gị kwesịrị ịgba SQL kacha ọhụrụ, ma pịa Nwaa ọzọ.",
  "sync.working": "Na-ebulite…",
  "sync.workingDetail": "Na-ebulite ma na-ebudata ugbu a.",
  "sync.paused": "Akwụsịtụrụ · {count} na-eche",
  "sync.pausedDetail":
    "Ọnọdụ batrị dị ala akwụsịtụla mbulite. Pịa Bulite ugbu a, tinye ekwentị n'ọkụ, ma ọ bụ gbanyụọ ya.",
  "sync.attention_other": "{count} chọrọ nlekọta",
  "sync.attentionDetail_other":
    "Enweghị ike ibulite ndekọ {count} mgbe a nwara ọtụtụ ugboro. Ha dị nchebe n'ekwentị a. Meghee nkọwa mbulite.",
  "sync.upgrade": "{count} na-eche mmelite atụmatụ",
  "sync.upgradeDetail_other":
    "Echekwara ndị ọrịa {count} n'ekwentị a mana ebughị ha, n'ihi na atụmatụ efu juru.",
  "sync.cloudDown": "Enweghị ike iru igwe ojii · {count} na-eche",
  "sync.cloudDownDetail":
    "Prima enweghị ike iru igwe ojii ugbu a. Ihe niile echekwara n'ekwentị a, ọ ga-ebulitekwa n'onwe ya mgbe o nwere ike.",
  "sync.retrying": "Na-anwa ọzọ n'ime sekọnd {seconds} · {count} na-eche",
  "sync.retryingDetail":
    "Ndekọ nke na-ebulitebeghị ga-anwa ọzọ n'oge na-adịghị anya.",
  "sync.waiting": "{count} na-eche ibulite",
  "sync.waitingDetail": "Ndị a ga-ebulite n'ime sekọnd ole na ole.",
  "sync.synced": "E bulitela",
  "sync.syncedDetail": "Ihe niile dị n'ekwentị a dị n'igwe ojii.",
  "sync.badgeAria": "Ọnọdụ mbulite: {label}. Pịa maka nkọwa.",
  "sync.panelTitle": "Nkọwa mbulite",
  "sync.panelCounts":
    "{waiting} na-eche ibulite, {failed} chọrọ nlekọta. Ihe niile na-anọgide n'ekwentị a n'ụzọ dị nchebe.",
  "sync.itemWaiting": "{table} · na-eche",
  "sync.itemFailed": "{table} · chọrọ nlekọta",
  "sync.tries_other": "mbọ {count}",
  "sync.retryFailed": "Nwaa ọzọ maka ndị chọrọ nlekọta",
  "sync.openDoctor": "Meghee Sync Doctor (maka ndị nchịkwa)",
  "sync.openDoctorShort": "Meghee Sync Doctor",
  "sync.table.patients": "ndị ọrịa",
  "sync.table.visits": "nleta",
  "sync.table.immunizations": "ọgwụ mgbochi",
  "sync.table.guardians": "ndị na-elekọta",
  "sync.table.reminders": "ncheta",
  "sync.table.audit": "ndekọ ihe emere",
  "syncErr.limit": "Na-eche mmelite atụmatụ. Ndekọ a dị nchebe n'ekwentị a.",
  "syncErr.schema":
    "Nchekwa data dị n'igwe ojii chọrọ mmelite tupu o bulite nke a. Gwa onye nchịkwa gị. Ndekọ a dị nchebe n'ekwentị a.",
  "syncErr.bug":
    "Prima nwere nsogbu na ndekọ a. O dị nchebe n'ekwentị a. Gwa ndị enyemaka.",
  "syncErr.permission":
    "Igwe ojii ekwenyeghị ndekọ a. O dị nchebe n'ekwentị a. Gwa onye nchịkwa gị.",
  "syncErr.network": "Enweghị njikọ na igwe ojii. Ọ ga-ebulitekwa n'onwe ya.",
  "syncErr.auth": "Banye ọzọ iji nọgide na-ebulite.",
  "syncErr.foreignKey": "Na-eche ka ndekọ jikọtara ya bulite buru ụzọ.",
  "syncErr.other":
    "Igwe ojii anabataghị ndekọ a ugbu a. O ka dị nchebe n'ekwentị a. Pịa Nwaa ọzọ.",
  "banner.seePlans": "Lee atụmatụ",
  "banner.nothingLost": "Ọ dịghị ihe furu efu.",
  "banner.askAdmin": "Gwa onye nchịkwa ụlọ ọgwụ gị ka o melite.",

  // ----- Low Battery Mode
  "power.title": "Ọnọdụ batrị dị ala",
  "power.bannerOn":
    "Ọnọdụ batrị dị ala na-arụ ọrụ. Ihe niile echekwara n'ekwentị a.",
  "power.waiting_other": "Ndekọ {count} na-eche ibulite. Mbulite akwụsịtụrụ.",
  "power.waitingNone": "Ọ dịghị ihe na-eche ibulite. Mbulite akwụsịtụrụ.",
  "power.turnOff": "Gbanyụọ",
  "power.explain":
    "Mgbe ọ na-arụ ọrụ, Prima na-akwụsị mbulite n'azụ, na-eji ụcha gbara ọchịchịrị ma na-enweghị mmegharị. Ihe niile ị debanyere ka na-echekwa n'ekwentị a ozugbo. Mbulite na-eche ruo mgbe ị pịrị Bulite ugbu a, tinye ekwentị n'ọkụ, ma ọ bụ gbanyụọ ya.",
  "power.auto": "Nke onwe ya",
  "power.autoHelp":
    "Na-agbanye mgbe batrị dị 20%, wee gbanyụọ mgbe ọ rutere 30%, ma ọ bụ mgbe a na-etinye ya n'ọkụ",
  "power.on": "Mgbe niile",
  "power.onHelp":
    "Jiri nke a mgbe ị gaghị enwe ike itinye ya n'ọkụ ogologo oge",
  "power.off": "Gbanyụọ",
  "power.offHelp": "Ekwela ka ọ gbanye onwe ya",
  "power.batteryNow": "Batrị ugbu a: {percent}%.",
  "power.batteryNowCharging": "Batrị ugbu a: {percent}%, na-etinye n'ọkụ.",
  "power.isOn": "Ọnọdụ batrị dị ala na-arụ ọrụ.",
  "power.isOff": "Ọnọdụ batrị dị ala adịghị arụ ọrụ.",
  "power.unsupported":
    "Ihe nchọgharị ekwentị a anaghị egosi batrị, ya mere Nke onwe ya enweghị ike ịgbanye ya. Jiri Mgbe niile mgbe batrị dị ala.",
  "power.oledNote":
    "Ụcha gbara ọchịchịrị na-azọpụta obere ike naanị n'ekwentị nwere ihuenyo OLED. Nzọpụta kacha ukwuu bụ ìhè ekwentị gị: mee ka ọ dị ala.",

  // ----- getting a new version of the app
  "update.ready": "Ụdị Prima ọhụrụ adịla njikere.",
  "update.help":
    "Mezue ihe ọ bụla ị na-echekwa mbụ. Ndekọ gị na-anọgide n'ekwentị a.",
  "update.now": "Melite ugbu a",
  "update.offlineReady": "Prima dị njikere ịrụ ọrụ na-enweghị ịntanetị.",

  // ----- the patient page, and the edit and new-visit pages
  "common.undo": "Weghachi",
  "common.edit": "Gbanwee",
  "common.delete": "Hichapụ",
  "common.yes": "Ee",
  "common.no": "Mba",
  "common.changesSaved": "Echekwara mgbanwe",
  "patient.title": "Onye ọrịa",
  "patient.notFound": "Achọtaghị onye ọrịa",
  "patient.backToPatients": "Laghachi na ndị ọrịa",
  "patient.deleteTitle": "Hichapụ {name}?",
  "patient.deleteMessage":
    "A ga-ewepụ ha na ndepụta niile na ngwaọrụ niile. Ị nwere ike weghachi ya ozugbo.",
  "patient.deleteLabel": "Hichapụ onye ọrịa",
  "patient.visitDeleteTitle": "Hichapụ nleta a?",
  "patient.visitDeleteMessage":
    "A ga-ewepụ nleta a n'akụkọ onye ọrịa a. Ị nwere ike weghachi ya ozugbo.",
  "patient.visitDeleteLabel": "Hichapụ nleta",
  "patient.vaccineDeleteTitle": "Hichapụ ndekọ ọgwụ mgbochi a?",
  "patient.vaccineDeleteMessage":
    "A ga-ewepụ ndekọ ahụ. Ị nwere ike weghachi ya ozugbo.",
  "patient.vaccineDeleteLabel": "Hichapụ ndekọ",
  "patient.deleted": "E hichapụrụ {name}",
  "patient.visitDeleted": "E hichapụrụ nleta",
  "patient.vaccineDeleted": "E hichapụrụ ndekọ ọgwụ mgbochi",
  "patient.ageEstimated": "{age} (atụmatụ)",
  "patient.followUp": "Nleta ọzọ {date}",
  "patient.followUpOverdue": "Nleta ọzọ {date} (agafeela oge)",
  "patient.firstReason": "Ihe kpatara ndebanye aha mbụ",
  "patient.addVisit": "Tinye nleta",
  "patient.visitsTitle": "Nleta ({count})",
  "patient.noVisits": "Edekọbeghị nleta ọ bụla",
  "patient.noVisitsHelp":
    "Jiri “Tinye nleta” dekọọ nsogbu, ihe e tụrụ n'ahụ na nchoputa ọrịa.",
  "patient.cardPersonal": "Nke onwe",
  "patient.address": "Adreesị",
  "patient.cardMedical": "Ahụike",
  "patient.obstetric": "Ime na ọmụmụ",
  "patient.gender": "Nwoke ma ọ bụ nwanyị",
  "patient.phone": "Ekwentị",
  "patient.registered": "E debanyere",
  "patient.village": "Obodo",
  "patient.kinName": "Aha",
  "patient.nhis": "Nọmba NHIS",
  "patient.bloodGroup": "Ụdị ọbara",
  "patient.allergies": "Alaji",
  "patient.pregnant": "Dị ime",
  "patient.immunizations": "Ọgwụ mgbochi",
  "patient.addVaccine": "Tinye ọgwụ mgbochi",
  "patient.noVaccines": "Edekọbeghị ọgwụ mgbochi ọ bụla.",
  "patient.vaccineDose": "{name} · ọgwụ nke {dose}",
  "patient.vaccineGiven": "E nyere {date}",
  "patient.vaccineDue": "{label} kwesịrị {date}",
  "patient.vaccineDueOverdue": "{label} kwesịrị {date} (agafeela oge)",
  "patient.nextDose": "Ọgwụ na-esote",
  "patient.vaccineDeleteAria": "Hichapụ {name} ọgwụ nke {dose}",
  "patient.editTitle": "Gbanwee ndekọ onye ọrịa",
  "patient.editPageTitle": "Gbanwee · {name}",
  "patient.cardFixed": "Enweghị ike ịgbanwe nọmba kaadị {card}.",
  "visit.newTitle": "Nleta ọhụrụ",
  "visit.newPageTitle": "Nleta ọhụrụ · {name}",

  // ----- the full registration form
  "form.newAdmission": "Ọ bụ nnabata ọhụrụ? (nleta mbụ maka nsogbu)",
  "form.chiefComplaint": "Isi nsogbu",
  "form.complaintExample": "dịka fever na cough ruo ụbọchị 3",
  "form.ageLine": "Ọ dị {age}",
  "form.villageTown": "Obodo / Ime obodo",
  "form.medicalOptional": "Ahụike (nhọrọ)",
  "form.notKnown": "Amaghị",
  "form.allergies": "Alaji ndị amaara",
  "form.allergyExample": "dịka Penicillin",
  "form.obstetric": "Akụkọ ime na ọmụmụ",
  "form.currentlyPregnant": "Dị ime ugbu a",
  "form.guardianTitle": "Onye na-elekọta (nhọrọ)",
  "form.guardianHelp":
    "Ịtinye onye na-elekọta na-enyere Prima aka ịkpọ onye kwesịrị ekwesị maka ọgwụ mgbochi na nleta ọzọ. Buru ụzọ chọọ: nne nwere ọtụtụ ụmụ bụ otu onye na-elekọta.",
  "form.noticeText":
    "Agwara m onye ọrịa (ma ọ bụ onye na-elekọta ya) otú a ga-esi jiri ozi ya, na ọ nwere ike ịjụ ka ọ hụ, melite ma ọ bụ wepụ ya. Ọ bụrụ na nke a enweghị ike ime ugbu a, hapụ ya n'enweghị akara, wee dekọọ ya mgbe e mesịrị site na ndekọ onye ọrịa.",
  "form.dupExact":
    "E debanyela ya? {name} ({card}) nwere otu aha, ụbọchị amụrụ na obodo.",
  "form.dupSimilar": "Aha ndị yiri ya nwere otu ụbọchị amụrụ:",
  "form.dupMatch": "{name} · {card} · yiri ya {score}%",
  "form.leaveConfirm": "Hapụ n'enweghị ịdebanye onye ọrịa a aha?",
  "form.saveChanges": "Chekwaa mgbanwe",

  // ----- shared pieces and relationships
  "common.close": "Mechie",
  "badge.under5": "N'okpuru afọ 5",
  "rel.mother": "Nne",
  "rel.father": "Nna",
  "rel.grandparent": "Nne ochie ma ọ bụ nna ochie",
  "rel.sibling": "Nwanne",
  "rel.auntUncle": "Nwanne nne ma ọ bụ nna",
  "rel.other": "Ọzọ",
  "rel.guardian": "Onye na-elekọta",

  // ----- guardians
  "guardian.title": "Onye na-elekọta",
  "guardian.editTitle": "Gbanwee onye na-elekọta",
  "guardian.saved": "Echekwara onye na-elekọta",
  "guardian.removed": "E wepụrụ onye na-elekọta",
  "guardian.updated": "E melitela onye na-elekọta",
  "guardian.linkRemoved": "E wepụrụ njikọ onye na-elekọta",
  "guardian.saveFailed": "Enweghị ike ichekwa onye na-elekọta.",
  "guardian.editNote":
    "Mgbanwe ndị a ga-emetụta ụmụaka niile jikọtara na onye na-elekọta a.",
  "guardian.relationship": "Mmekọrịta",
  "guardian.relationshipTo": "Mmekọrịta ya na onye ọrịa",
  "guardian.callAria": "Kpọọ {name}",
  "guardian.noChildren": "Ejikọtabeghị ụmụaka ọ bụla.",
  "guardian.new": "Onye na-elekọta ọhụrụ",
  "guardian.backToSearch": "Laghachi na nchọcha",
  "guardian.useKin": "Jiri onye ikwu kacha nso: {name}",
  "guardian.alsoPatient": "Onye a ọ bụkwa onye ọrịa ebe a? (nhọrọ)",
  "guardian.searchPatient": "Chọọ aha, ekwentị ma ọ bụ nọmba kaadị",
  "guardian.motherNote":
    "Ijikọ ndekọ nne na-egosi nleta ime ya n'ndekọ nwa ahụ.",
  "guardian.notFound": "Achọtaghị onye na-elekọta. Họrọ ọzọ",
  "guardian.choose": "Họrọ onye na-elekọta ọzọ",
  "guardian.search": "Chọọ onye na-elekọta site na ekwentị ma ọ bụ aha",
  "guardian.childCount_other": "ụmụaka {count}",
  "guardian.addNew": "Tinye onye na-elekọta ọhụrụ",
  "guardian.errName": "Tinye aha onye na-elekọta.",
  "guardian.errPhone":
    "Tinye nọmba ekwentị Naịjirịa ziri ezi maka onye na-elekọta.",
  "guardian.errSmsPhone":
    "Tinye nọmba ekwentị onye na-elekọta iji zipu ncheta SMS.",
  "guardian.errSelf": "Onye enweghị ike ịbụ onye na-elekọta onwe ya.",

  // ----- the family section
  "family.mothersRecord": "Ndekọ nne: {name} · {card}",
  "family.anc": "Nleta ime: {count}, nke ikpeazụ {date}",
  "family.noAnc": "Edekọbeghị nleta ime ọ bụla maka ya.",
  "family.change": "Gbanwee onye na-elekọta",
  "family.removeLink": "Wepụ njikọ",
  "family.none": "Ejikọtabeghị onye na-elekọta",
  "family.noneHelp":
    "Jikọọ onye na-elekọta ka ncheta na oku rute onye kwesịrị ekwesị.",
  "family.add": "Tinye onye na-elekọta",
  "family.children": "Ụmụaka ({count})",

  // ----- vaccines and diagnoses
  "vaccine.allRecorded":
    "E dekọla ọgwụ mgbochi niile dị n'ndepụta maka onye ọrịa a.",
  "vaccine.label": "Ọgwụ mgbochi",
  "vaccine.dateGiven": "Ụbọchị e nyere ya",
  "vaccine.nextPreview": "Nke na-esote: {label}, kwesịrị {date}",
  "vaccine.save": "Chekwaa ọgwụ mgbochi",
  "vaccine.recorded": "E dekọrọ {label}",
  "vaccine.errDate": "Tinye ụbọchị e nyere ya",
  "vaccine.errFuture": "Ụbọchị enweghị ike ịbụ n'ọdịnihu",
  "vaccine.errBeforeBirth": "Enweghị ike inye ọgwụ mgbochi tupu ụbọchị amụrụ",
  "vaccine.alreadyGiven": "Ọgwụ mgbochi e nyelarị",
  "vaccine.tickHelp":
    "Kaa akara n'ọgwụ mgbochi ọ bụla nwa natara, lelekwa ụbọchị.",
  "diagnosis.placeholder": "Pịnye ka ịchọ, dịka malaria ma ọ bụ sugar",
  "diagnosis.clear": "Hichapụ nchoputa",
  "diagnosis.frequent": "A na-ejikarị ebe a",
  "diagnosis.codeSaved": "A ga-echekwa koodu ICD-10 {code}.",
  "diagnosis.sensitive":
    "Nchoputa nzuzo. A na-ahapụ ya na mbupụ e kekọrịtara belụsọ onye nchịkwa gị tinye ya.",
  "diagnosis.freeText": "Ekpebighị koodu. A ga-echekwa ya dị ka ederede efu.",

  // ----- the visit form, visit card and edit-visit page
  "visit.title": "Nleta",
  "visit.date": "Ụbọchị nleta",
  "visit.complaints": "Nsogbu",
  "visit.prefilled":
    "E tinyere ya site na ndebanye aha mbụ. Gbanwee ya ma ọ dị mkpa.",
  "visit.vitals": "Ihe e tụrụ n'ahụ",
  "visit.bpTop": "Nọmba elu nke BP (systolic)",
  "visit.bpBottom": "Nọmba ala nke BP (diastolic)",
  "visit.temperature": "Ọkụ ahụ",
  "visit.weight": "Ịdị arọ",
  "visit.flagsNote":
    "Akara ndị a bụ nduzi, ọ bụghị nchoputa. Akara BP na-emetụta ndị ọrịa dị afọ 13 na karịa.",
  "visit.assessment": "Nyocha",
  "visit.diagnosis": "Nchoputa (nhọrọ)",
  "visit.treatment": "Ọgwụgwọ / ihe e dere (nhọrọ)",
  "visit.treatmentExample":
    "dịka Artemether-lumefantrine, e gwara ya ka ọ ṅụọ mmiri ukwuu",
  "visit.followUpTitle": "Nleta ọzọ",
  "visit.nextDate": "Ụbọchị nleta na-esote (nhọrọ)",
  "visit.in3days": "N'ime ụbọchị 3",
  "visit.in1week": "N'ime izu 1",
  "visit.in2weeks": "N'ime izu 2",
  "visit.in1month": "N'ime ọnwa 1",
  "visit.saved": "Echekwara nleta",
  "visit.updated": "E melitela nleta",
  "visit.saveFailed": "Enweghị ike ichekwa nleta a. Biko nwaa ọzọ.",
  "visit.save": "Chekwaa nleta",
  "visit.leaveConfirm": "Hapụ n'enweghị ichekwa nleta a?",
  "visit.editAria": "Gbanwee nleta",
  "visit.editTitle": "Gbanwee nleta",
  "visit.editPageTitle": "Gbanwee nleta · {name}",
  "visit.notFound": "Achọtaghị nleta",
  "visit.backToPatient": "Laghachi na onye ọrịa",

  // ----- messages under boxes that come from the form rules
  "err.fieldRequired": "A chọrọ {label}",
  "err.fieldShort": "{label} dị mkpụmkpụ nke ukwuu",
  "err.fieldLong": "{label} dị ogologo nke ukwuu",
  "form.nokName": "Aha onye ikwu kacha nso",
  "err.tooLong": "Dị ogologo nke ukwuu",
  "err.enterNumber": "Tinye nọmba",
  "err.complaintShort": "Kọwaa ihe kpatara nleta (opekata mpe mkpụrụedemede 3)",
  "err.smsChildren": "Maka ụmụaka, onye na-elekọta ha na-enye nkwenye SMS.",
  "err.smsPhone": "Tinye nọmba ekwentị iji nata ncheta SMS.",
  "err.femaleOver12": "Naanị maka ndị ọrịa nwanyị karịrị afọ 12",
  "err.paraGravida": "Para enweghị ike karịa gravida",
  "err.vaccineDateMissing": "Tinye ụbọchị e nyere {label}",
  "err.vaccineFuture": "Ụbọchị {label} enweghị ike ịbụ n'ọdịnihu",
  "err.vaccineBeforeBirth": "Enweghị ike inye {label} tupu ụbọchị amụrụ",

  // ----- shared
  "common.loading": "Na-ebudata…",

  // ----- the home page
  "home.goodMorning": "Ụtụtụ ọma",
  "home.goodAfternoon": "Ehihie ọma",
  "home.goodEvening": "Mgbede ọma",
  "home.find": "Chọọ onye ọrịa",
  "home.totalPatients": "Ndị ọrịa niile",
  "home.registeredToday": "E debanyere taa",
  "home.followUpsDue_other": "Nleta ọzọ {count} kwesịrị ime",
  "home.followUpsHelp": "Nke agafeela oge na ụbọchị 7 ndị na-abịa",
  "home.welcome": "Nnọọ na Prima",
  "home.emptyHelp":
    "Ndebanye aha gị tọgbọ chakoo. Debanye onye ọrịa mbụ gị aha. Ọ na-arụ ọrụ ọbụna na-enweghị netwọk.",
  "home.registerFirst": "Debanye onye ọrịa mbụ aha",
  "home.recent": "E debanyere n'oge na-adịbeghị anya",
  "home.viewAll": "Lee ha niile",
  "home.footer":
    "Prima na-arụ ọrụ na-enweghị netwọk. A na-echekwa ndekọ n'ngwaọrụ a, ha na-ebulite n'onwe ha.",

  // ----- the patients page and the list
  "patients.subtitle": "Chọọ site na aha, ekwentị, NHIS ma ọ bụ nọmba kaadị.",
  "patients.findDuplicates": "Chọpụta ndị e debanyere ugboro abụọ",
  "patients.exportCsv": "Bupụ CSV",
  "patients.exportNeedsBasic": "Mbupụ chọrọ atụmatụ Basic",
  "patients.exportUpgradeText":
    "Melite gaa na Basic ({price} n'ọnwa) iji budata ndekọ ndị ọrịa gị niile dị ka CSV, na akụkọ LGA ọzọ.",
  "list.search": "Chọọ aha, ekwentị, NHIS ma ọ bụ nọmba kaadị",
  "list.none": "Enweghị onye ọrịa ọ bụla",
  "list.noneHelp": "Debanye onye ọrịa mbụ aha, ọ ga-apụta ebe a.",
  "list.noMatch":
    "Enweghị onye ọrịa ma ọ bụ onye na-elekọta dabara na “{search}”.",
  "list.guardians": "Ndị na-elekọta",
  "list.count": "Ndị ọrịa {count} n'ime {total}",
  "list.first100": "Na-egosi 100 mbụ. Chọọ iji belata ya.",
  "limit.freePlan": "Atụmatụ efu",
  "limit.usage": "Ndị ọrịa {used} / {limit}",
  "limit.spotsLeft_other": "Ebe {count} fọdụrụ.",
  "upgrade.notNow": "Ọ bụghị ugbu a",

  // ----- the patient card and scanning
  "card.pageTitle": "Kaadị onye ọrịa",
  "card.printHelp":
    "A na-ebipụta ya n'ogo kaadị ụlọ akụ. Bipụta ya na akwụkwọ kaadị, ma ọ bụ na akwụkwọ nkịtị wee bepụ ya n'akara ahụ.",
  "card.unavailable": "Onye ọrịa a adịghị.",
  "card.qrNote":
    "Koodu QR na-ejide naanị nọmba kaadị. Onye ọ bụla chọtara kaadị enweghị ike ịgụ ndekọ site na ya. Nyochaa ya na Prima site na Nyochaa kaadị.",
  "card.number": "Nọmba kaadị",
  "card.note": "Wetara kaadị a n'nleta ọ bụla. Debe ya n'ebe akọrọ na nchekwa.",
  "card.about": "Ihe dị ka {age}",
  "card.born": "Amụrụ {date}",
  "scan.title": "Nyochaa kaadị",
  "scan.subtitle": "Chee igwefoto ahụ n'ihu koodu QR dị na kaadị onye ọrịa.",
  "scan.notPrima": "Nke ahụ abụghị kaadị onye ọrịa Prima.",
  "scan.notFound":
    "Enweghị onye ọrịa nwere kaadị {card} n'ekwentị a. Ọ bụrụ na e debanyere onye ọrịa ahụ n'ekwentị ọzọ, chere ka ọ bulite.",
  "scan.typeLabel": "Ma ọ bụ dee nọmba kaadị",
  "scan.open": "Meghee onye ọrịa",
  "scan.noCamera": "Igwefoto adịghị.",
  "scan.denied":
    "Kwe ka Prima jiri igwefoto n'ntọala saịtị nke ihe nchọgharị, wee meghee ibe a ọzọ.",
  "scan.noDevice": "Ngwaọrụ a enweghị igwefoto ọ ga-eji.",
  "scan.cameraError": "Igwefoto enweghị ike ịmalite.",
  "scan.typeInstead": "Ị nwere ike ide nọmba kaadị n'okpuru kama.",
  "scan.starting": "Na-amalite igwefoto…",
  "scan.qrAria": "Koodu QR nwere nọmba kaadị",

  // ----- readings, steppers and visit rules
  "vitals.veryHigh": "Dị elu nke ukwuu",
  "vitals.high": "Dị elu",
  "vitals.highFever": "Ahụ ọkụ dị elu",
  "vitals.fever": "Ahụ ọkụ",
  "vitals.low": "Dị ala",
  "stepper.increase": "Bawanye {label}",
  "stepper.decrease": "Belata {label}",
  "err.fieldNumber": "{label} ga-abụrịrị nọmba",
  "err.fieldWhole": "{label} ga-abụrịrị nọmba zuru ezu",
  "err.fieldLow": "{label} dị ka nke dị ala nke ukwuu",
  "err.fieldHigh": "{label} dị ka nke dị elu nke ukwuu",
  "err.visitDateRequired": "Tinye ụbọchị nleta",
  "err.visitFuture": "Ụbọchị nleta enweghị ike ịbụ n'ọdịnihu",
  "err.visitBeforeBirth": "Nleta enweghị ike ịbụ tupu ụbọchị amụrụ",
  "err.under500": "Debe ya n'okpuru mkpụrụedemede 500",
  "err.bothBp": "Tinye ọnụọgụ BP abụọ ahụ",
  "err.diaLower": "Diastolic ga-adịrị ala karịa systolic",
  "err.validDate": "Tinye ụbọchị ziri ezi",
  "err.followAfter": "Nleta ọzọ ga-abụrịrị mgbe ụbọchị nleta gasịrị",

  // ----- small shared pieces
  "glove.mode": "Ụdị uwe aka",
  "app.notFound": "Achọtaghị ibe",
  "app.goHome": "Laghachi n'ụlọ",

  // ----- signing in and setting up a facility
  "auth.opening": "Na-emeghe Prima…",
  "auth.hidePassword": "Zoo paswọdụ",
  "auth.showPassword": "Gosi paswọdụ",
  "auth.tagline":
    "Ndekọ ndị ọrịa maka ụlọ ọgwụ gị nke na-arụ ọrụ na-enweghị netwọk.",
  "auth.signIn": "Banye",
  "auth.createAccount": "Mepụta akaụntụ",
  "auth.yourName": "Aha gị",
  "auth.email": "Imeelụ",
  "auth.password": "Paswọdụ",
  "auth.passwordHint": "Opekata mpe mkpụrụedemede 8.",
  "auth.wait": "Biko chere…",
  "auth.needInternet":
    "Ị chọrọ ịntanetị iji banye. Mgbe nke ahụ gasịrị, Prima na-emeghe ma na-arụ ọrụ na-enweghị netwọk.",
  "auth.errName": "Tinye aha gị.",
  "auth.errEmail": "Tinye adreesị imeelụ ziri ezi.",
  "auth.errPassword": "Jiri paswọdụ nwere opekata mpe mkpụrụedemede 8.",
  "auth.setupTitle": "Hazie ụlọ ọgwụ gị",
  "auth.signedInAs": "Ị banyere dị ka {email}",
  "auth.createFacility": "Mepụta ụlọ ọgwụ",
  "auth.joinWithCode": "Sonye site na koodu",
  "auth.adminNote":
    "Ị ga-abụ onye nchịkwa ụlọ ọgwụ ahụ, ị nwekwara ike ịkpọ ndị ọrụ gị oku.",
  "auth.facilityName": "Aha ụlọ ọgwụ",
  "auth.facilityCode": "Koodu ụlọ ọgwụ",
  "auth.facilityCodeHint":
    "Mkpụrụedemede 2 ruo 5. Ọ na-amalite nọmba kaadị ọ bụla, dị ka ANK-7K3F9Q.",
  "auth.createFacilityBtn": "Mepụta ụlọ ọgwụ",
  "auth.joinHelp":
    "Gwa onye nchịkwa ụlọ ọgwụ gị ka o nye gị koodu oku. Koodu ọ bụla na-arụ ọrụ otu ugboro.",
  "auth.inviteCode": "Koodu oku",
  "auth.joinFacility": "Sonye n'ụlọ ọgwụ",
  "auth.differentAccount": "Jiri akaụntụ ọzọ",
  "auth.errFacilityName": "Tinye aha ụlọ ọgwụ.",
  "auth.errFacilityCode":
    "Koodu ụlọ ọgwụ ga-abụrịrị mkpụrụedemede 2 ruo 5, dịka ANK.",
  "auth.errLgaState": "Tinye LGA na steeti.",
  "auth.errInvite": "Tinye koodu oku e nyere gị.",
  "auth.endedTitle": "Ohere gị agwụla",
  "auth.endedBody":
    "Ị anọghịzi n'{name}, ya mere enweghị ike imeghe ndekọ ndị ọrịa ya n'ekwentị a. Hichapụ ihe niile echekwara n'ekwentị a wee pụọ iji chebe nzuzo ndị ọrịa.",
  "auth.eraseSignOut": "Hichapụ ekwentị a wee pụọ",
  "auth.checkAgain": "Lelee ọzọ (echere m na nke a bụ njehie)",
  "auth.foreignTitle": "Ekwentị a nwere ndekọ nke ụlọ ọgwụ ọzọ",
  "auth.foreignBody":
    "Edebere ndekọ sitere n'ụlọ ọgwụ ọzọ n'ekwentị a. Ọ ga-adị mkpa ihichapụ ha tupu ị gaa n'ihu, ka ndị ọrịa ụlọ ọgwụ abụọ ahụ ghara ịgwakọta.",
  "auth.unsynced_other":
    "Mgbanwe {count} e jibeghị bulite ma ọ ga-efu. Banye n'ụlọ ọgwụ ọzọ ahụ buru ụzọ ma ọ dị gị mkpa.",
  "auth.eraseContinue": "Hichapụ ma gaa n'ihu",
  "auth.signInAgain": "Banye ọzọ",
  "auth.reauthHelp":
    "Ndekọ gị dị nchebe n'ekwentị a. Ịbanye ọzọ na-enye ha ohere ibulite.",
  "authErr.wrongLogin": "Imeelụ ma ọ bụ paswọdụ adịghị mma.",
  "authErr.exists": "Imeelụ a nwerelarị akaụntụ. Nwaa ịbanye.",
  "authErr.network": "Enweghị ịntanetị. Ị chọrọ njikọ maka nzọụkwụ a.",
  "authErr.rate": "Ọtụtụ nnwale. Chere nkeji ole na ole ma nwaa ọzọ.",
  "authErr.generic": "Ihe gbagoro.",

  // ----- PIN, lock screen and security
  "lock.choose": "Họrọ PIN nwere ọnụọgụ 6",
  "lock.repeat": "Kwughachi PIN ahụ",
  "lock.differ": "PIN abụọ ahụ adịghị otu. Malite ọzọ.",
  "lock.protectTitle": "Chebe ekwentị a",
  "lock.protectSub":
    "Ị ga-etinye PIN a mgbe ọ bụla Prima meghere ma ọ bụ mechie.",
  "lock.protectNote":
    "PIN na-egbochi ndị na-achọ ịhụ ihe n'enweghị ihe ha chọrọ. Jikwa mkpọchi ihuenyo ekwentị gị na-arụ ọrụ.",
  "lock.locked": "Prima mechiri",
  "lock.tooMany": "PIN ndị na-ezighi ezi dị ọtụtụ.",
  "lock.wrong": "PIN adịghị mma.",
  "lock.resetMsg":
    "PIN ndị na-ezighi ezi dị ọtụtụ. Jiri paswọdụ gị banye ka ịtọọ nke ọhụrụ.",
  "lock.wait_other": "Nnwale ndị na-ezighi ezi dị ọtụtụ. Chere sekọnd {count}.",
  "lock.forgot": "Echefuru PIN? Jiri paswọdụ gị banye",
  "lock.newPinTitle": "Tọọ PIN ọhụrụ",
  "lock.forgotHelp":
    "Tinye paswọdụ akaụntụ gị iji gosi na ọ bụ gị. Ị chọrọ ịntanetị maka nke a.",
  "lock.continue": "Gaa n'ihu",
  "lock.enterCurrent": "Tinye PIN gị ugbu a",
  "security.title": "Nchekwa",
  "security.lockNow": "Mechie ugbu a",
  "security.changePin": "Gbanwee PIN",
  "security.autoLock": "Mechie n'onwe ya mgbe",
  "security.minutes_other": "nkeji {count} n'enweghị iji ya",
  "security.note":
    "PIN na-egbochi ndị na-achọ ịhụ ihe n'enweghị ihe ha chọrọ. Ọ bụ mkpọchi, ọ bụghị akpati nchekwa: jikwa mkpọchi ihuenyo ekwentị gị na-arụ ọrụ, gwakwa onye nchịkwa gị ozugbo ma ọ bụrụ na ekwentị ahụ furu efu.",
  "session.reauth":
    "Banye ọzọ ka ọ na-aga n'ihu na-ebulite. Ndekọ gị dị nchebe n'ekwentị a.",
  "session.offline":
    "Ị anọghị n'ịntanetị. Prima na-arụ ọrụ dị ka mgbe niile ma ọ ga-ebulite ozugbo ị banyere ọzọ n'ịntanetị.",

  // ----- the dashboard and follow-ups
  "dash.noData": "Enweghị data ọ bụla",
  "dash.noDataHelp": "Debanye ndị ọrịa aha, bọọdụ ahụ ga-ejupụta n'onwe ya.",
  "dash.prevMonth": "Ọnwa gara aga",
  "dash.nextMonth": "Ọnwa na-esote",
  "dash.newMonth": "Ndị ọhụrụ n'ọnwa a",
  "dash.visitsMonth": "Nleta n'ọnwa a",
  "dash.followUps7": "Nleta ọzọ kwesịrị ime (ụbọchị 7)",
  "dash.smsQueued": "Ncheta SMS na-eche",
  "dash.reachable": "Ndị a ga-eji SMS rute",
  "dash.ageGroups": "Ìgwè afọ",
  "dash.activity": "Ọrụ kwa ụbọchị",
  "dash.topDiagnoses": "Nchoputa ndị kachasị n'ọnwa a",
  "dash.topVillages": "Obodo ndị kachasị (ndị ọrịa niile)",
  "dash.noActivity": "Enweghị ndebanye aha ma ọ bụ nleta n'ọnwa a.",
  "dash.noDiagnoses": "Edekọghị nchoputa ọ bụla n'ọnwa a.",
  "dash.registrations": "Ndebanye aha",
  "dash.visits": "Nleta",
  "dash.devStats": "E gbakọrọ ọnụ ọgụgụ n'ngwaọrụ a n'ime {ms} ms",
  "dash.tabOverview": "Nchịkọta",
  "dash.tabFollowUps": "Nleta ọzọ",
  "dash.tabReminders": "Ncheta",
  "dash.tabReport": "Akụkọ LGA",
  "dash.subtitle": "Ụlọ ọgwụ gị n'otu leba anya, e gbakọrọ ya n'ngwaọrụ a.",
  "fu.overdueBy_other": "Gafere oge site na ụbọchị {count}",
  "fu.dueToday": "Kwesịrị taa",
  "fu.dueIn_other": "Kwesịrị n'ime ụbọchị {count} · {date}",
  "fu.days": "Ụbọchị {count}",
  "fu.callAbout": "Kpọọ maka {name}",
  "fu.overdue": "Gafere oge",
  "fu.comingUp": "Na-abịa",
  "fu.count_other": "Nleta ọzọ {count}",
  "fu.summary": "{overdue} gafere oge · {today} taa · {upcoming} na-abịa",
  "fu.allCaughtUp": "Ihe niile emechaala",
  "fu.nothing":
    "Ọ dịghị ihe gafere oge ma ọ bụ kwesịrị n'ime ụbọchị {days} ndị na-abịa.",
  "fu.upgradeTitle": "Lee onye kwesịrị, kpọkwa ya",
  "fu.upgradeText":
    "Atụmatụ Pro na-edepụta onye ọrịa ọ bụla nwere nleta ọzọ ma ọ bụ ọgwụ mgbochi gafere oge ma ọ bụ na-abịa, na otu mmetụ iji kpọọ onye ọrịa ma ọ bụ onye na-elekọta ya.",
};
