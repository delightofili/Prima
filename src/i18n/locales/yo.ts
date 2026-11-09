// Yoruba (Èdè Yorùbá). STATUS: DRAFT. Written as a first version for a native speaker to check and correct.
// Rules for whoever edits this file:
//   1. Keep every {name} exactly as it is. The program fills it in (a number, a name, a time).
//   2. Yoruba has no plural form, so only the "_other" lines are needed. Do not add "_one" lines.
//   3. Clinical names (conditions, complaints, medicines) stay in English on purpose. Do not translate them here.
//   4. Use the letters ẹ ọ ṣ with the tone marks. Save the file as UTF-8.
//   5. If a line is missing, Prima shows the English one. A missing line is safer than a wrong one.
import type { Key } from "./en";

export const dict: Partial<Record<Key, string>> = {
  // ----- the language itself
  "lang.heading": "Èdè",
  "lang.help":
    "Yan èdè tí Prima yóò máa lò lórí fóònù yìí. Orúkọ àìsàn, ìṣòro àti oògùn yóò wà ní èdè Gẹ̀ẹ́sì kí àwọn ìròyìn lè rí bákan náà níbi gbogbo.",
  "lang.draftBadge": "Àkọ́kọ́",
  "lang.soonBadge": "Ń bọ̀",
  "lang.draftNote":
    "Ìtumọ̀ yìí jẹ́ àkọ́kọ́. Àwọn tó ń sọ Yorùbá ṣì ń yẹ̀ ẹ́ wò. Bí ọ̀rọ̀ kan bá dà bí èyí tí kò tọ̀, jọ̀wọ́ sọ fún wa.",
  "lang.loadFailed":
    "A kò lè rí èdè yìí. Sopọ̀ mọ́ íntánẹ́ẹ̀tì lẹ́ẹ̀kan, lẹ́yìn náà tún gbìyànjú.",
  "lang.someEnglish":
    "Àwọn ojú-ìwé kan ṣì wà ní èdè Gẹ̀ẹ́sì títí a ó fi parí ìtumọ̀.",

  // ----- the bottom tabs and common buttons
  "nav.home": "Ilé",
  "nav.register": "Forúkọsílẹ̀",
  "nav.patients": "Àwọn aláìsàn",
  "nav.dashboard": "Àkópọ̀",
  "nav.lock": "Tì",
  "nav.account": "Àkáǹtì",
  "nav.lockPrima": "Ti Prima",
  "common.cancel": "Fagilé",
  "common.save": "Fipamọ́",
  "common.later": "Lẹ́yìn náà",
  "common.tryAgain": "Tún gbìyànjú",
  "common.syncNow": "Gbé sókè báyìí",
  "common.open": "Ṣí",

  // ----- ages
  "age.years_other": "ọdún {count}",
  "age.months_other": "oṣù {count}",

  // ----- registering a patient
  "register.title": "Fi orúkọ aláìsàn sílẹ̀",
  "register.subtitle":
    "A kọ́kọ́ fi pamọ́ sórí ẹ̀rọ yìí, lẹ́yìn náà a ó gbé e sókè nígbà tí íntánẹ́ẹ̀tì bá wà.",
  "register.useFull": "Ṣé o nílò ìsọfúnni sí i? Lo fọ́ọ̀mù kíkún",
  "register.useQuick": "Lo fọ́ọ̀mù kíákíá",
  "register.limitTitle": "O ti dé ọ̀dọ̀ aláìsàn 200",
  "register.limitText":
    "Ètò ọ̀fẹ́ gba aláìsàn 200. Basic mú ààlà náà kúrò, ó sì fi ìgbékalẹ̀ CSV àti ìròyìn LGA oṣooṣù kún un. Wo Plans fún owó.",
  "register.fullName": "Orúkọ kíkún",
  "register.sex": "Ọkùnrin tàbí obìnrin",
  "register.female": "Obìnrin",
  "register.male": "Ọkùnrin",
  "register.age": "Ọjọ́ orí",
  "register.howToGiveAge": "Bí a ṣe ń fúnni ní ọjọ́ orí",
  "register.byAge": "Ọjọ́ orí",
  "register.byBirthDate": "Ọjọ́ ìbí",
  "register.agePlaceholder": "bí àpẹẹrẹ 34",
  "register.years": "Ọdún",
  "register.months": "Oṣù",
  "register.yearsOrMonths": "Ọdún tàbí oṣù",
  "register.dateOfBirth": "Ọjọ́ ìbí",
  "register.estimateNote":
    "A ó fi pamọ́ gẹ́gẹ́ bí àfojúdá. Ojú-ìwé aláìsàn yóò béèrè ọjọ́ gidi lẹ́yìn náà.",
  "register.ageIs": "Ó jẹ́ {age}.",
  "register.village": "Abúlé tàbí agbègbè",
  "register.villagesRecent": "Àwọn abúlé tí a lò láìpẹ́ yìí",
  "register.pregnantNow": "Ó lóyún báyìí",
  "register.reason": "Ìdí àbẹ̀wò",
  "register.commonReasons": "Àwọn ìdí tó wọ́pọ̀",
  "register.orTypeIt": "Tàbí kọ ọ́",
  "register.registrationOnly": "Ìforúkọsílẹ̀ nìkan (kò sí àbẹ̀wò báyìí)",
  "register.phoneOptional": "Fóònù (kò pọn dandan)",
  "register.guardianOptional": "Òbí tàbí olùtọ́jú (kò pọn dandan)",
  "register.noticeTitle": "A ti ṣàlàyé ìkéde àṣírí",
  "register.noticeHelp":
    "Sọ fún aláìsàn bí a ṣe máa lo ìsọfúnni rẹ̀. O lè ṣe àkọsílẹ̀ èyí lẹ́yìn náà láti ojú-ìwé aláìsàn.",
  "register.duplicateExact": "Aláìsàn yìí lè ti forúkọ sílẹ̀ tẹ́lẹ̀.",
  "register.duplicateSimilar": "Aláìsàn tó jọ èyí ti forúkọ sílẹ̀ tẹ́lẹ̀.",
  "register.differentPerson": "Èyí jẹ́ ẹlòmíràn",
  "register.planFull": "Ètò ọ̀fẹ́ ti kún. Wo Plans láti fi aláìsàn kún un.",
  "register.saveFailed":
    "A kò lè fi aláìsàn yìí pamọ́. Jọ̀wọ́ ṣàyẹ̀wò ìsọfúnni náà kí o tún gbìyànjú.",
  "register.saving": "Ń fipamọ́…",
  "register.submit": "Forúkọsílẹ̀",
  "register.submitAndVisit": "Forúkọsílẹ̀ kí o sì fi àbẹ̀wò kún un",
  "register.unsaved": "Àwọn àyípadà tí a kò tíì fipamọ́",

  // ----- the messages under a box that is not filled in right
  "err.nameRequired": "Tẹ orúkọ aláìsàn",
  "err.nameShort": "Orúkọ náà kúrú jù",
  "err.nameLong": "Orúkọ náà gùn jù",
  "err.sexRequired": "Yan obìnrin tàbí ọkùnrin",
  "err.ageNumber": "Tẹ ọjọ́ orí gẹ́gẹ́ bí nọ́mbà",
  "err.ageUseMonths": "Fún ọmọ tí kò tíì pé ọdún kan, yan oṣù",
  "err.ageTooOld": "Ọjọ́ orí kò lè ju ọdún 120 lọ",
  "err.ageUseYears": "Ju oṣù 59 lọ, yan ọdún",
  "err.dobRequired": "Tẹ ọjọ́ ìbí",
  "err.dobFuture": "Ọjọ́ ìbí kò lè jẹ́ ọjọ́ iwájú",
  "err.dobCheck": "Ṣàyẹ̀wò ọjọ́ ìbí",
  "err.villageRequired": "Tẹ abúlé tàbí agbègbè",
  "err.villageLong": "Orúkọ abúlé gùn jù",
  "err.phoneInvalid": "Tẹ nọ́mbà fóònù Nàìjíríà tó tọ́, bí àpẹẹrẹ 08031234567",
  "err.reasonRequired": "Sọ ìdí tí aláìsàn fi wá, tàbí yan Ìforúkọsílẹ̀ nìkan",
  "err.reasonLong": "Jẹ́ kí ó kéré sí lẹ́tà 200",

  // ----- the hint under the complaint box
  "complaint.warnPhone":
    "Èyí dà bí nọ́mbà fóònù. Má ṣe fi ìsọfúnni ìkànsí àti orúkọ sínú ìṣòro náà. Wọ́n ní àpótí tiwọn.",
  "complaint.warnEmail":
    "Èyí dà bí àdírẹ́sì ímeèlì. Má ṣe fi ìsọfúnni ìkànsí àti orúkọ sínú ìṣòro náà. Wọ́n ní àpótí tiwọn.",
  "complaint.recognised": "A mọ̀: {terms}",
  "complaint.didYouMean": "Ṣé o fẹ́ sọ:",
  "complaint.vague":
    "Sọ ohun tí aláìsàn ń rí, bí àpẹẹrẹ ibà, ikọ́ tàbí ikùn ríro.",
  "complaint.unknown": "Prima kò mọ ìṣòro yìí. O ṣì lè fi pamọ́.",

  // ----- after a patient is registered
  "saved.title": "A ti forúkọ aláìsàn sílẹ̀",
  "saved.about": "tó tó {age}",
  "saved.firstReason": "Ìdí ìforúkọsílẹ̀ àkọ́kọ́:",
  "saved.recordVisit": "Ṣe àkọsílẹ̀ àbẹ̀wò",
  "saved.viewProfile": "Wo ojú-ìwé aláìsàn",
  "saved.printCard": "Tẹ̀ káàdì jáde",
  "saved.another": "Forúkọ aláìsàn mìíràn sílẹ̀",

  // ----- what a quick registration left for later
  "record.finishTitle": "Parí àkọsílẹ̀ yìí",
  "record.addDetails": "Fi àwọn ìsọfúnni wọ̀nyí kún",
  "record.nextOfKin": "Ẹbí tó sún mọ́ jù",
  "record.nextOfKinHelp": "Ẹni tí a ó pè bí a kò bá lè rí aláìsàn.",
  "record.birthDate": "Ọjọ́ ìbí jẹ́ àfojúdá",
  "record.birthDateHelp": "Tẹ ọjọ́ gidi nígbà tí ẹnìkan bá mọ̀ ọ́n.",
  "record.guardian": "Òbí tàbí olùtọ́jú",
  "record.guardianHelp": "A nílò rẹ̀ fún ìrántí àti àkọsílẹ̀ ẹbí.",

  // ----- the sync badge, its panel and the banners
  "sync.offline": "Kò sí íntánẹ́ẹ̀tì",
  "sync.offlineSaved": "Kò sí íntánẹ́ẹ̀tì · {count} ti wà ní ipamọ́",
  "sync.offlineDetail":
    "Kò sí íntánẹ́ẹ̀tì. Gbogbo ohun tí o kọ ni a fi pamọ́ sórí fóònù yìí, yóò sì gbé ara rẹ̀ sókè nígbà tí íntánẹ́ẹ̀tì bá padà.",
  "sync.signin": "Wọlé láti gbé sókè",
  "sync.signinDetail":
    "Prima kò tíì wọlé sí àwọsánmà lórí fóònù yìí, nítorí náà kò sí ohun tó ń gbé sókè. Àwọn àkọsílẹ̀ wà ní ààbò lórí fóònù yìí.",
  "sync.schema": "A nílò àtúnṣe ibi ìpamọ́ dátà",
  "sync.schemaDetail":
    "Ibi ìpamọ́ dátà tó wà ní àwọsánmà kò ní ohun tí ẹ̀yà Prima yìí nílò, nítorí náà àwọn àkọsílẹ̀ kan kò lè gbé sókè. Wọ́n wà ní ààbò lórí fóònù yìí. Alábòójútó rẹ gbọ́dọ̀ ṣe SQL tuntun, lẹ́yìn náà kí ó tẹ Tún gbìyànjú.",
  "sync.working": "Ń gbé sókè…",
  "sync.workingDetail": "Ń gbé sókè àti ń gbà sílẹ̀ báyìí.",
  "sync.paused": "A dá dúró · {count} ń dúró",
  "sync.pausedDetail":
    "Ipò bátìrì kéré ti dá gbígbé sókè dúró. Tẹ Gbé sókè báyìí, fi fóònù sí iná, tàbí pa á.",
  "sync.attention_other": "{count} nílò àbójútó",
  "sync.attentionDetail_other":
    "A kò lè gbé àkọsílẹ̀ {count} sókè lẹ́yìn ìgbìyànjú púpọ̀. Wọ́n wà ní ààbò lórí fóònù yìí. Ṣí àlàyé ìgbésókè.",
  "sync.upgrade": "{count} ń dúró de ìgbéga ètò",
  "sync.upgradeDetail_other":
    "A ti fi aláìsàn {count} pamọ́ sórí fóònù yìí ṣùgbọ́n a kò tíì gbé wọn sókè, nítorí ètò ọ̀fẹ́ ti kún.",
  "sync.cloudDown": "Kò ṣeé dé àwọsánmà · {count} ń dúró",
  "sync.cloudDownDetail":
    "Prima kò lè dé àwọsánmà báyìí. Gbogbo nǹkan wà ní ipamọ́ lórí fóònù yìí, yóò sì gbé ara rẹ̀ sókè nígbà tó bá lè ṣe é.",
  "sync.retrying": "Ń tún gbìyànjú ní ìṣẹ́jú-àáyá {seconds} · {count} ń dúró",
  "sync.retryingDetail": "Àkọsílẹ̀ kan kò gbé sókè, a ó sì tún gbìyànjú láìpẹ́.",
  "sync.waiting": "{count} ń dúró láti gbé sókè",
  "sync.waitingDetail": "Wọ́n yóò gbé sókè láàrin ìṣẹ́jú-àáyá díẹ̀.",
  "sync.synced": "A ti gbé e sókè",
  "sync.syncedDetail": "Gbogbo ohun tó wà lórí fóònù yìí wà ní àwọsánmà.",
  "sync.badgeAria": "Ipò ìgbésókè: {label}. Tẹ fún àlàyé.",
  "sync.panelTitle": "Àlàyé ìgbésókè",
  "sync.panelCounts":
    "{waiting} ń dúró láti gbé sókè, {failed} nílò àbójútó. Gbogbo nǹkan wà ní ààbò lórí fóònù yìí.",
  "sync.itemWaiting": "{table} · ń dúró",
  "sync.itemFailed": "{table} · nílò àbójútó",
  "sync.tries_other": "ìgbìyànjú {count}",
  "sync.retryFailed": "Tún gbìyànjú àwọn tó nílò àbójútó",
  "sync.openDoctor": "Ṣí Sync Doctor (fún àwọn alábòójútó)",
  "sync.openDoctorShort": "Ṣí Sync Doctor",
  "sync.table.patients": "àwọn aláìsàn",
  "sync.table.visits": "àwọn àbẹ̀wò",
  "sync.table.immunizations": "abẹ́rẹ́ àjẹsára",
  "sync.table.guardians": "àwọn olùtọ́jú",
  "sync.table.reminders": "àwọn ìrántí",
  "sync.table.audit": "àkọsílẹ̀ iṣẹ́",
  "syncErr.limit":
    "Ń dúró de ìgbéga ètò. Àkọsílẹ̀ náà wà ní ààbò lórí fóònù yìí.",
  "syncErr.schema":
    "Ibi ìpamọ́ dátà ní àwọsánmà nílò àtúnṣe kí èyí tó lè gbé sókè. Sọ fún alábòójútó rẹ. Àkọsílẹ̀ náà wà ní ààbò lórí fóònù yìí.",
  "syncErr.bug":
    "Prima ní ìṣòro pẹ̀lú àkọsílẹ̀ yìí. Ó wà ní ààbò lórí fóònù yìí. Sọ fún àwọn olùrànlọ́wọ́.",
  "syncErr.permission":
    "Àwọsánmà kò gba àkọsílẹ̀ yìí láyè. Ó wà ní ààbò lórí fóònù yìí. Sọ fún alábòójútó rẹ.",
  "syncErr.network": "Kò sí ìsopọ̀ pẹ̀lú àwọsánmà. Yóò gbé ara rẹ̀ sókè.",
  "syncErr.auth": "Tún wọlé láti máa gbé sókè.",
  "syncErr.foreignKey": "Ń dúró kí àkọsílẹ̀ tó jọmọ́ rẹ̀ kọ́kọ́ gbé sókè.",
  "syncErr.other":
    "Àwọsánmà kò tíì gba àkọsílẹ̀ yìí. Ó ṣì wà ní ààbò lórí fóònù yìí. Tẹ Tún gbìyànjú.",
  "banner.seePlans": "Wo àwọn ètò",
  "banner.nothingLost": "Kò sí ohun tó sọnù.",
  "banner.askAdmin": "Sọ fún alábòójútó ilé ìwòsàn yín láti gbé ètò ga.",

  // ----- Low Battery Mode
  "power.title": "Ipò bátìrì kéré",
  "power.bannerOn":
    "Ipò bátìrì kéré ń ṣiṣẹ́. Gbogbo nǹkan wà ní ipamọ́ lórí fóònù yìí.",
  "power.waiting_other":
    "Àkọsílẹ̀ {count} ń dúró láti gbé sókè. A ti dá gbígbé sókè dúró.",
  "power.waitingNone":
    "Kò sí ohun tó ń dúró láti gbé sókè. A ti dá gbígbé sókè dúró.",
  "power.turnOff": "Pa á",
  "power.explain":
    "Nígbà tó bá ń ṣiṣẹ́, Prima yóò dá gbígbé sókè dúró lẹ́yìn ẹ̀rọ, yóò lo àwọ̀ dúdú, kò sì ní sí ìmúra. Gbogbo ohun tí o bá forúkọ sílẹ̀ ṣì ń wà ní ipamọ́ lórí fóònù lẹ́sẹ̀kẹsẹ̀. Gbígbé sókè ń dúró títí o fi tẹ Gbé sókè báyìí, fi fóònù sí iná, tàbí pa á.",
  "power.auto": "Fúnrarẹ̀",
  "power.autoHelp":
    "Ó ń tàn nígbà tí bátìrì bá jẹ́ 20%, ó sì ń kú nígbà tó bá dé 30%, tàbí nígbà tí a bá ń gba iná",
  "power.on": "Nígbà gbogbo",
  "power.onHelp": "Lo èyí nígbà tí o kò ní lè gba iná fún ìgbà pípẹ́",
  "power.off": "Pa",
  "power.offHelp": "Má jẹ́ kí ó tan ara rẹ̀",
  "power.batteryNow": "Bátìrì báyìí: {percent}%.",
  "power.batteryNowCharging": "Bátìrì báyìí: {percent}%, ń gba iná.",
  "power.isOn": "Ipò bátìrì kéré ń ṣiṣẹ́.",
  "power.isOff": "Ipò bátìrì kéré kò ṣiṣẹ́.",
  "power.unsupported":
    "Ẹ̀rọ aṣàwárí fóònù yìí kò fi bátìrì hàn, nítorí náà Fúnrarẹ̀ kò lè tan án. Lo Nígbà gbogbo nígbà tí bátìrì bá kéré.",
  "power.oledNote":
    "Àwọ̀ dúdú ń dín agbára kù díẹ̀ lórí fóònù tí ó ní ojú OLED nìkan. Ohun tó dín agbára kù jù ni ìmọ́lẹ̀ fóònù rẹ: sọ ọ́ di kékeré.",

  // ----- getting a new version of the app
  "update.ready": "Ẹ̀yà Prima tuntun ti ṣetán.",
  "update.help":
    "Parí ohunkóhun tí o ń fipamọ́ ná. Àwọn àkọsílẹ̀ rẹ ṣì wà lórí fóònù yìí.",
  "update.now": "Ṣe àtúnṣe báyìí",
  "update.offlineReady": "Prima ti ṣetán láti ṣiṣẹ́ láìsí íntánẹ́ẹ̀tì.",

  // ----- the Account page
  "account.title": "Àkáǹtì",
  "account.subtitle": "Ìwọ, ilé ìwòsàn rẹ àti ẹgbẹ́ rẹ.",
  "account.you": "Ìwọ",
  "account.roleAdmin": "Alábòójútó ilé ìwòsàn",
  "account.roleStaff": "Òṣìṣẹ́",
  "account.signOut": "Jáde",
  "account.signOutNote":
    "Jíjáde kò nílò íntánẹ́ẹ̀tì. Àwọn àkọsílẹ̀ wà lórí fóònù yìí, tí a fi pamọ́, títí ẹnìkan láti ilé ìwòsàn yìí yóò fi wọlé.",
  "account.facility": "Ilé ìwòsàn",
  "account.facilityLine": "{lga}, {state} · kóòdù {code}",
  "account.planOnServer": "Ètò lórí sáfà:",
  "account.planTestingNote":
    "Àyẹ̀wò ètò ti ohun èlò náà ṣì ń lo ìyípadà ìdánwò títí di ọjọ́ ètò.",
  "account.editDetails": "Ṣàtúnṣe àlàyé",
  "account.privacy": "Àṣírí",
  "account.readNotice": "Ka ìkéde àṣírí",
  "account.auditLink": "Àkọsílẹ̀ iṣẹ́ àti ìbéèrè dátà",
  "facility.editTitle": "Ṣàtúnṣe ilé ìwòsàn",
  "facility.codeNote":
    "Kóòdù ilé ìwòsàn kò ní yí padà, nítorí a ti tẹ̀ ẹ́ sórí káàdì.",
  "facility.name": "Orúkọ ilé ìwòsàn",
  "facility.lga": "LGA",
  "facility.state": "Ìpínlẹ̀",
  "facility.updated": "A ti ṣe àtúnṣe ilé ìwòsàn",
  "team.title": "Ẹgbẹ́",
  "team.askAdmin":
    "Bi alábòójútó ilé ìwòsàn yín láti fi kún tàbí yọ òṣìṣẹ́ kúrò.",
  "team.needInternet": "O nílò íntánẹ́ẹ̀tì láti ṣàkóso ẹgbẹ́.",
  "team.loading": "Ń gbé ẹgbẹ́ wá…",
  "team.count_other":
    "A ti lo àkáǹtì òṣìṣẹ́ {used} nínú {limit} lórí ètò {plan}.",
  "team.you": "(ìwọ)",
  "team.admin": "Alábòójútó",
  "team.staff": "Òṣìṣẹ́",
  "team.memberLine": "{email} · {role} · darapọ̀ ní {date}",
  "team.removeAria": "Yọ {name} kúrò",
  "team.createInvite": "Ṣẹ̀dá kóòdù ìpè",
  "team.unusedInvites": "Àwọn kóòdù ìpè tí a kò tíì lò",
  "team.expires": "yóò parí ní {date}",
  "team.inviteCancelled": "A ti fagilé ìpè náà",
  "team.removeTitle": "Yọ {name} kúrò?",
  "team.removeMessage":
    "Wọn yóò pàdánù àyè sí àwọn àkọsílẹ̀ ilé ìwòsàn yìí. A ó tì fóònù wọn nígbà míràn tí ó bá lọ sórí íntánẹ́ẹ̀tì. O lè tún pè wọ́n lẹ́yìn náà.",
  "team.remove": "Yọ kúrò",
  "team.removed": "A ti yọ {name} kúrò",
  "invite.title": "Kóòdù ìpè",
  "invite.help":
    "Fún alábàáṣiṣẹ́ rẹ ní kóòdù yìí. Ó ṣiṣẹ́ lẹ́ẹ̀kan, yóò sì parí ní ọjọ́ 7.",
  "invite.copy": "Ṣe àdàkọ",
  "invite.codeCopied": "A ti ṣe àdàkọ kóòdù náà",
  "invite.whatsapp": "Pín lórí WhatsApp",

  // ----- the patient page, and the edit and new-visit pages
  "common.undo": "Dá padà",
  "common.edit": "Ṣàtúnṣe",
  "common.delete": "Parẹ́",
  "common.yes": "Bẹ́ẹ̀ni",
  "common.no": "Rárá",
  "common.changesSaved": "A ti fi àwọn àyípadà pamọ́",
  "patient.title": "Aláìsàn",
  "patient.notFound": "A kò rí aláìsàn náà",
  "patient.backToPatients": "Padà sí àwọn aláìsàn",
  "patient.deleteTitle": "Parẹ́ {name}?",
  "patient.deleteMessage":
    "A ó yọ wọ́n kúrò nínú àwọn àtòkọ àti lórí gbogbo ẹ̀rọ. O lè dá a padà lẹ́sẹ̀kẹsẹ̀.",
  "patient.deleteLabel": "Parẹ́ aláìsàn",
  "patient.visitDeleteTitle": "Parẹ́ àbẹ̀wò yìí?",
  "patient.visitDeleteMessage":
    "A ó yọ àbẹ̀wò náà kúrò nínú ìtàn aláìsàn yìí. O lè dá a padà lẹ́sẹ̀kẹsẹ̀.",
  "patient.visitDeleteLabel": "Parẹ́ àbẹ̀wò",
  "patient.vaccineDeleteTitle": "Parẹ́ àkọsílẹ̀ abẹ́rẹ́ àjẹsára yìí?",
  "patient.vaccineDeleteMessage":
    "A ó yọ àkọsílẹ̀ náà kúrò. O lè dá a padà lẹ́sẹ̀kẹsẹ̀.",
  "patient.vaccineDeleteLabel": "Parẹ́ àkọsílẹ̀",
  "patient.deleted": "A ti parẹ́ {name}",
  "patient.visitDeleted": "A ti parẹ́ àbẹ̀wò",
  "patient.vaccineDeleted": "A ti parẹ́ àkọsílẹ̀ abẹ́rẹ́ àjẹsára",
  "patient.ageEstimated": "{age} (àfojúdá)",
  "patient.followUp": "Àbẹ̀wò àtẹ̀lé {date}",
  "patient.followUpOverdue": "Àbẹ̀wò àtẹ̀lé {date} (ti kọjá àkókò)",
  "patient.firstReason": "Ìdí ìforúkọsílẹ̀ àkọ́kọ́",
  "patient.addVisit": "Fi àbẹ̀wò kún",
  "patient.visitsTitle": "Àwọn àbẹ̀wò ({count})",
  "patient.noVisits": "A kò tíì ṣe àkọsílẹ̀ àbẹ̀wò kankan",
  "patient.noVisitsHelp":
    "Lo “Fi àbẹ̀wò kún” láti ṣe àkọsílẹ̀ àwọn ìṣòro, àwọn ìwọ̀n ara àti àyẹ̀wò àrùn.",
  "patient.cardPersonal": "Ti ara ẹni",
  "patient.address": "Àdírẹ́sì",
  "patient.cardMedical": "Ìlera",
  "patient.obstetric": "Oyún àti ìbí",
  "patient.gender": "Ọkùnrin tàbí obìnrin",
  "patient.phone": "Fóònù",
  "patient.registered": "A forúkọ sílẹ̀",
  "patient.village": "Abúlé",
  "patient.kinName": "Orúkọ",
  "patient.nhis": "Nọ́mbà NHIS",
  "patient.bloodGroup": "Ẹ̀yà ẹ̀jẹ̀",
  "patient.allergies": "Àlẹ́jì",
  "patient.pregnant": "Lóyún",
  "patient.immunizations": "Abẹ́rẹ́ àjẹsára",
  "patient.addVaccine": "Fi abẹ́rẹ́ àjẹsára kún",
  "patient.noVaccines": "A kò tíì ṣe àkọsílẹ̀ abẹ́rẹ́ àjẹsára kankan.",
  "patient.vaccineDose": "{name} · ìwọ̀n {dose}",
  "patient.vaccineGiven": "A fún ní {date}",
  "patient.vaccineDue": "{label} yóò tó ní {date}",
  "patient.vaccineDueOverdue": "{label} yóò tó ní {date} (ti kọjá àkókò)",
  "patient.nextDose": "Ìwọ̀n tó kàn",
  "patient.vaccineDeleteAria": "Parẹ́ {name} ìwọ̀n {dose}",
  "patient.editTitle": "Ṣàtúnṣe aláìsàn",
  "patient.editPageTitle": "Ṣàtúnṣe · {name}",
  "patient.cardFixed": "A kò lè yí nọ́mbà káàdì {card} padà.",
  "visit.newTitle": "Àbẹ̀wò tuntun",
  "visit.newPageTitle": "Àbẹ̀wò tuntun · {name}",

  // ----- the full registration form
  "form.newAdmission": "Ìgbàlejò tuntun? (àbẹ̀wò àkọ́kọ́ nítorí ìṣòro kan)",
  "form.chiefComplaint": "Ìṣòro pàtàkì",
  "form.complaintExample": "bí àpẹẹrẹ fever àti cough fún ọjọ́ 3",
  "form.ageLine": "Ó jẹ́ {age}",
  "form.villageTown": "Abúlé / Ìlú",
  "form.medicalOptional": "Ìlera (kò pọn dandan)",
  "form.notKnown": "A kò mọ̀",
  "form.allergies": "Àlẹ́jì tí a mọ̀",
  "form.allergyExample": "bí àpẹẹrẹ Penicillin",
  "form.obstetric": "Ìtàn oyún àti ìbí",
  "form.currentlyPregnant": "Ó lóyún lọ́wọ́lọ́wọ́",
  "form.guardianTitle": "Olùtọ́jú (kò pọn dandan)",
  "form.guardianHelp":
    "Fífi olùtọ́jú kún ń jẹ́ kí Prima pe ẹni tó yẹ fún abẹ́rẹ́ àjẹsára àti àbẹ̀wò àtẹ̀lé. Wá a ná: ìyá tó ní ọmọ púpọ̀ jẹ́ olùtọ́jú kan.",
  "form.noticeText":
    "Mo ti sọ fún aláìsàn (tàbí olùtọ́jú rẹ̀) bí a ṣe máa lo ìsọfúnni rẹ̀, àti pé ó lè béèrè láti rí i, ṣàtúnṣe rẹ̀ tàbí yọ ọ́ kúrò. Bí èyí kò bá ṣeé ṣe báyìí, fi àpótí náà sílẹ̀ láìfi àmì sí i, kí o sì ṣe àkọsílẹ̀ rẹ̀ lẹ́yìn náà láti ojú-ìwé aláìsàn.",
  "form.dupExact":
    "Ṣé ó ti forúkọ sílẹ̀ tẹ́lẹ̀? {name} ({card}) ní orúkọ, ọjọ́ ìbí àti abúlé kan náà.",
  "form.dupSimilar": "Àwọn orúkọ tó jọra pẹ̀lú ọjọ́ ìbí kan náà:",
  "form.dupMatch": "{name} · {card} · ìjọra {score}%",
  "form.leaveConfirm": "Jáde láìforúkọ aláìsàn yìí sílẹ̀?",
  "form.saveChanges": "Fi àwọn àyípadà pamọ́",

  // ----- shared pieces and relationships
  "common.close": "Ti",
  "badge.under5": "Lábẹ́ ọdún 5",
  "rel.mother": "Ìyá",
  "rel.father": "Bàbá",
  "rel.grandparent": "Òbí àgbà",
  "rel.sibling": "Arákùnrin tàbí arábìnrin",
  "rel.auntUncle": "Àǹtí tàbí Ọ̀ǹklì",
  "rel.other": "Mìíràn",
  "rel.guardian": "Olùtọ́jú",

  // ----- guardians
  "guardian.title": "Olùtọ́jú",
  "guardian.editTitle": "Ṣàtúnṣe olùtọ́jú",
  "guardian.saved": "A ti fi olùtọ́jú pamọ́",
  "guardian.removed": "A ti yọ olùtọ́jú kúrò",
  "guardian.updated": "A ti ṣe àtúnṣe olùtọ́jú",
  "guardian.linkRemoved": "A ti yọ ìsopọ̀ olùtọ́jú kúrò",
  "guardian.saveFailed": "A kò lè fi olùtọ́jú pamọ́.",
  "guardian.editNote":
    "Àwọn àyípadà yóò kan gbogbo ọmọ tí a so mọ́ olùtọ́jú yìí.",
  "guardian.relationship": "Ìbáṣepọ̀",
  "guardian.relationshipTo": "Ìbáṣepọ̀ pẹ̀lú aláìsàn",
  "guardian.callAria": "Pe {name}",
  "guardian.noChildren": "A kò tíì so ọmọ kankan mọ́ ọn.",
  "guardian.new": "Olùtọ́jú tuntun",
  "guardian.backToSearch": "Padà sí ìwádìí",
  "guardian.useKin": "Lo ẹbí tó sún mọ́ jù: {name}",
  "guardian.alsoPatient": "Ṣé ẹni yìí náà jẹ́ aláìsàn níbí? (kò pọn dandan)",
  "guardian.searchPatient": "Wá orúkọ, fóònù tàbí nọ́mbà káàdì",
  "guardian.motherNote":
    "Sísopọ̀ àkọsílẹ̀ ìyá ń fi àwọn àbẹ̀wò oyún rẹ̀ hàn lórí ojú-ìwé ọmọ náà.",
  "guardian.notFound": "A kò rí olùtọ́jú náà. Tún yàn",
  "guardian.choose": "Yan olùtọ́jú mìíràn",
  "guardian.search": "Wá olùtọ́jú nípasẹ̀ fóònù tàbí orúkọ",
  "guardian.childCount_other": "ọmọ {count}",
  "guardian.addNew": "Fi olùtọ́jú tuntun kún",
  "guardian.errName": "Tẹ orúkọ olùtọ́jú.",
  "guardian.errPhone": "Tẹ nọ́mbà fóònù Nàìjíríà tó tọ́ fún olùtọ́jú.",
  "guardian.errSmsPhone": "Tẹ nọ́mbà fóònù olùtọ́jú láti fi ìrántí SMS ránṣẹ́.",
  "guardian.errSelf": "Ènìyàn kò lè jẹ́ olùtọ́jú ara rẹ̀.",

  // ----- the family section
  "family.mothersRecord": "Àkọsílẹ̀ ìyá: {name} · {card}",
  "family.anc": "Àwọn àbẹ̀wò oyún: {count}, tó kẹ́yìn {date}",
  "family.noAnc": "A kò tíì ṣe àkọsílẹ̀ àbẹ̀wò oyún kankan fún un.",
  "family.change": "Yí olùtọ́jú padà",
  "family.removeLink": "Yọ ìsopọ̀ kúrò",
  "family.none": "A kò tíì so olùtọ́jú mọ́ ọn",
  "family.noneHelp":
    "So olùtọ́jú mọ́ ọn kí àwọn ìrántí àti ìpè lè dé ọ̀dọ̀ ẹni tó yẹ.",
  "family.add": "Fi olùtọ́jú kún",
  "family.children": "Àwọn ọmọ ({count})",

  // ----- vaccines and diagnoses
  "vaccine.allRecorded":
    "A ti ṣe àkọsílẹ̀ gbogbo abẹ́rẹ́ àjẹsára tó wà nínú àtòkọ fún aláìsàn yìí.",
  "vaccine.label": "Abẹ́rẹ́ àjẹsára",
  "vaccine.dateGiven": "Ọjọ́ tí a fún",
  "vaccine.nextPreview": "Tó kàn: {label}, yóò tó ní {date}",
  "vaccine.save": "Fi abẹ́rẹ́ àjẹsára pamọ́",
  "vaccine.recorded": "A ti ṣe àkọsílẹ̀ {label}",
  "vaccine.errDate": "Tẹ ọjọ́ tí a fún",
  "vaccine.errFuture": "Ọjọ́ náà kò lè jẹ́ ọjọ́ iwájú",
  "vaccine.errBeforeBirth": "A kò lè fún abẹ́rẹ́ àjẹsára ṣáájú ọjọ́ ìbí",
  "vaccine.alreadyGiven": "Abẹ́rẹ́ àjẹsára tí a ti fún",
  "vaccine.tickHelp":
    "Fi àmì sí abẹ́rẹ́ àjẹsára kọ̀ọ̀kan tí ọmọ náà ti gbà, kí o sì ṣàyẹ̀wò ọjọ́.",
  "diagnosis.placeholder": "Kọ láti wá, bí àpẹẹrẹ malaria tàbí sugar",
  "diagnosis.clear": "Pa àyẹ̀wò àrùn rẹ́",
  "diagnosis.frequent": "Èyí tí a lò jù níbí",
  "diagnosis.codeSaved": "A ó fi kóòdù ICD-10 {code} pamọ́.",
  "diagnosis.sensitive":
    "Àyẹ̀wò àrùn tó ṣe pàtàkì. A fi sílẹ̀ nínú àwọn ìgbékalẹ̀ tí a pín àyàfi tí alábòójútó rẹ bá fi kún un.",
  "diagnosis.freeText": "A kò yan kóòdù. A ó fi pamọ́ gẹ́gẹ́ bí ọ̀rọ̀ lásán.",

  // ----- the visit form, visit card and edit-visit page
  "visit.title": "Àbẹ̀wò",
  "visit.date": "Ọjọ́ àbẹ̀wò",
  "visit.complaints": "Àwọn ìṣòro",
  "visit.prefilled": "A kọ ọ́ látinú ìforúkọsílẹ̀ àkọ́kọ́. Ṣàtúnṣe bó bá ṣe yẹ.",
  "visit.vitals": "Àwọn ìwọ̀n ara",
  "visit.bpTop": "Nọ́mbà òkè BP (systolic)",
  "visit.bpBottom": "Nọ́mbà ìsàlẹ̀ BP (diastolic)",
  "visit.temperature": "Ìgbóná ara",
  "visit.weight": "Ìwúwo",
  "visit.flagsNote":
    "Àwọn àmì wọ̀nyí jẹ́ ìtọ́ni, kì í ṣe àyẹ̀wò àrùn. Àwọn àmì BP kan àwọn aláìsàn tí wọ́n pé ọmọ ọdún 13 sókè.",
  "visit.assessment": "Àyẹ̀wò",
  "visit.diagnosis": "Àyẹ̀wò àrùn (kò pọn dandan)",
  "visit.treatment": "Ìtọ́jú / àkíyèsí (kò pọn dandan)",
  "visit.treatmentExample":
    "bí àpẹẹrẹ Artemether-lumefantrine, a gba níyànjú láti mu omi",
  "visit.followUpTitle": "Àbẹ̀wò àtẹ̀lé",
  "visit.nextDate": "Ọjọ́ àbẹ̀wò tó kàn (kò pọn dandan)",
  "visit.in3days": "Láàrin ọjọ́ 3",
  "visit.in1week": "Láàrin ọ̀sẹ̀ kan",
  "visit.in2weeks": "Láàrin ọ̀sẹ̀ méjì",
  "visit.in1month": "Láàrin oṣù kan",
  "visit.saved": "A ti fi àbẹ̀wò pamọ́",
  "visit.updated": "A ti ṣe àtúnṣe àbẹ̀wò",
  "visit.saveFailed": "A kò lè fi àbẹ̀wò yìí pamọ́. Jọ̀wọ́ tún gbìyànjú.",
  "visit.save": "Fi àbẹ̀wò pamọ́",
  "visit.leaveConfirm": "Jáde láìfi àbẹ̀wò yìí pamọ́?",
  "visit.editAria": "Ṣàtúnṣe àbẹ̀wò",
  "visit.editTitle": "Ṣàtúnṣe àbẹ̀wò",
  "visit.editPageTitle": "Ṣàtúnṣe àbẹ̀wò · {name}",
  "visit.notFound": "A kò rí àbẹ̀wò náà",
  "visit.backToPatient": "Padà sí aláìsàn",

  // ----- messages under boxes that come from the form rules
  "err.fieldRequired": "A nílò {label}",
  "err.fieldShort": "{label} kúrú jù",
  "err.fieldLong": "{label} gùn jù",
  "form.nokName": "Orúkọ ẹbí tó sún mọ́ jù",
  "err.tooLong": "Ó gùn jù",
  "err.enterNumber": "Tẹ nọ́mbà",
  "err.complaintShort": "Ṣàlàyé ìdí àbẹ̀wò náà (kò gbọdọ̀ dín ní lẹ́tà 3)",
  "err.smsChildren": "Fún àwọn ọmọdé, olùtọ́jú ni ó ń fún ní ìyọ̀ǹda SMS.",
  "err.smsPhone": "Tẹ nọ́mbà fóònù láti rí ìrántí SMS gbà.",
  "err.femaleOver12": "Fún àwọn aláìsàn obìnrin tó ju ọdún 12 lọ nìkan",
  "err.paraGravida": "Para kò lè ju gravida lọ",
  "err.vaccineDateMissing": "Tẹ ọjọ́ tí a fún {label}",
  "err.vaccineFuture": "Ọjọ́ {label} kò lè jẹ́ ọjọ́ iwájú",
  "err.vaccineBeforeBirth": "A kò lè fún {label} ṣáájú ọjọ́ ìbí",

  // ----- shared
  "common.loading": "Ń gbé wá…",

  // ----- the home page
  "home.goodMorning": "Ẹ kú àárọ̀",
  "home.goodAfternoon": "Ẹ kú ọ̀sán",
  "home.goodEvening": "Ẹ kú alẹ́",
  "home.find": "Wá aláìsàn",
  "home.totalPatients": "Àpapọ̀ àwọn aláìsàn",
  "home.registeredToday": "A forúkọ sílẹ̀ lónìí",
  "home.followUpsDue_other": "Àbẹ̀wò àtẹ̀lé {count} ń dúró",
  "home.followUpsHelp": "Èyí tó ti kọjá àkókò àti ọjọ́ 7 tó ń bọ̀",
  "home.welcome": "Káàbọ̀ sí Prima",
  "home.emptyHelp":
    "Ìwé orúkọ rẹ ṣófo. Forúkọ aláìsàn àkọ́kọ́ rẹ sílẹ̀. Ó ń ṣiṣẹ́ kódà láìsí nẹ́tíwọ́ọ̀kì.",
  "home.registerFirst": "Forúkọ aláìsàn àkọ́kọ́ sílẹ̀",
  "home.recent": "A forúkọ sílẹ̀ láìpẹ́ yìí",
  "home.viewAll": "Wo gbogbo rẹ̀",
  "home.footer":
    "Prima ń ṣiṣẹ́ láìsí nẹ́tíwọ́ọ̀kì. A ń fi àwọn àkọsílẹ̀ pamọ́ sórí ẹ̀rọ yìí, wọ́n sì ń gbé ara wọn sókè fúnra wọn.",

  // ----- the patients page and the list
  "patients.subtitle": "Wá nípasẹ̀ orúkọ, fóònù, NHIS tàbí nọ́mbà káàdì.",
  "patients.findDuplicates": "Wá àwọn tí a kọ lẹ́ẹ̀mejì",
  "patients.exportCsv": "Gbé CSV jáde",
  "patients.exportNeedsBasic": "Ìgbéjáde nílò ètò Basic",
  "patients.exportUpgradeText":
    "Gbé ètò ga sí Basic ({price} lóṣooṣù) láti gbà gbogbo àkọsílẹ̀ àwọn aláìsàn rẹ wálẹ̀ gẹ́gẹ́ bí CSV, àti ìròyìn LGA pẹ̀lú.",
  "list.search": "Wá orúkọ, fóònù, NHIS tàbí nọ́mbà káàdì",
  "list.none": "Kò sí aláìsàn kankan síbẹ̀",
  "list.noneHelp": "Forúkọ aláìsàn àkọ́kọ́ sílẹ̀, yóò sì fara hàn níbí.",
  "list.noMatch": "Kò sí aláìsàn tàbí olùtọ́jú tó bá “{search}” mu.",
  "list.guardians": "Àwọn olùtọ́jú",
  "list.count": "Aláìsàn {count} nínú {total}",
  "list.first100": "Ń fi 100 àkọ́kọ́ hàn. Wá láti dín in kù.",
  "limit.freePlan": "Ètò ọ̀fẹ́",
  "limit.usage": "Aláìsàn {used} / {limit}",
  "limit.spotsLeft_other": "Ààyè {count} ló kù.",
  "upgrade.notNow": "Kì í ṣe báyìí",

  // ----- the patient card and scanning
  "card.pageTitle": "Káàdì aláìsàn",
  "card.printHelp":
    "A ń tẹ̀ ẹ́ ní ìwọ̀n káàdì báńkì. Tẹ̀ ẹ́ sórí bébà káàdì, tàbí bébà lásán kí o sì gé e ní ìlà náà.",
  "card.unavailable": "Aláìsàn yìí kò sí.",
  "card.qrNote":
    "Kóòdù QR ní nọ́mbà káàdì nìkan nínú. Ẹnikẹ́ni tó bá rí káàdì náà kò lè ka àkọsílẹ̀ láti inú rẹ̀. Ṣàyẹ̀wò rẹ̀ nínú Prima pẹ̀lú Ṣàyẹ̀wò káàdì.",
  "card.number": "Nọ́mbà káàdì",
  "card.note":
    "Mú káàdì yìí wá sí gbogbo àbẹ̀wò. Jẹ́ kí ó gbẹ, kí ó sì wà ní ààbò.",
  "card.about": "Tó tó {age}",
  "card.born": "Ọjọ́ ìbí: {date}",
  "scan.title": "Ṣàyẹ̀wò káàdì",
  "scan.subtitle": "Darí kámẹ́rà sí kóòdù QR tó wà lórí káàdì aláìsàn.",
  "scan.notPrima": "Èyí kì í ṣe káàdì aláìsàn Prima.",
  "scan.notFound":
    "Kò sí aláìsàn tó ní káàdì {card} lórí fóònù yìí. Bí a bá forúkọ aláìsàn náà sílẹ̀ lórí fóònù mìíràn, dúró kí ó gbé sókè.",
  "scan.typeLabel": "Tàbí kọ nọ́mbà káàdì",
  "scan.open": "Ṣí aláìsàn",
  "scan.noCamera": "Kámẹ́rà kò sí.",
  "scan.denied":
    "Jẹ́ kí Prima lo kámẹ́rà nínú ètò ojú-ìwé aṣàwárí, lẹ́yìn náà ṣí ojú-ìwé yìí padà.",
  "scan.noDevice": "Ẹ̀rọ yìí kò ní kámẹ́rà tí a lè lò.",
  "scan.cameraError": "Kámẹ́rà kò lè bẹ̀rẹ̀.",
  "scan.typeInstead": "O lè kọ nọ́mbà káàdì sí ìsàlẹ̀ dípò rẹ̀.",
  "scan.starting": "Ń bẹ̀rẹ̀ kámẹ́rà…",
  "scan.qrAria": "Kóòdù QR pẹ̀lú nọ́mbà káàdì",

  // ----- readings, steppers and visit rules
  "vitals.veryHigh": "Ga gan-an",
  "vitals.high": "Ga",
  "vitals.highFever": "Ibà gíga",
  "vitals.fever": "Ibà",
  "vitals.low": "Kéré",
  "stepper.increase": "Mú {label} pọ̀ sí i",
  "stepper.decrease": "Mú {label} dín kù",
  "err.fieldNumber": "{label} gbọdọ̀ jẹ́ nọ́mbà",
  "err.fieldWhole": "{label} gbọdọ̀ jẹ́ nọ́mbà kíkún",
  "err.fieldLow": "{label} dà bí ẹni pé ó kéré jù",
  "err.fieldHigh": "{label} dà bí ẹni pé ó ga jù",
  "err.visitDateRequired": "Tẹ ọjọ́ àbẹ̀wò",
  "err.visitFuture": "Ọjọ́ àbẹ̀wò kò lè jẹ́ ọjọ́ iwájú",
  "err.visitBeforeBirth": "Àbẹ̀wò kò lè jẹ́ ṣáájú ọjọ́ ìbí",
  "err.under500": "Jẹ́ kí ó kéré sí lẹ́tà 500",
  "err.bothBp": "Tẹ àwọn nọ́mbà BP méjèèjì",
  "err.diaLower": "Diastolic gbọdọ̀ kéré sí systolic",
  "err.validDate": "Tẹ ọjọ́ tó tọ́",
  "err.followAfter": "Àbẹ̀wò àtẹ̀lé gbọdọ̀ jẹ́ lẹ́yìn ọjọ́ àbẹ̀wò",

  // ----- small shared pieces
  "glove.mode": "Ìgbà ìbọwọ́",
  "app.notFound": "A kò rí ojú-ìwé náà",
  "app.goHome": "Padà sílé",

  // ----- signing in and setting up a facility
  "auth.opening": "Ń ṣí Prima…",
  "auth.hidePassword": "Fi ọ̀rọ̀ aṣínà pamọ́",
  "auth.showPassword": "Fi ọ̀rọ̀ aṣínà hàn",
  "auth.tagline":
    "Àkọsílẹ̀ àwọn aláìsàn fún ilé ìwòsàn rẹ tó ń ṣiṣẹ́ láìsí nẹ́tíwọ́ọ̀kì.",
  "auth.signIn": "Wọlé",
  "auth.createAccount": "Ṣẹ̀dá àkáǹtì",
  "auth.yourName": "Orúkọ rẹ",
  "auth.email": "Ímeèlì",
  "auth.password": "Ọ̀rọ̀ aṣínà",
  "auth.passwordHint": "Kò gbọdọ̀ dín ní lẹ́tà 8.",
  "auth.wait": "Jọ̀wọ́ dúró…",
  "auth.needInternet":
    "O nílò íńtánẹ́ẹ̀tì láti wọlé. Lẹ́yìn náà, Prima á ṣí, á sì ṣiṣẹ́ láìsí nẹ́tíwọ́ọ̀kì.",
  "auth.errName": "Tẹ orúkọ rẹ.",
  "auth.errEmail": "Tẹ àdírẹ́sì ímeèlì tó tọ́.",
  "auth.errPassword": "Lo ọ̀rọ̀ aṣínà tí kò dín ní lẹ́tà 8.",
  "auth.setupTitle": "Ṣètò ilé ìwòsàn rẹ",
  "auth.signedInAs": "O ti wọlé gẹ́gẹ́ bí {email}",
  "auth.createFacility": "Ṣẹ̀dá ilé ìwòsàn",
  "auth.joinWithCode": "Darapọ̀ pẹ̀lú kóòdù",
  "auth.adminNote":
    "O máa di alábòójútó ilé ìwòsàn náà, o sì lè pe àwọn òṣìṣẹ́ rẹ.",
  "auth.facilityName": "Orúkọ ilé ìwòsàn",
  "auth.facilityCode": "Kóòdù ilé ìwòsàn",
  "auth.facilityCodeHint":
    "Lẹ́tà 2 sí 5. Ó máa ń bẹ̀rẹ̀ gbogbo nọ́mbà káàdì, bíi ANK-7K3F9Q.",
  "auth.createFacilityBtn": "Ṣẹ̀dá ilé ìwòsàn",
  "auth.joinHelp":
    "Béèrè kóòdù ìpè lọ́wọ́ alábòójútó ilé ìwòsàn rẹ. Kóòdù kọ̀ọ̀kan ń ṣiṣẹ́ lẹ́ẹ̀kan péré.",
  "auth.inviteCode": "Kóòdù ìpè",
  "auth.joinFacility": "Darapọ̀ mọ́ ilé ìwòsàn",
  "auth.differentAccount": "Lo àkáǹtì mìíràn",
  "auth.errFacilityName": "Tẹ orúkọ ilé ìwòsàn.",
  "auth.errFacilityCode":
    "Kóòdù ilé ìwòsàn gbọdọ̀ jẹ́ lẹ́tà 2 sí 5, bí àpẹẹrẹ ANK.",
  "auth.errLgaState": "Tẹ LGA àti ìpínlẹ̀.",
  "auth.errInvite": "Tẹ kóòdù ìpè tí a fún ọ.",
  "auth.endedTitle": "Àyè rẹ ti parí",
  "auth.endedBody":
    "O kò sí lára {name} mọ́, nítorí náà a kò lè ṣí àwọn àkọsílẹ̀ aláìsàn rẹ̀ lórí fóònù yìí. Pa ẹ̀dà fóònù yìí rẹ́ kí o sì jáde láti dáàbò bo àṣírí àwọn aláìsàn.",
  "auth.eraseSignOut": "Pa fóònù yìí rẹ́ kí o sì jáde",
  "auth.checkAgain": "Tún ṣàyẹ̀wò (mo rò pé àṣìṣe ni èyí)",
  "auth.foreignTitle": "Fóònù yìí ní àkọsílẹ̀ ilé ìwòsàn mìíràn",
  "auth.foreignBody":
    "A fi àkọsílẹ̀ láti ilé ìwòsàn mìíràn pamọ́ sórí fóònù yìí. Wọ́n gbọdọ̀ parẹ́ kí o tó tẹ̀síwájú, kí àwọn aláìsàn ilé ìwòsàn méjèèjì má baà dàpọ̀.",
  "auth.unsynced_other":
    "Àyípadà {count} kò tíì gbéra sókè, yóò sì parẹ́. Wọlé sí ilé ìwòsàn kejì ná tí ó bá ṣe pàtàkì.",
  "auth.eraseContinue": "Pa rẹ́ kí o tẹ̀síwájú",
  "auth.signInAgain": "Tún wọlé",
  "auth.reauthHelp":
    "Àwọn àkọsílẹ̀ rẹ wà ní ààbò lórí fóònù yìí. Tún wọlé yóò jẹ́ kí wọ́n gbé ara wọn sókè.",
  "authErr.wrongLogin": "Ímeèlì tàbí ọ̀rọ̀ aṣínà kò tọ́.",
  "authErr.exists": "Ímeèlì yìí ti ní àkáǹtì tẹ́lẹ̀. Gbìyànjú láti wọlé.",
  "authErr.network": "Kò sí íńtánẹ́ẹ̀tì. O nílò ìsopọ̀ fún ìgbésẹ̀ yìí.",
  "authErr.rate": "Ìgbìyànjú pọ̀ jù. Dúró fún ìṣẹ́jú díẹ̀ kí o tún gbìyànjú.",
  "authErr.generic": "Nǹkan kan ṣẹlẹ̀ tí kò tọ́.",

  // ----- PIN, lock screen and security
  "lock.choose": "Yan PIN oní nọ́mbà 6",
  "lock.repeat": "Tún PIN náà tẹ̀",
  "lock.differ": "Àwọn PIN méjèèjì kò jọra. Bẹ̀rẹ̀ lẹ́ẹ̀kan sí i.",
  "lock.protectTitle": "Dáàbò bo fóònù yìí",
  "lock.protectSub":
    "Wàá tẹ PIN yìí nígbàkúùgbà tí Prima bá ṣí tàbí tí ó bá tì.",
  "lock.protectNote":
    "PIN ń dènà àwọn tó ń yọjú lásán. Jẹ́ kí ìdènà ojú-ìwé fóònù rẹ náà wà ní títàn.",
  "lock.locked": "Prima ti tì",
  "lock.tooMany": "PIN tí kò tọ́ pọ̀ jù.",
  "lock.wrong": "PIN kò tọ́.",
  "lock.resetMsg":
    "PIN tí kò tọ́ pọ̀ jù. Wọlé pẹ̀lú ọ̀rọ̀ aṣínà rẹ láti ṣètò tuntun.",
  "lock.wait_other": "Ìgbìyànjú tí kò tọ́ pọ̀ jù. Dúró fún ìṣẹ́jú-àáyá {count}.",
  "lock.forgot": "O gbàgbé PIN? Wọlé pẹ̀lú ọ̀rọ̀ aṣínà rẹ",
  "lock.newPinTitle": "Ṣètò PIN tuntun",
  "lock.forgotHelp":
    "Tẹ ọ̀rọ̀ aṣínà àkáǹtì rẹ láti fi hàn pé ìwọ ni. O nílò íńtánẹ́ẹ̀tì fún èyí.",
  "lock.continue": "Tẹ̀síwájú",
  "lock.enterCurrent": "Tẹ PIN rẹ lọ́wọ́lọ́wọ́",
  "security.title": "Ààbò",
  "security.lockNow": "Tì báyìí",
  "security.changePin": "Yí PIN padà",
  "security.autoLock": "Tì fúnra rẹ̀ lẹ́yìn",
  "security.minutes_other": "ìṣẹ́jú {count} láìlò ó",
  "security.note":
    "PIN ń dènà àwọn tó ń yọjú lásán. Ìdè ni, kì í ṣe àpótí ààbò: jẹ́ kí ìdènà ojú-ìwé fóònù rẹ náà wà ní títàn, kí o sì sọ fún alábòójútó rẹ lẹ́sẹ̀kẹsẹ̀ bí fóònù bá sọnù.",
  "session.reauth":
    "Tún wọlé kí ìgbéra-sókè lè máa tẹ̀síwájú. Àwọn àkọsílẹ̀ rẹ wà ní ààbò lórí fóònù yìí.",
  "session.offline":
    "O kò sí lórí íńtánẹ́ẹ̀tì. Prima ń ṣiṣẹ́ bí ó ti yẹ yóò sì gbé ara rẹ̀ sókè nígbà tí o bá tún wọlé lórí íńtánẹ́ẹ̀tì.",

  // ----- the dashboard and follow-ups
  "dash.noData": "Kò sí dátà síbẹ̀",
  "dash.noDataHelp":
    "Forúkọ àwọn aláìsàn sílẹ̀, pẹpẹ ìṣàkóso yóò sì kún fúnra rẹ̀.",
  "dash.prevMonth": "Oṣù tó kọjá",
  "dash.nextMonth": "Oṣù tó kàn",
  "dash.newMonth": "Tuntun ní oṣù yìí",
  "dash.visitsMonth": "Àwọn àbẹ̀wò ní oṣù yìí",
  "dash.followUps7": "Àbẹ̀wò àtẹ̀lé tó ń dúró (ọjọ́ 7)",
  "dash.smsQueued": "Ìrántí SMS tó ń dúró",
  "dash.reachable": "Àwọn tí a lè dé nípasẹ̀ SMS",
  "dash.ageGroups": "Àwọn ẹgbẹ́ ọjọ́-orí",
  "dash.activity": "Iṣẹ́ ní ojoojúmọ́",
  "dash.topDiagnoses": "Àwọn àyẹ̀wò àrùn tó pọ̀ jù ní oṣù yìí",
  "dash.topVillages": "Àwọn abúlé tó pọ̀ jù (gbogbo aláìsàn)",
  "dash.noActivity": "Kò sí ìforúkọsílẹ̀ tàbí àbẹ̀wò ní oṣù yìí.",
  "dash.noDiagnoses": "A kò ṣe àkọsílẹ̀ àyẹ̀wò àrùn kankan ní oṣù yìí.",
  "dash.registrations": "Ìforúkọsílẹ̀",
  "dash.visits": "Àwọn àbẹ̀wò",
  "dash.devStats": "A ṣírò àwọn ìṣirò lórí ẹ̀rọ yìí láàrin {ms} ms",
  "dash.tabOverview": "Àkópọ̀",
  "dash.tabFollowUps": "Àbẹ̀wò àtẹ̀lé",
  "dash.tabReminders": "Ìrántí",
  "dash.tabReport": "Ìròyìn LGA",
  "dash.subtitle": "Ilé ìwòsàn rẹ ní àkópọ̀, a ṣírò rẹ̀ lórí ẹ̀rọ yìí.",
  "fu.overdueBy_other": "Ó ti kọjá àkókò fún ọjọ́ {count}",
  "fu.dueToday": "Ó tó lónìí",
  "fu.dueIn_other": "Ó tó láàrin ọjọ́ {count} · {date}",
  "fu.days": "Ọjọ́ {count}",
  "fu.callAbout": "Pe nípa {name}",
  "fu.overdue": "Ti kọjá àkókò",
  "fu.comingUp": "Tó ń bọ̀",
  "fu.count_other": "Àbẹ̀wò àtẹ̀lé {count}",
  "fu.summary": "{overdue} ti kọjá àkókò · {today} lónìí · {upcoming} tó ń bọ̀",
  "fu.allCaughtUp": "Gbogbo rẹ̀ ti tán",
  "fu.nothing":
    "Kò sí ohun tó ti kọjá àkókò tàbí tó tó láàrin ọjọ́ {days} tó ń bọ̀.",
  "fu.upgradeTitle": "Wo ẹni tó tó, kí o sì pè wọ́n",
  "fu.upgradeText":
    "Ètò Pro ń ṣe àtòjọ gbogbo aláìsàn tó ní àbẹ̀wò àtẹ̀lé tàbí abẹ́rẹ́ àjẹsára tó ti kọjá àkókò tàbí tó ń bọ̀, pẹ̀lú ìfọwọ́kan kan láti pe aláìsàn tàbí olùtọ́jú.",

  // ----- the Devices tab
  "dev.tab": "Àwọn ẹ̀rọ",
  "dev.title": "Àwọn fóònù àti tábìlẹ́ẹ̀tì",
  "dev.help":
    "Gbogbo fóònù tàbí tábìlẹ́ẹ̀tì tó ń lo ilé ìwòsàn yìí ń ròyìn bí ìgbéra-sókè rẹ̀ ṣe ń lọ. Nọ́mbà àti àkókò nìkan ni a ń fi ránṣẹ́, kì í ṣe ìwífún aláìsàn.",
  "dev.refresh": "Tún gbé wá",
  "dev.refreshing": "Ń tún gbé wá…",
  "dev.updated": "A ṣe àtúnṣe {span} sẹ́yìn",
  "dev.updatedNow": "A ṣe àtúnṣe ní àìpẹ́ yìí",
  "dev.sumDevices": "Àwọn ẹ̀rọ",
  "dev.ok": "Tó wà lọ́jọ́",
  "dev.sumWarn": "Tó ń lẹ́yìn tàbí tó ń dúró",
  "dev.sumBad": "Nílò àbójútó",
  "dev.sumWaiting": "Àwọn àkọsílẹ̀ tó ń dúró",
  "dev.thisDevice": "Ẹ̀rọ yìí",
  "dev.lastSeen": "Ìbáraẹnisọ̀rọ̀ kẹ́yìn: {span} sẹ́yìn",
  "dev.lastSeenNow": "Ìbáraẹnisọ̀rọ̀ kẹ́yìn: ní àìpẹ́ yìí",
  "dev.lastSync": "Ìgbéra-sókè kẹ́yìn tó yọrí: {span} sẹ́yìn",
  "dev.lastSyncNever": "A kò tíì ròyìn ìgbéra-sókè tó yọrí",
  "dev.waitingNone": "Kò sí ohun tó ń dúró láti gbé sókè",
  "dev.usedBy": "Ẹni tó lò ó kẹ́yìn: {name}",
  "dev.version": "Ẹ̀dà {build}",
  "dev.battery": "Bátìrì {percent}%",
  "dev.batteryCharging": "Bátìrì {percent}%, ń gba iná",
  "dev.flag.failed_other": "Àkọsílẹ̀ {count} nílò àbójútó",
  "dev.flag.unseen": "A kò rí i fún {span}",
  "dev.flag.stuck_other": "Àkọsílẹ̀ {count} ti dúró fún {span} láti gbé sókè",
  "dev.flag.behind_other": "Àkọsílẹ̀ tuntun {count} kò tíì wálẹ̀",
  "dev.flag.behindMany": "Ọ̀pọ̀lọpọ̀ àkọsílẹ̀ tuntun kò tíì wálẹ̀",
  "dev.flag.never": "Kò tíì gbà nǹkan kan wálẹ̀",
  "dev.flag.clock":
    "Aago ẹ̀rọ yìí kò tọ́ ní {span}. Ṣètò ọjọ́ àti àkókò lórí fóònù náà.",
  "dev.flag.oldApp": "Ẹ̀dà Prima àtijọ́. Ṣí i pẹ̀lú íńtánẹ́ẹ̀tì láti ṣe àtúnṣe.",
  "dev.flag.lowBattery": "Bátìrì ti kéré ({percent}%)",
  "dev.flag.powerSaving":
    "Ipò bátìrì kéré wà ní títàn, nítorí náà ó ń gbé sókè nígbà tí ẹnìkan bá ṣe é fúnra rẹ̀ nìkan.",
  "dev.span.minutes_other": "ìṣẹ́jú {count}",
  "dev.span.hours_other": "wákàtí {count}",
  "dev.span.days_other": "ọjọ́ {count}",
  "dev.rename": "Fún lórúkọ mìíràn",
  "dev.renameTitle": "Fún ẹ̀rọ yìí lórúkọ",
  "dev.renameHelp":
    "Lo orúkọ tí àwọn ènìyàn yóò mọ̀, bíi “Tábìlẹ́ẹ̀tì ibi ìgbàlejò”. Fi í sílẹ̀ ní òfo láti lo orúkọ àdánidá.",
  "dev.renameField": "Orúkọ ẹ̀rọ",
  "dev.renamed": "A ti fi orúkọ pamọ́",
  "dev.remove": "Yọ kúrò nínú àtòkọ",
  "dev.removeTitle": "Yọ {name} kúrò nínú àtòkọ?",
  "dev.removeText":
    "A kò pa nǹkan kan rẹ́ lórí ẹ̀rọ náà tàbí nínú àkọsílẹ̀ aláìsàn kankan. Bí a bá tún lo ẹ̀rọ náà, yóò tún fara hàn.",
  "dev.removed": "A ti yọ {name} kúrò",
  "dev.none":
    "Kò sí ẹ̀rọ mìíràn tó tíì ròyìn. Ṣí Prima lórí fóònù mìíràn, yóò sì fara hàn níbí láàrin ìṣẹ́jú díẹ̀.",
  "dev.offline":
    "O nílò íńtánẹ́ẹ̀tì láti rí àwọn ẹ̀rọ yòókù. Ẹ̀rọ yìí nìkan ni a fi hàn.",
  "dev.setup":
    "Ibi ìpamọ́ dátà àwọsánmà nílò àtúnṣe Ọjọ́ 23 kí a tó lè ṣe àtòkọ àwọn ẹ̀rọ. Bi ẹni tó ń bójútó iṣẹ́ Supabase láti ṣe supabase/day23.sql.",
  "dev.signin": "Tún wọlé láti rí àwọn ẹ̀rọ náà.",
  "dev.failed": "A kò lè gbé àwọn ẹ̀rọ náà wá. Gbìyànjú lẹ́ẹ̀kan sí i.",
  "dev.forbidden": "Alábòójútó ilé ìwòsàn nìkan ló lè rí àwọn ẹ̀rọ náà.",

  // ----- the Nearby phones tab
  "near.tab": "Fóònù tó wà nítòsí",
  "near.title": "Pààrọ̀ àkọsílẹ̀ pẹ̀lú fóònù tó wà nítòsí",
  "near.help":
    "A kò nílò íńtánẹ́ẹ̀tì. Fóònù méjì ti ilé ìwòsàn yìí, tó wà nítòsí ara wọn lórí Wi-Fi kan náà, ń pààrọ̀ àwọn àkọsílẹ̀ tí èkejì kò ní. Fóònù tó ní íńtánẹ́ẹ̀tì yóò gbé gbogbo rẹ̀ sókè sí àwọsánmà.",
  "near.safe":
    "Àwọn fóònù ilé ìwòsàn yìí nìkan ló lè darapọ̀. Àwọn àkọsílẹ̀ náà wà lórí Wi-Fi ilé ìwòsàn, ìgbésẹ̀ yìí kò sì fi wọ́n ránṣẹ́ sí íńtánẹ́ẹ̀tì.",
  "near.hostBtn": "Fi kóòdù mi hàn",
  "near.hostHelp": "Yan èyí lórí fóònù àkọ́kọ́.",
  "near.guestBtn": "Ṣàyẹ̀wò kóòdù wọn",
  "near.guestHelp": "Yan èyí lórí fóònù kejì.",
  "near.step": "Ìgbésẹ̀ {step} nínú 2",
  "near.hostShow": "Jẹ́ kí fóònù èkejì ṣàyẹ̀wò kóòdù yìí",
  "near.hostNext": "Wọ́n ti ṣàyẹ̀wò rẹ̀. Báyìí ṣàyẹ̀wò kóòdù wọn",
  "near.hostScan": "Ṣàyẹ̀wò kóòdù tó wà lórí fóònù èkejì",
  "near.guestScan": "Ṣàyẹ̀wò kóòdù tó wà lórí fóònù àkọ́kọ́",
  "near.guestShow": "Báyìí jẹ́ kí fóònù àkọ́kọ́ ṣàyẹ̀wò kóòdù yìí",
  "near.guestWait": "Ń dúró de fóònù àkọ́kọ́ láti ṣàyẹ̀wò kóòdù yìí…",
  "near.connecting": "Ń so àwọn fóònù méjèèjì pọ̀…",
  "near.compare": "Ń fi àwọn àkọsílẹ̀ wéra…",
  "near.progress": "A ti fi {sent} ránṣẹ́, a gbà {received}",
  "near.keepClose":
    "Jẹ́ kí àwọn fóònù méjèèjì ṣí sílẹ̀ kí wọ́n sì wà nítòsí ara wọn títí yóò fi sọ pé A ti parí.",
  "near.done": "A ti parí",
  "near.doneSummary":
    "A fi {sent} ránṣẹ́, a sì gba àkọsílẹ̀ {received} pẹ̀lú {name}.",
  "near.doneSame": "Àwọn fóònù méjèèjì ti ní àkọsílẹ̀ kan náà.",
  "near.doneUpload_other": "Àkọsílẹ̀ {count} ń dúró láti gbé sókè sí àwọsánmà.",
  "near.again": "Pààrọ̀ lẹ́ẹ̀kan sí i",
  "near.noCamera": "Kò sí kámẹ́rà? Ṣe àdàkọ tàbí lẹ̀ kóòdù náà dípò rẹ̀",
  "near.copy": "Ṣe àdàkọ kóòdù",
  "near.copied": "A ti ṣe àdàkọ kóòdù",
  "near.paste": "Lẹ̀ kóòdù fóònù èkejì síbí",
  "near.use": "Lo kóòdù yìí",
  "near.keyMissing":
    "Fóònù yìí kò tíì gba kọ́kọ́rọ́ ilé ìwòsàn. So ó pọ̀ mọ́ íńtánẹ́ẹ̀tì lẹ́ẹ̀kan, kí o sì padà wá.",
  "near.keyGet": "Gba kọ́kọ́rọ́ báyìí",
  "near.keyGetting": "Ń gba kọ́kọ́rọ́…",
  "near.keyGot": "A ti gba kọ́kọ́rọ́ ilé ìwòsàn. O lè bẹ̀rẹ̀ báyìí.",
  "near.keyOffline":
    "Kò sí íńtánẹ́ẹ̀tì lọ́wọ́lọ́wọ́. Tún gbìyànjú nígbà tí o bá wà lórí íńtánẹ́ẹ̀tì.",
  "near.keyFailed": "A kò lè gba kọ́kọ́rọ́. Tún gbìyànjú lẹ́yìn náà.",
  "near.err.version":
    "Àwọn fóònù méjèèjì ń lo ẹ̀dà Prima tó yàtọ̀. Ṣe àtúnṣe méjèèjì, kí o sì tún gbìyànjú.",
  "near.err.facility": "Kóòdù yẹn wá láti ilé ìwòsàn mìíràn.",
  "near.err.keyHere":
    "Kọ́kọ́rọ́ ilé ìwòsàn tó wà lórí fóònù yìí ti di àtijọ́. So ó pọ̀ mọ́ íńtánẹ́ẹ̀tì lẹ́ẹ̀kan, kí o sì tún gbìyànjú.",
  "near.err.keyThere":
    "Kọ́kọ́rọ́ ilé ìwòsàn tó wà lórí fóònù èkejì ti di àtijọ́. Ó nílò láti so pọ̀ mọ́ íńtánẹ́ẹ̀tì lẹ́ẹ̀kan.",
  "near.err.clock":
    "Aago àwọn fóònù méjèèjì yàtọ̀ síra ní ìṣẹ́jú {minutes}. Ṣètò ọjọ́ àti àkókò sí àdánidá lórí méjèèjì, kí o sì tún gbìyànjú.",
  "near.err.auth":
    "Àwọn fóònù náà kò lè fi hàn pé wọ́n jẹ́ ti ilé ìwòsàn kan náà. Tún gbìyànjú. Tó bá ń ṣẹlẹ̀ léraléra, sọ fún alábòójútó rẹ.",
  "near.err.protocol":
    "Nǹkan kan ṣẹlẹ̀ nígbà tí àwọn fóònù ń bá ara wọn sọ̀rọ̀. Kò sí ohun tó sọnù. Tún gbìyànjú.",
  "near.err.tooBig":
    "Fóònù èkejì fi ohun tó pọ̀ ju bí a ṣe retí lọ ránṣẹ́, nítorí náà a dá a dúró.",
  "near.err.closed":
    "Ìsopọ̀ já. Àwọn àkọsílẹ̀ tó ti dé wà ní ìpamọ́. Tún gbìyànjú láti parí rẹ̀.",
  "near.err.timeout":
    "Fóònù èkejì ti dáwọ́ ìdáhùn dúró. Àwọn àkọsílẹ̀ tó ti dé wà ní ìpamọ́. Tún gbìyànjú.",
  "near.err.cancelled": "A ti dá a dúró.",
  "near.err.link":
    "Àwọn fóònù náà kò lè dé ara wọn. Ṣàyẹ̀wò pé méjèèjì wà lórí Wi-Fi kan náà. Àwọn ẹ̀rọ Wi-Fi kan máa ń dá àwọn fóònù dúró láti bá ara wọn sọ̀rọ̀: gbìyànjú hotspot ti fóònù kan dípò rẹ̀.",
  "near.err.unsupported":
    "Ẹ̀rọ aṣàwákiri yìí kò lè so àwọn fóònù pọ̀ tààrà. Lo Chrome lórí Android.",
  "near.err.code":
    "Ìyẹn kì í ṣe kóòdù Prima. Ṣàyẹ̀wò kóòdù tó wà lórí fóònù èkejì.",

  // ----- live sharing, the book of phones, the changes file
  "near.live": "A ti so pọ̀ mọ́ {name}",
  "near.liveHelp":
    "A ń pín àwọn àyípadà lórí fóònù èyíkéyìí fúnra rẹ̀. Jẹ́ kí àwọn fóònù méjèèjì ṣí sílẹ̀ kí wọ́n sì wà nítòsí ara wọn, lórí ojú ìwé yìí.",
  "near.liveTotals":
    "A ti pín títí di báyìí: a fi {sent} ránṣẹ́, a gbà {received}",
  "near.liveBusy": "Ń pín…",
  "near.liveLast": "A yẹ̀ ẹ́ wò kẹ́yìn {span} sẹ́yìn",
  "near.liveLastNow": "A yẹ̀ ẹ́ wò kẹ́yìn ní àìpẹ́ yìí",
  "near.shareNow": "Pín báyìí",
  "near.disconnect": "Já ìsopọ̀",
  "near.ended.you": "O ti já ìsopọ̀.",
  "near.ended.them": "Fóònù èkejì ti já ìsopọ̀.",
  "near.ended.quiet": "A ti já ìsopọ̀ lẹ́yìn ìṣẹ́jú 30 tí kò sí ohun tí a ó pín.",
  "peers.title": "Àwọn fóònù tí o ti pààrọ̀ àkọsílẹ̀ pẹ̀lú wọn",
  "peers.none":
    "Kò tíì sí. Lẹ́yìn ìpààrọ̀ àkọ́kọ́ rẹ, a ó ṣe àtòkọ fóònù èkejì síbí.",
  "peers.note":
    "Ojú ìwé wẹ́ẹ̀bù kò lè wá àwọn fóònù lórí Wi-Fi, nítorí náà èyí ń ṣe àtòkọ àwọn fóònù tí o ti so pọ̀ nìkan. Láti tún pín, so wọ́n pọ̀ pẹ̀lú kóòdù méjèèjì.",
  "peers.last": "Ìpààrọ̀ kẹ́yìn {span} sẹ́yìn",
  "peers.lastNow": "Ìpààrọ̀ kẹ́yìn ní àìpẹ́ yìí",
  "peers.totals": "A fi {sent} ránṣẹ́, a sì gba {received} lápapọ̀",
  "peers.stale": "A kò tíì pààrọ̀ fún {span}. Tún so pọ̀ nígbà tí ẹ bá wà papọ̀.",
  "file.title": "Kò sí Wi-Fi? Fi fáìlì ránṣẹ́",
  "file.help":
    "Bí àwọn fóònù kò bá lè dé ara wọn, ṣe fáìlì àyípadà síbí, fi ránṣẹ́ sí fóònù èkejì (WhatsApp, Bluetooth, okùn), kí o sì ṣí i níbẹ̀. Àwọn fóònù ilé ìwòsàn yìí nìkan ló lè kà á.",
  "file.period": "Ẹ̀yìn tó tó báwo?",
  "file.p7": "Ọjọ́ 7 sẹ́yìn",
  "file.p30": "Ọjọ́ 30 sẹ́yìn",
  "file.pall": "Gbogbo rẹ̀",
  "file.make": "Ṣe kí o sì fi fáìlì ránṣẹ́",
  "file.making": "Ń ṣe fáìlì náà…",
  "file.open": "Ṣí fáìlì àyípadà",
  "file.opening": "Ń ṣí fáìlì náà…",
  "file.made_other": "Fáìlì ti ṣetán pẹ̀lú àkọsílẹ̀ {count}.",
  "file.madeDownload":
    "A ti fi pamọ́ sínú ohun tí a gbà wálẹ̀ lórí fóònù yìí. Fi ránṣẹ́ sí fóònù èkejì.",
  "file.imported":
    "A ti ṣí i. A fi kún {added}, a ṣe àtúnṣe {updated}, a fi sílẹ̀ {skipped}.",
  "file.importedNone":
    "Kò sí nǹkan tuntun: fóònù yìí ti ní gbogbo ohun tó wà nínú fáìlì náà.",
  "file.rejected_other": "A kò gba àkọsílẹ̀ {count} tó wà nínú fáìlì náà.",
  "file.err.notPrima": "Ìyẹn kì í ṣe fáìlì àyípadà Prima.",
  "file.err.tooBig": "Fáìlì náà tóbi jù.",
  "file.err.facility": "Fáìlì yẹn wá láti ilé ìwòsàn mìíràn.",
  "file.err.keyHere":
    "Kọ́kọ́rọ́ ilé ìwòsàn tó wà lórí fóònù yìí ti di àtijọ́. So ó pọ̀ mọ́ íńtánẹ́ẹ̀tì lẹ́ẹ̀kan, kí o sì tún ṣí fáìlì náà.",
  "file.err.keyThere":
    "A fi kọ́kọ́rọ́ ilé ìwòsàn àtijọ́ ṣe fáìlì náà. Sọ fún ẹni tó ṣe é kí ó so pọ̀ mọ́ íńtánẹ́ẹ̀tì lẹ́ẹ̀kan, kí ó sì ṣe fáìlì tuntun.",
  "file.err.corrupt":
    "A kò lè ṣí fáìlì náà. Ó lè ti bàjẹ́ lójú ọ̀nà. Béèrè fún ẹ̀dà tuntun.",
  "file.err.failed": "Nǹkan kan ṣẹlẹ̀. A kò yí nǹkan kan padà.",

  // ----- the plan and payment tab
  "bill.tab": "Ètò àti sísan owó",
  "bill.title": "Ètò rẹ",
  "bill.free": "Ọ̀fẹ́",
  "bill.basic": "Basic",
  "bill.pro": "Pro",
  "bill.s.free": "O wà lórí ètò ọ̀fẹ́, tó gba aláìsàn tó tó {limit}.",
  "bill.s.active_other": "A ti san owó títí di {date}. Ọjọ́ {count} ló kù.",
  "bill.s.renews": "Ó ń sọ ara rẹ̀ di tuntun fúnra rẹ̀ pẹ̀lú káàdì rẹ.",
  "bill.s.ends":
    "Kì yóò sọ ara rẹ̀ di tuntun fúnra rẹ̀. San owó lẹ́ẹ̀kan sí i kí {date} tó dé kí o lè tọ́jú rẹ̀.",
  "bill.s.pilot": "Ìfilọ́lẹ̀ ìdánwò: Pro jẹ́ ọ̀fẹ́ fún ọ títí di {date}.",
  "bill.s.pastDue":
    "Owó ìkẹyìn kò lọ. Ètò rẹ yóò wà títí di {date}. San báyìí kí o lè tọ́jú rẹ̀.",
  "bill.s.expired":
    "Ètò tí o san owó fún ti parí, o sì ti padà sí ọ̀fẹ́. Àwọn aláìsàn àti àkọsílẹ̀ rẹ wà ní ààbò.",
  "bill.verifying": "Ń ṣàyẹ̀wò owó tí o san…",
  "bill.paid": "A ti gba owó náà. O ṣé.",
  "bill.waiting":
    "Báńkì kò tíì jẹ́rìí sí i. Dúró ìṣẹ́jú kan, kí o sì tún yẹ̀ ẹ́ wò.",
  "bill.checkAgain": "Tún yẹ̀ ẹ́ wò",
  "bill.notPaid": "A kò parí sísan owó náà, nítorí náà ètò rẹ kò yí padà.",
  "bill.refused":
    "Owó wọlé, ṣùgbọ́n a kò lè so ó mọ́ ètò náà. A kò yí ètò rẹ padà. Jọ̀wọ́ kàn sí wa kí o sì fún wa ní nọ́mbà yìí: {reference}",
  "bill.choose": "Yan ètò",
  "bill.cycleMonthly": "Oṣooṣù",
  "bill.cycleAnnual": "Ọdọọdún",
  "bill.perMonth": "{price} lóṣù",
  "bill.perYear": "{price} lọ́dún",
  "bill.saving": "Oṣù méjì ní ọ̀fẹ́: o fi {amount} pamọ́ lọ́dún.",
  "bill.current": "Ètò rẹ lọ́wọ́lọ́wọ́",
  "bill.included": "Ohun tó wà nínú ètò kọ̀ọ̀kan",
  "bill.how": "Báwo ni o ṣe fẹ́ san owó?",
  "bill.once": "San lẹ́ẹ̀kan",
  "bill.onceHelp": "Kò sí àtúnṣe fúnra rẹ̀. O ó tún san nígbà tí àkókò bá parí.",
  "bill.auto": "Tún un ṣe fúnra rẹ̀",
  "bill.autoHelp":
    "A ó máa gba owó láti inú káàdì rẹ ní gbogbo ìgbà. O lè pa á ní àkókò èyíkéyìí.",
  "bill.pay": "San {amount} nípasẹ̀ Paystack",
  "bill.paying": "Ń ṣí Paystack…",
  "bill.upgradeNote":
    "Ìgbéga bẹ̀rẹ̀ lónìí. A fi àwọn ọjọ́ tí o kò lò ní ètò rẹ lọ́wọ́lọ́wọ́ kún un gẹ́gẹ́ bí ọjọ́ àfikún.",
  "bill.lowerBlocked":
    "O wà lórí Pro títí di {date}. Yan Pro láti fi àkókò kún un.",
  "bill.adminOnly":
    "Alábòójútó ilé ìwòsàn nìkan ló lè san owó. Bi alábòójútó rẹ.",
  "bill.offline":
    "O nílò íńtánẹ́ẹ̀tì láti san owó tàbí láti rí àwọn owó tí o ti san.",
  "bill.test":
    "Ipò ìdánwò: kò sí owó gidi tó ń lọ. Lo káàdì 4084 0840 8408 4081, ọjọ́ èyíkéyìí lọ́jọ́ iwájú, CVV 408. Tí a bá béèrè, PIN 408408 àti kóòdù 123456.",
  "bill.err.signin": "Tún wọlé láti tẹ̀síwájú.",
  "bill.err.paystack":
    "A kò lè dé Paystack. A kò gba owó kankan. Tún gbìyànjú láàrin ìṣẹ́jú kan.",
  "bill.err.server":
    "Nǹkan kan ṣẹlẹ̀ lápá wa. A kò gba owó kankan. Tún gbìyànjú.",
  "bill.err.noEmail":
    "Àkántì rẹ kò ní àdírẹ́sì ímeèlì. Fi ọ̀kan kún àkántì rẹ, kí o sì tún gbìyànjú.",
  "bill.err.noAuto": "Àtúnṣe fúnra rẹ̀ kò tíì wà. Yan San lẹ́ẹ̀kan.",
  "bill.err.misconfigured": "À ń ṣètò sísan owó. Jọ̀wọ́ tún gbìyànjú lẹ́yìn náà.",
  "bill.err.notAdmin": "Alábòójútó ilé ìwòsàn nìkan ló lè san owó.",
  "bill.err.failed": "Ìyẹn kò ṣiṣẹ́. A kò gba owó kankan. Tún gbìyànjú.",
  "bill.cancel": "Pa àtúnṣe fúnra rẹ̀",
  "bill.cancelTitle": "Pa àtúnṣe fúnra rẹ̀?",
  "bill.cancelText":
    "Ètò rẹ yóò wà títí di {date}. Lẹ́yìn èyí yóò parí àyàfi tí o bá tún san owó.",
  "bill.cancelled": "A ti pa àtúnṣe fúnra rẹ̀.",
  "bill.history": "Àwọn owó tí o ti san",
  "bill.noPayments": "Kò tíì sí owó tí o ti san.",
  "bill.st.success": "A ti san",
  "bill.st.pending": "Ń dúró",
  "bill.st.failed": "A kò parí",
  "bill.m.renewal": "Àtúnṣe fúnra rẹ̀",

  // ----- the crash screen
  "crash.title": "Nǹkan kan ṣẹlẹ̀ lórí ojú ìwé yìí",
  "crash.safe": "Àwọn àkọsílẹ̀ tí o ti fi pamọ́ wà ní ààbò lórí fóònù yìí.",
  "crash.unsaved":
    "Ó ṣeé ṣe kí a má tíì fi ohun tí ò ń kọ lórí ojú ìwé yìí pamọ́.",
  "crash.retry": "Tún gbìyànjú",
  "crash.reload": "Tún Prima ṣí",
  "crash.home": "Lọ sí Ilé",
  "crash.copy": "Ṣàdàkọ àlàyé fún ìrànlọ́wọ́",
  "crash.copied": "A ti ṣàdàkọ rẹ̀. O lè fi ránṣẹ́ sí ìrànlọ́wọ́.",
  "crash.details": "Àlàyé ẹ̀rọ",
  "crash.tip":
    "Tí èyí bá ń ṣẹlẹ̀ léraléra, ṣàdàkọ àlàyé náà kí o sì fi ránṣẹ́ sí ìrànlọ́wọ́.",
  "crash.staleTitle": "A ti ṣe àtúnṣe Prima",
  "crash.staleText":
    "Tún un ṣí láti rí ẹ̀dà tuntun. Àwọn àkọsílẹ̀ tí o ti fi pamọ́ wà ní ààbò.",

  // ----- accessibility
  "a11y.skip": "Fò lọ sí àkóónú pàtàkì",
  "a11y.mainMenu": "Àkójọ àṣàyàn pàtàkì",
  // ----- the first-sign-in wizard
  "welcome.title": "Káàbọ̀ sí Prima",
  "welcome.stepOf": "Ìgbésẹ̀ {n} nínú {total}",
  "welcome.languageTitle": "Èdè wo ni o fẹ́ lò?",
  "welcome.languageNote": "O lè yí i padà lẹ́yìn náà nínú Àkáǹtì.",
  "welcome.intendedTitle": "Ohun tí Prima jẹ́, àti ohun tí kì í ṣe",
  "welcome.confidentialTitle": "Pípa àṣírí ìwífún aláìsàn mọ́",
  "welcome.readyTitle": "O ti ṣetán",
  "welcome.tipRegister":
    "Forúkọ aláìsàn sílẹ̀ láti àmì Forúkọsílẹ̀. Ó ń ṣiṣẹ́ láìsí íńtánẹ́ẹ̀tì.",
  "welcome.tipLock": "Ṣètò PIN nínú Àkáǹtì, kí ẹlòmíràn má bàa ṣí Prima.",
  "welcome.tipSync":
    "Àwọn àkọsílẹ̀ máa ń gbéra fúnra wọn nígbà tí nẹ́tíwọ́ọ̀kì bá wà. Àmì ìkùukùu ń fi ohun tó ń dúró hàn.",
  "welcome.next": "Tókàn",
  "welcome.back": "Padà",
  "welcome.finish": "Bẹ̀rẹ̀ lílo Prima",
  "welcome.tickToContinue": "Ṣàmì sínú àpótí náà láti tẹ̀síwájú.",
  "welcome.saved": "A ti kọ ìfohùnsí rẹ sílẹ̀.",
  "welcome.savedLater":
    "A ti fi ìfohùnsí rẹ pamọ́ sórí fóònù yìí. A ó kọ ọ́ sílẹ̀ lórí íńtánẹ́ẹ̀tì nígbà tí nẹ́tíwọ́ọ̀kì bá wà.",
  "welcome.englishOnly": "Ọ̀rọ̀ yìí wà ní èdè Gẹ̀ẹ́sì fún ìsinsìnyí.",
  // ----- the Plans page
  "plans.title": "Àwọn Ètò",
  "plans.subtitle":
    "Owó tó rọrùn fún ilé ìwòsàn rẹ. Sanwó lóṣooṣù, tàbí sanwó oṣù mẹ́wàá kí o gba ọdún kan péré.",
  "plans.pay": "Yan ètò kí o sì sanwó",
  "plans.askAdmin":
    "Alákòóso ilé ìwòsàn rẹ nìkan ló lè sanwó. Bi í kí ó ṣí Àwọn Ètò.",
  "plans.f.free1": "Ilé ìwòsàn 1",
  "plans.f.free2": "Títí dé aláìsàn 200",
  "plans.f.free3": "Ìforúkọsílẹ̀, ìbẹ̀wò àti lílò láìsí íńtánẹ́ẹ̀tì",
  "plans.f.basic1": "Aláìsàn láìní ààlà",
  "plans.f.basic2": "Gbígbé CSV jáde àti ìròyìn LGA",
  "plans.f.basic3": "Ìṣàfilọ́lẹ̀ tí a lè fi sórí fóònù (PWA)",
  "plans.f.basic4": "Títí dé òṣìṣẹ́ 3",
  "plans.f.basic5": "Ìsọ̀kan data láàrin àwọn ẹ̀rọ láìsí íńtánẹ́ẹ̀tì",
  "plans.f.pro1": "Gbogbo ohun tó wà nínú Basic",
  "plans.f.pro2": "Àtòkọ ìbẹ̀wò ìtọ́pinpin tó tó àkókò",
  "plans.f.pro3": "Gbígbé FHIR àti DHIS2 jáde",
  "plans.f.pro4": "Ìdàpọ̀ àwọn àkọsílẹ̀ méjì lọ́nà ọlọ́gbọ́n",
  "plans.f.pro5": "Àtòkọ ìránnilétí SMS (fífiranṣẹ́ ń bọ̀ láìpẹ́)",
  // ----- the plan and usage card
  "plan.usageTitle": "Ètò àti lílò rẹ̀",
  "plan.name": "Ètò {plan}",
  "plan.patientsPhone": "Aláìsàn: {count} lórí fóònù yìí",
  "plan.inCloud": "{count} nínú ìkùukùu",
  "plan.limit": "ààlà {count}",
  "plan.noLimit": "kò ní ààlà",
  "plan.staff": "Àkáǹtì òṣìṣẹ́: {used} nínú {max}",
  "plan.parked_other":
    "Aláìsàn {count} ń dúró de àtúnṣe ètò kí a tó gbé wọn lọ.",
  "plan.seePlans": "Wo àwọn ètò",

  // ----- practice mode
  "demo.label": "Ipò ìdánrawò",
  "demo.banner":
    "Ipò ìdánrawò: àwọn aláìsàn ibí yìí jẹ́ èyí tí a ṣẹ̀dá. A kò fi nǹkankan ránṣẹ́ sí ibikíbi tàbí kí a fi kún ilé ìwòsàn rẹ.",
  "demo.leave": "Jáde kúrò ní ipò ìdánrawò",
  "demo.reset": "Tún ìdánrawò bẹ̀rẹ̀",
  "demo.try": "Gbìyànjú Prima pẹ̀lú àwọn aláìsàn ìdánrawò",
  "demo.tryNote":
    "O kò nílò àkáǹtì. Àwọn aláìsàn tí a ṣẹ̀dá, a kò sì fi nǹkankan ránṣẹ́ sí ibikíbi.",
  "demo.noPay": "A ti pa sísanwó ní ipò ìdánrawò.",

  // ----- near and over the Free plan limit, and a wrong phone clock
  "limit.over":
    "O ti kọjá ààlà ètò Ọ̀fẹ́ ti aláìsàn {limit}. A ṣì ń fi àwọn aláìsàn tuntun pamọ́, ṣùgbọ́n lórí fóònù yìí nìkan, títí o fi ṣe àtúnṣe ètò.",
  "limit.backup":
    "Ṣe ìpamọ́ ẹ̀dà nínú Àkáǹtì, kí wọ́n má bàa sọnù tí fóònù bá sọnù.",
  "limit.near_other":
    "Ààyè {count} péré ló ṣẹ́kù lórí ètò Ọ̀fẹ́. Lẹ́yìn náà, a ó máa fi àwọn aláìsàn tuntun pamọ́ lórí fóònù yìí nìkan títí o fi ṣe àtúnṣe ètò.",
  "clock.ahead": "Aago fóònù rẹ ti sáré ju àkókò gidi lọ ní {amount}.",
  "clock.behind": "Aago fóònù rẹ ti pẹ́ ju àkókò gidi lọ ní {amount}.",
  "clock.why":
    "Ọjọ́ tó wà lórí ìbẹ̀wò àti ìránnilétí lè jẹ́ àṣìṣe, àwọn àyípadà rẹ sì lè má gbéra tàbí kí wọ́n má ṣọ̀kan pẹ̀lú àwọn fóònù mìíràn.",
  "clock.fix":
    "Ṣí Ètò fóònù rẹ, lọ sí Ọjọ́ àti àkókò, kí o sì tan ọjọ́ àti àkókò aládàáṣe.",
  "clock.check": "Tún ṣàyẹ̀wò",
  "clock.checking": "Ń ṣàyẹ̀wò…",
  "clock.minutes_other": "ìṣẹ́jú {count}",
  "clock.hours_other": "wákàtí {count}",
  "clock.days_other": "ọjọ́ {count}",

  // ----- confirming an email address and resetting a password
  "authMail.checkTitle": "Ṣàyẹ̀wò ímeèlì rẹ",
  "authMail.checkBody":
    "A fi koodu àti ọ̀nà asopọ̀ ránṣẹ́ sí {email}. Kọ koodu náà sísàlẹ̀, tàbí ṣí ọ̀nà asopọ̀ inú ímeèlì náà.",
  "authMail.codeLabel": "Koodu láti inú ímeèlì",
  "authMail.codeHint": "Nọ́ńbà nìkan ni.",
  "authMail.confirm": "Jẹ́rìí ímeèlì",
  "authMail.confirming": "Ń ṣàyẹ̀wò…",
  "authMail.resend": "Fi ímeèlì tuntun ránṣẹ́",
  "authMail.resendWait": "Tún fi ránṣẹ́ láàrin ìṣẹ́jú àáyá {seconds}",
  "authMail.resent": "Ímeèlì tuntun wà lọ́nà.",
  "authMail.useOther": "Lo àdírẹ́sì ímeèlì mìíràn",
  "authMail.spam": "Kò sí nǹkan níbẹ̀? Wò inú spam tàbí junk.",
  "authMail.forgot": "Ṣé o gbàgbé ọ̀rọ̀ aṣínà rẹ?",
  "authMail.forgotTitle": "Tún ọ̀rọ̀ aṣínà rẹ ṣe",
  "authMail.forgotBody": "Kọ àdírẹ́sì ímeèlì rẹ. A ó fi koodu ránṣẹ́ sí ọ.",
  "authMail.sendCode": "Fi koodu náà ránṣẹ́",
  "authMail.sentGeneric":
    "Tí àdírẹ́sì ímeèlì yẹn bá ní àkáǹtì, a ti fi koodu àti ọ̀nà asopọ̀ ránṣẹ́ sí i.",
  "authMail.newTitle": "Yan ọ̀rọ̀ aṣínà tuntun",
  "authMail.newPassword": "Ọ̀rọ̀ aṣínà tuntun",
  "authMail.repeatPassword": "Tún kọ ọ́ lẹ́ẹ̀kan sí i",
  "authMail.savePassword": "Fi ọ̀rọ̀ aṣínà tuntun pamọ́",
  "authMail.backSignIn": "Padà sí wọlé",
  "authMail.errCode":
    "Koodu tàbí ọ̀nà asopọ̀ yẹn kò ṣiṣẹ́. Ó lè jẹ́ pé kò tọ́, a ti lò ó, tàbí ó ti pẹ́ jù. Béèrè fún tuntun.",
  "authMail.errMismatch": "Àwọn ọ̀rọ̀ aṣínà méjèèjì kò jọra.",
  "authMail.errWeak":
    "Ọ̀rọ̀ aṣínà yẹn rọrùn jù láti mọ̀. Lo èyí tó gùn jù pẹ̀lú lẹ́tà àti nọ́ńbà.",
  "authMail.errSame": "Yan ọ̀rọ̀ aṣínà tí o kò tíì lò rí.",
  "authMail.errCodeShort": "Kọ gbogbo koodu inú ímeèlì náà.",
  "authMail.linkTitle": "Jẹ́rìí ímeèlì rẹ",
  "authMail.linkBody":
    "Tẹ bọ́tìnì náà láti jẹ́rìí pé àdírẹ́sì ímeèlì yìí jẹ́ tìrẹ.",
  "authMail.linkDone": "A ti jẹ́rìí ímeèlì rẹ.",
  "authMail.passwordDone": "A ti yí ọ̀rọ̀ aṣínà rẹ padà.",
  "authMail.continue": "Tẹ̀síwájú",
  "authMail.linkBad":
    "Ọ̀nà asopọ̀ yìí kò kún. Ṣí ímeèlì tuntun jù láti ọ̀dọ̀ Prima kí o tún tẹ ọ̀nà asopọ̀ náà, tàbí kọ koodu náà dípò rẹ̀.",
  "authMail.otherUser":
    "Fóònù yìí ti wọlé gẹ́gẹ́ bí ẹlòmíràn, nítorí náà a kò jẹ́ kí o wọlé níbí. A ti fi àyípadà rẹ pamọ́. Wọlé lórí fóònù tìrẹ, tàbí kọ́kọ́ jáde níbí.",
  "authMail.offline": "O nílò ìsopọ̀ ayélujára fún ìgbésẹ̀ yìí.",
  "authMail.errGeneric": "Nǹkan kan ṣẹlẹ̀. Jọ̀wọ́ tún gbìyànjú.",
};
