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
};
