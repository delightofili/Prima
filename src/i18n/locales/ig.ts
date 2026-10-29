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
};
