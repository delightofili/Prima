// Hausa (Harshen Hausa). STATUS: DRAFT. Written as a first version for a native speaker to check and correct.
// Rules for whoever edits this file:
//   1. Keep every {name} exactly as it is. The program fills it in (a number, a name, a time).
//   2. Hausa has two forms for counted words (_one for 1, _other for the rest). Keep both lines of each pair.
//   3. Clinical names (conditions, complaints, medicines) stay in English on purpose. Do not translate them here.
//   4. Use the hooked letters ɓ ɗ ƙ ƴ and the apostrophe ʼ. Save the file as UTF-8.
//   5. If a line is missing, Prima shows the English one. A missing line is safer than a wrong one.
import type { Key } from "./en";

export const dict: Partial<Record<Key, string>> = {
  // ----- the language itself
  "lang.heading": "Harshe",
  "lang.help":
    "Zaɓi harshen da Prima za ta yi amfani da shi a wannan waya. Sunayen cututtuka, matsaloli da magunguna suna nan da Turanci domin rahotanni su zama iri ɗaya a ko'ina.",
  "lang.draftBadge": "Na farko",
  "lang.soonBadge": "Nan ba da daɗewa ba",
  "lang.draftNote":
    "Wannan fassara ce ta farko. Masu jin Hausa har yanzu suna duba ta. Idan wata kalma ta yi kama da kuskure, don Allah ku faɗa mana.",
  "lang.loadFailed":
    "Ba a iya samun wannan harshe ba. Haɗa intanet sau ɗaya, sannan a sake gwadawa.",
  "lang.someEnglish":
    "Wasu shafuka har yanzu suna da Turanci yayin da ake kammala fassarar.",

  // ----- the bottom tabs and common buttons
  "nav.home": "Gida",
  "nav.register": "Yi rajista",
  "nav.patients": "Marasa lafiya",
  "nav.dashboard": "Taƙaitawa",
  "nav.lock": "Kulle",
  "nav.account": "Asusu",
  "nav.lockPrima": "Kulle Prima",
  "common.cancel": "Soke",
  "common.save": "Ajiye",
  "common.later": "Daga baya",
  "common.tryAgain": "Sake gwadawa",
  "common.syncNow": "Daidaita yanzu",
  "common.open": "Buɗe",

  // ----- ages
  "age.years_one": "shekara {count}",
  "age.years_other": "shekaru {count}",
  "age.months_one": "wata {count}",
  "age.months_other": "watanni {count}",

  // ----- registering a patient
  "register.title": "Yi wa mara lafiya rajista",
  "register.subtitle":
    "Ana ajiyewa a wannan na'ura da farko, sannan a daidaita idan akwai intanet.",
  "register.useFull": "Kana buƙatar ƙarin bayani? Yi amfani da cikakken fom",
  "register.useQuick": "Yi amfani da fom mai sauri",
  "register.limitTitle": "Ka kai marasa lafiya 200",
  "register.limitText":
    "Tsarin kyauta yana ɗaukar marasa lafiya 200. Basic yana cire iyaka kuma yana ƙara fitar da CSV da rahoton LGA na kowane wata. Duba Plans don farashi.",
  "register.fullName": "Cikakken suna",
  "register.sex": "Mace ko namiji",
  "register.female": "Mace",
  "register.male": "Namiji",
  "register.age": "Shekaru",
  "register.howToGiveAge": "Yadda za a bayar da shekaru",
  "register.byAge": "Shekaru",
  "register.byBirthDate": "Ranar haihuwa",
  "register.agePlaceholder": "misali 34",
  "register.years": "Shekaru",
  "register.months": "Watanni",
  "register.yearsOrMonths": "Shekaru ko watanni",
  "register.dateOfBirth": "Ranar haihuwa",
  "register.estimateNote":
    "Za a ajiye shi a matsayin kimantawa. Shafin mara lafiya zai nemi ainihin ranar daga baya.",
  "register.ageIs": "{age}.",
  "register.village": "Ƙauye ko yanki",
  "register.villagesRecent": "Ƙauyukan da aka yi amfani da su kwanan nan",
  "register.pregnantNow": "Tana da ciki yanzu",
  "register.reason": "Dalilin zuwa",
  "register.commonReasons": "Dalilan da aka fi gani",
  "register.orTypeIt": "Ko ka rubuta shi",
  "register.registrationOnly": "Rajista kawai (babu ziyara yanzu)",
  "register.phoneOptional": "Waya (zaɓi)",
  "register.guardianOptional": "Iyaye ko mai kula (zaɓi)",
  "register.noticeTitle": "An bayyana sanarwar sirri",
  "register.noticeHelp":
    "Faɗa wa mara lafiya yadda za a yi amfani da bayanansa. Za ka iya rubuta wannan daga baya a shafin mara lafiya.",
  "register.duplicateExact":
    "Wannan mara lafiya na iya kasancewa an riga an yi masa rajista.",
  "register.duplicateSimilar":
    "An riga an yi rajistar mara lafiya mai kama da wannan.",
  "register.differentPerson": "Wannan wani mutum ne daban",
  "register.planFull":
    "Tsarin kyauta ya cika. Duba Plans don ƙara marasa lafiya.",
  "register.saveFailed":
    "Ba a iya ajiye wannan mara lafiya ba. Da fatan a duba bayanan a sake gwadawa.",
  "register.saving": "Ana ajiyewa…",
  "register.submit": "Yi rajista",
  "register.submitAndVisit": "Yi rajista kuma ƙara ziyara",
  "register.unsaved": "Canje-canjen da ba a ajiye ba",

  // ----- the messages under a box that is not filled in right
  "err.nameRequired": "Shigar da sunan mara lafiya",
  "err.nameShort": "Sunan ya yi gajere",
  "err.nameLong": "Sunan ya yi tsayi",
  "err.sexRequired": "Zaɓi mace ko namiji",
  "err.ageNumber": "Shigar da shekaru da lamba",
  "err.ageUseMonths": "Ga jariri ƙasa da shekara 1, zaɓi watanni",
  "err.ageTooOld": "Shekaru ba za su wuce 120 ba",
  "err.ageUseYears": "Fiye da watanni 59, zaɓi shekaru",
  "err.dobRequired": "Shigar da ranar haihuwa",
  "err.dobFuture": "Ranar haihuwa ba za ta zama a nan gaba ba",
  "err.dobCheck": "Duba ranar haihuwa",
  "err.villageRequired": "Shigar da ƙauye ko yanki",
  "err.villageLong": "Sunan ƙauyen ya yi tsayi",
  "err.phoneInvalid":
    "Shigar da lambar waya ta Najeriya mai kyau, misali 08031234567",
  "err.reasonRequired":
    "Faɗi dalilin zuwan mara lafiya, ko ka zaɓi Rajista kawai",
  "err.reasonLong": "Ka rage shi ƙasa da haruffa 200",

  // ----- the hint under the complaint box
  "complaint.warnPhone":
    "Wannan yana kama da lambar waya. Kada ka saka bayanan tuntuɓa da sunaye a cikin bayanin matsala. Suna da akwatunansu.",
  "complaint.warnEmail":
    "Wannan yana kama da adireshin imel. Kada ka saka bayanan tuntuɓa da sunaye a cikin bayanin matsala. Suna da akwatunansu.",
  "complaint.recognised": "An gane: {terms}",
  "complaint.didYouMean": "Ko kana nufin:",
  "complaint.vague":
    "Faɗi abin da mara lafiya ke ji, misali zazzaɓi, tari ko ciwon ciki.",
  "complaint.unknown":
    "Prima ba ta gane wannan matsala ba. Har yanzu za ka iya ajiye ta.",

  // ----- after a patient is registered
  "saved.title": "An yi wa mara lafiya rajista",
  "saved.about": "kusan {age}",
  "saved.firstReason": "Dalilin rajistar farko:",
  "saved.recordVisit": "Rubuta ziyara",
  "saved.viewProfile": "Duba shafin mara lafiya",
  "saved.printCard": "Buga kati",
  "saved.another": "Yi wa wani mara lafiya rajista",

  // ----- what a quick registration left for later
  "record.finishTitle": "Kammala wannan bayanin",
  "record.addDetails": "Ƙara waɗannan bayanai",
  "record.nextOfKin": "Dangi na kusa",
  "record.nextOfKinHelp": "Wanda za a kira idan ba a iya samun mara lafiya.",
  "record.birthDate": "Ranar haihuwa kimantawa ce",
  "record.birthDateHelp": "Shigar da ainihin ranar idan wani ya sani.",
  "record.guardian": "Iyaye ko mai kula",
  "record.guardianHelp": "Ana buƙatarsa don tunatarwa da bayanan iyali.",

  // ----- the sync badge, its panel and the banners
  "sync.offline": "Babu intanet",
  "sync.offlineSaved": "Babu intanet · an ajiye {count}",
  "sync.offlineDetail":
    "Babu intanet. Duk abin da ka rubuta an ajiye shi a wannan waya, kuma zai ɗora kansa idan intanet ta dawo.",
  "sync.signin": "Shiga don daidaitawa",
  "sync.signinDetail":
    "Ba a shiga Prima a gajimare a wannan waya ba, don haka babu abin da ke ɗorawa. Bayanai suna lafiya a wannan waya.",
  "sync.schema": "Ana buƙatar sabunta rumbun bayanai",
  "sync.schemaDetail":
    "Rumbun bayanai da ke gajimare ba shi da wani abu da wannan sigar Prima ke buƙata, don haka wasu bayanai ba za su iya ɗorawa ba. Suna lafiya a wannan waya. Mai kula da ku ya gudanar da sabon SQL, sannan ya danna Sake gwadawa.",
  "sync.working": "Ana daidaitawa…",
  "sync.workingDetail": "Ana ɗorawa da saukewa yanzu.",
  "sync.paused": "An dakatar · {count} suna jira",
  "sync.pausedDetail":
    "Yanayin batir ƙasa ya dakatar da daidaitawa. Danna Daidaita yanzu, saka caji, ko kashe shi.",
  "sync.attention_one": "{count} yana buƙatar kulawa",
  "sync.attention_other": "{count} suna buƙatar kulawa",
  "sync.attentionDetail_one":
    "Ba a iya ɗora bayani {count} ba bayan gwaje-gwaje da dama. Yana lafiya a wannan waya. Buɗe cikakkun bayanan daidaitawa.",
  "sync.attentionDetail_other":
    "Ba a iya ɗora bayanai {count} ba bayan gwaje-gwaje da dama. Suna lafiya a wannan waya. Buɗe cikakkun bayanan daidaitawa.",
  "sync.upgrade": "{count} suna jiran haɓaka tsari",
  "sync.upgradeDetail_one":
    "An ajiye mara lafiya {count} a wannan waya amma ba a ɗora shi ba, saboda tsarin kyauta ya cika.",
  "sync.upgradeDetail_other":
    "An ajiye marasa lafiya {count} a wannan waya amma ba a ɗora su ba, saboda tsarin kyauta ya cika.",
  "sync.cloudDown": "Ba a iya isa gajimare · {count} suna jira",
  "sync.cloudDownDetail":
    "Prima ba ta iya isa gajimare a yanzu. Komai an ajiye shi a wannan waya, kuma zai ɗora kansa idan ya samu dama.",
  "sync.retrying":
    "Ana sake gwadawa nan da daƙiƙa {seconds} · {count} suna jira",
  "sync.retryingDetail":
    "Wani bayani bai ɗora ba kuma za a sake gwada shi nan ba da daɗewa ba.",
  "sync.waiting": "{count} suna jiran ɗorawa",
  "sync.waitingDetail": "Waɗannan za su ɗora cikin 'yan daƙiƙu.",
  "sync.synced": "An daidaita",
  "sync.syncedDetail": "Duk abin da ke wannan waya yana gajimare.",
  "sync.badgeAria": "Halin daidaitawa: {label}. Danna don ƙarin bayani.",
  "sync.panelTitle": "Bayanan daidaitawa",
  "sync.panelCounts":
    "{waiting} suna jiran ɗorawa, {failed} suna buƙatar kulawa. Komai yana lafiya a wannan waya.",
  "sync.itemWaiting": "{table} · yana jira",
  "sync.itemFailed": "{table} · yana buƙatar kulawa",
  "sync.tries_one": "gwaji {count}",
  "sync.tries_other": "gwaje-gwaje {count}",
  "sync.retryFailed": "Sake gwada waɗanda ke buƙatar kulawa",
  "sync.openDoctor": "Buɗe Sync Doctor (na masu kula)",
  "sync.openDoctorShort": "Buɗe Sync Doctor",
  "sync.table.patients": "marasa lafiya",
  "sync.table.visits": "ziyara",
  "sync.table.immunizations": "allurar rigakafi",
  "sync.table.guardians": "masu kula",
  "sync.table.reminders": "tunatarwa",
  "sync.table.audit": "tarihin ayyuka",
  "syncErr.limit": "Ana jiran haɓaka tsari. Bayanin yana lafiya a wannan waya.",
  "syncErr.schema":
    "Rumbun bayanai a gajimare yana buƙatar sabuntawa kafin wannan ya ɗora. Faɗa wa mai kula da ku. Bayanin yana lafiya a wannan waya.",
  "syncErr.bug":
    "Prima ta samu matsala da wannan bayani. Yana lafiya a wannan waya. Faɗa wa masu taimako.",
  "syncErr.permission":
    "Gajimare bai amince da wannan bayani ba. Yana lafiya a wannan waya. Faɗa wa mai kula da ku.",
  "syncErr.network": "Babu haɗi da gajimare. Zai ɗora kansa.",
  "syncErr.auth": "Sake shiga don ci gaba da daidaitawa.",
  "syncErr.foreignKey": "Ana jiran wani bayani mai alaƙa ya fara ɗorawa.",
  "syncErr.other":
    "Gajimare bai karɓi wannan bayani ba tukuna. Yana nan lafiya a wannan waya. Danna Sake gwadawa.",
  "banner.seePlans": "Duba tsare-tsare",
  "banner.nothingLost": "Babu abin da ya ɓace.",
  "banner.askAdmin": "Ka roƙi mai kula da asibitinku ya haɓaka.",

  // ----- Low Battery Mode
  "power.title": "Yanayin batir ƙasa",
  "power.bannerOn":
    "Yanayin batir ƙasa yana aiki. Komai an ajiye shi a wannan waya.",
  "power.waiting_one":
    "Bayani {count} yana jiran ɗorawa. An dakatar da daidaitawa.",
  "power.waiting_other":
    "Bayanai {count} suna jiran ɗorawa. An dakatar da daidaitawa.",
  "power.waitingNone":
    "Babu abin da ke jiran ɗorawa. An dakatar da daidaitawa.",
  "power.turnOff": "Kashe",
  "power.explain":
    "Idan yana aiki, Prima tana daina daidaitawa a bango, tana amfani da launuka masu duhu kuma babu motsi. Duk abin da ka yi wa rajista yana ci gaba da ajiyewa a wannan waya nan take. Daidaitawa tana jira har sai ka danna Daidaita yanzu, ka saka caji, ko ka kashe shi.",
  "power.auto": "Kai tsaye",
  "power.autoHelp":
    "Yana kunnawa a batir 20% kuma yana kashewa a 30%, ko lokacin da ake caji",
  "power.on": "Kullum a kunne",
  "power.onHelp":
    "Yi amfani da wannan idan ba za ka iya yin caji na dogon lokaci ba",
  "power.off": "A kashe",
  "power.offHelp": "Kada ya kunna kansa",
  "power.batteryNow": "Batir yanzu: {percent}%.",
  "power.batteryNowCharging": "Batir yanzu: {percent}%, ana caji.",
  "power.isOn": "Yanayin batir ƙasa yana aiki.",
  "power.isOff": "Yanayin batir ƙasa baya aiki.",
  "power.unsupported":
    "Mai bincike na wannan waya baya nuna batir, don haka Kai tsaye ba zai iya kunna shi ba. Yi amfani da Kullum a kunne idan batir ya yi ƙasa.",
  "power.oledNote":
    "Launuka masu duhu suna rage amfani da wuta kaɗan ne kawai a wayoyin da ke da allon OLED. Babban tanadi shi ne hasken wayarka: rage shi.",

  // ----- getting a new version of the app
  "update.ready": "Sabon sigar Prima ya shirya.",
  "update.help":
    "Gama duk abin da kake ajiyewa tukuna. Bayananka suna nan a wannan waya.",
  "update.now": "Sabunta yanzu",
  "update.offlineReady":
    "Prima a shirye take ta yi aiki ba tare da intanet ba.",

  // ----- the Account page
  "account.title": "Asusu",
  "account.subtitle": "Kai, asibitinku da ƙungiyarku.",
  "account.you": "Kai",
  "account.roleAdmin": "Mai kula da asibiti",
  "account.roleStaff": "Ma'aikaci",
  "account.signOut": "Fita",
  "account.signOutNote":
    "Fita ba ya buƙatar intanet. Bayanai suna nan a wannan waya, a ɓoye, har sai wani daga wannan asibiti ya shiga.",
  "account.facility": "Asibiti",
  "account.facilityLine": "{lga}, {state} · lamba {code}",
  "account.planOnServer": "Tsari a sabar:",
  "account.planTestingNote":
    "Binciken tsari na manhajar yana amfani da maɓallin gwaji har sai ranar tsarin.",
  "account.editDetails": "Gyara bayanai",
  "account.privacy": "Sirri",
  "account.readNotice": "Karanta sanarwar sirri",
  "account.auditLink": "Tarihin ayyuka da buƙatun bayanai",
  "facility.editTitle": "Gyara asibiti",
  "facility.codeNote":
    "Lambar asibiti ba za ta canza ba, saboda an buga ta a kati.",
  "facility.name": "Sunan asibiti",
  "facility.lga": "LGA",
  "facility.state": "Jiha",
  "facility.updated": "An sabunta asibiti",
  "team.title": "Ƙungiya",
  "team.askAdmin":
    "Ka roƙi mai kula da asibitinku ya ƙara ko ya cire ma'aikata.",
  "team.needInternet": "Kana buƙatar intanet don sarrafa ƙungiyar.",
  "team.loading": "Ana ɗauko ƙungiyar…",
  "team.count_one":
    "Asusun ma'aikaci {used} cikin {limit} an yi amfani da shi a tsarin {plan}.",
  "team.count_other":
    "Asusun ma'aikata {used} cikin {limit} an yi amfani da su a tsarin {plan}.",
  "team.you": "(kai)",
  "team.admin": "Mai kula",
  "team.staff": "Ma'aikaci",
  "team.memberLine": "{email} · {role} · ya shiga {date}",
  "team.removeAria": "Cire {name}",
  "team.createInvite": "Ƙirƙiri lambar gayyata",
  "team.unusedInvites": "Lambobin gayyata da ba a yi amfani da su ba",
  "team.expires": "za ta ƙare {date}",
  "team.inviteCancelled": "An soke gayyatar",
  "team.removeTitle": "Cire {name}?",
  "team.removeMessage":
    "Za su rasa damar ganin bayanan wannan asibiti. Za a kulle wayarsu a lokaci na gaba da ta shiga intanet. Za ka iya sake gayyatarsu daga baya.",
  "team.remove": "Cire",
  "team.removed": "An cire {name}",
  "invite.title": "Lambar gayyata",
  "invite.help":
    "Ba abokin aikinka wannan lamba. Tana aiki sau ɗaya kuma tana ƙarewa cikin kwanaki 7.",
  "invite.copy": "Kwafa",
  "invite.codeCopied": "An kwafi lambar",
  "invite.whatsapp": "Aika ta WhatsApp",

  // ----- the patient page, and the edit and new-visit pages
  "common.undo": "Maido",
  "common.edit": "Gyara",
  "common.delete": "Share",
  "common.yes": "Eh",
  "common.no": "A'a",
  "common.changesSaved": "An ajiye canje-canje",
  "patient.title": "Mara lafiya",
  "patient.notFound": "Ba a sami mara lafiya ba",
  "patient.backToPatients": "Koma wajen marasa lafiya",
  "patient.deleteTitle": "Share {name}?",
  "patient.deleteMessage":
    "Za a cire su daga jerin sunaye da kuma daga kowace na'ura. Za ka iya mayar da shi nan take.",
  "patient.deleteLabel": "Share mara lafiya",
  "patient.visitDeleteTitle": "Share wannan ziyara?",
  "patient.visitDeleteMessage":
    "Za a cire ziyarar daga tarihin wannan mara lafiya. Za ka iya mayar da ita nan take.",
  "patient.visitDeleteLabel": "Share ziyara",
  "patient.vaccineDeleteTitle": "Share wannan bayanin allurar?",
  "patient.vaccineDeleteMessage":
    "Za a cire bayanin. Za ka iya mayar da shi nan take.",
  "patient.vaccineDeleteLabel": "Share bayani",
  "patient.deleted": "An share {name}",
  "patient.visitDeleted": "An share ziyara",
  "patient.vaccineDeleted": "An share bayanin allura",
  "patient.ageEstimated": "{age} (kimantawa)",
  "patient.followUp": "Ziyarar biyo baya {date}",
  "patient.followUpOverdue": "Ziyarar biyo baya {date} (ta wuce lokaci)",
  "patient.firstReason": "Dalilin rajistar farko",
  "patient.addVisit": "Ƙara ziyara",
  "patient.visitsTitle": "Ziyara ({count})",
  "patient.noVisits": "Ba a rubuta ziyara ba tukuna",
  "patient.noVisitsHelp":
    "Yi amfani da “Ƙara ziyara” don rubuta matsaloli, alamomin lafiya da ganewar asali.",
  "patient.cardPersonal": "Na kai",
  "patient.address": "Adireshi",
  "patient.cardMedical": "Lafiya",
  "patient.obstetric": "Ciki da haihuwa",
  "patient.gender": "Mace ko namiji",
  "patient.phone": "Waya",
  "patient.registered": "An yi rajista",
  "patient.village": "Ƙauye",
  "patient.kinName": "Suna",
  "patient.nhis": "Lambar NHIS",
  "patient.bloodGroup": "Rukunin jini",
  "patient.allergies": "Alerji",
  "patient.pregnant": "Tana da ciki",
  "patient.immunizations": "Allurar rigakafi",
  "patient.addVaccine": "Ƙara allura",
  "patient.noVaccines": "Ba a rubuta allura ba tukuna.",
  "patient.vaccineDose": "{name} · kashi na {dose}",
  "patient.vaccineGiven": "An yi {date}",
  "patient.vaccineDue": "{label} ya kamata a yi {date}",
  "patient.vaccineDueOverdue": "{label} ya kamata a yi {date} (ya wuce lokaci)",
  "patient.nextDose": "Kashi na gaba",
  "patient.vaccineDeleteAria": "Share {name} kashi na {dose}",
  "patient.editTitle": "Gyara bayanan mara lafiya",
  "patient.editPageTitle": "Gyara · {name}",
  "patient.cardFixed": "Ba za a iya canza lambar kati {card} ba.",
  "visit.newTitle": "Sabuwar ziyara",
  "visit.newPageTitle": "Sabuwar ziyara · {name}",

  // ----- the full registration form
  "form.newAdmission": "Sabon shigarwa? (ziyarar farko saboda wata matsala)",
  "form.chiefComplaint": "Babbar matsala",
  "form.complaintExample": "misali fever da cough tsawon kwana 3",
  "form.ageLine": "{age}",
  "form.villageTown": "Ƙauye / Gari",
  "form.medicalOptional": "Lafiya (zaɓi)",
  "form.notKnown": "Ba a sani ba",
  "form.allergies": "Alerjin da aka sani",
  "form.allergyExample": "misali Penicillin",
  "form.obstetric": "Tarihin ciki da haihuwa",
  "form.currentlyPregnant": "Tana da ciki a yanzu",
  "form.guardianTitle": "Mai kula (zaɓi)",
  "form.guardianHelp":
    "Ƙara mai kula yana taimaka wa Prima ta kira mutumin da ya dace don allurai da ziyarori na biyo baya. Fara nema: uwa mai yara da yawa mai kula ɗaya ce.",
  "form.noticeText":
    "Na gaya wa mara lafiya (ko mai kula da shi) yadda za a yi amfani da bayanansa, kuma yana iya neman ganin su, gyara su ko cire su. Idan hakan bai yiwu yanzu ba, bar akwatin ba tare da alama ba, ka rubuta daga baya a shafin mara lafiya.",
  "form.dupExact":
    "An riga an yi rajista? {name} ({card}) yana da suna, ranar haihuwa da ƙauye iri ɗaya.",
  "form.dupSimilar": "Sunaye masu kama da ranar haihuwa iri ɗaya:",
  "form.dupMatch": "{name} · {card} · daidaito {score}%",
  "form.leaveConfirm": "Fita ba tare da yi wa wannan mara lafiya rajista ba?",
  "form.saveChanges": "Ajiye canje-canje",

  // ----- shared pieces and relationships
  "common.close": "Rufe",
  "badge.under5": "Ƙasa da shekara 5",
  "rel.mother": "Uwa",
  "rel.father": "Uba",
  "rel.grandparent": "Kaka",
  "rel.sibling": "Ɗan'uwa ko 'yar'uwa",
  "rel.auntUncle": "Goggo ko kawu",
  "rel.other": "Wani",
  "rel.guardian": "Mai kula",

  // ----- guardians
  "guardian.title": "Mai kula",
  "guardian.editTitle": "Gyara mai kula",
  "guardian.saved": "An ajiye mai kula",
  "guardian.removed": "An cire mai kula",
  "guardian.updated": "An sabunta mai kula",
  "guardian.linkRemoved": "An cire alaƙar mai kula",
  "guardian.saveFailed": "Ba a iya ajiye mai kula ba.",
  "guardian.editNote":
    "Canje-canjen za su shafi duk yaran da aka haɗa da wannan mai kula.",
  "guardian.relationship": "Dangantaka",
  "guardian.relationshipTo": "Dangantakarsa da mara lafiya",
  "guardian.callAria": "Kira {name}",
  "guardian.noChildren": "Ba a haɗa wani yaro ba tukuna.",
  "guardian.new": "Sabon mai kula",
  "guardian.backToSearch": "Koma wajen nema",
  "guardian.useKin": "Yi amfani da dangi na kusa: {name}",
  "guardian.alsoPatient": "Shin wannan mutumin ma mara lafiya ne a nan? (zaɓi)",
  "guardian.searchPatient": "Nemi suna, waya ko lambar kati",
  "guardian.motherNote":
    "Haɗa bayanan uwa yana nuna ziyarar kula da masu cikinta a shafin jaririn.",
  "guardian.notFound": "Ba a sami mai kula ba. Sake zaɓi",
  "guardian.choose": "Zaɓi wani mai kula daban",
  "guardian.search": "Nemi mai kula ta waya ko suna",
  "guardian.childCount_one": "yaro {count}",
  "guardian.childCount_other": "yara {count}",
  "guardian.addNew": "Ƙara sabon mai kula",
  "guardian.errName": "Shigar da sunan mai kula.",
  "guardian.errPhone":
    "Shigar da lambar waya ta Najeriya mai kyau don mai kula.",
  "guardian.errSmsPhone":
    "Shigar da lambar wayar mai kula don aika tunatarwar SMS.",
  "guardian.errSelf": "Mutum ba zai iya zama mai kula da kansa ba.",

  // ----- the family section
  "family.mothersRecord": "Bayanan uwa: {name} · {card}",
  "family.anc": "Ziyarar kula da masu ciki: {count}, ta ƙarshe {date}",
  "family.noAnc": "Ba a rubuta wata ziyarar kula da masu ciki ba tukuna.",
  "family.change": "Canza mai kula",
  "family.removeLink": "Cire alaƙa",
  "family.none": "Ba a haɗa mai kula ba",
  "family.noneHelp":
    "Haɗa mai kula domin tunatarwa da kiran waya su isa ga mutumin da ya dace.",
  "family.add": "Ƙara mai kula",
  "family.children": "Yara ({count})",

  // ----- vaccines and diagnoses
  "vaccine.allRecorded":
    "An riga an rubuta duk allurar da ke cikin jerin ga wannan mara lafiya.",
  "vaccine.label": "Allura",
  "vaccine.dateGiven": "Ranar da aka yi",
  "vaccine.nextPreview": "Na gaba: {label}, ya kamata a yi {date}",
  "vaccine.save": "Ajiye allura",
  "vaccine.recorded": "An rubuta {label}",
  "vaccine.errDate": "Shigar da ranar da aka yi",
  "vaccine.errFuture": "Ranar ba za ta zama a nan gaba ba",
  "vaccine.errBeforeBirth": "Ba za a iya yin allura kafin ranar haihuwa ba",
  "vaccine.alreadyGiven": "Allurar da aka riga aka yi",
  "vaccine.tickHelp":
    "Yi alama a kowace allurar da yaron ya samu, ka duba ranar.",
  "diagnosis.placeholder": "Rubuta don nema, misali malaria ko sugar",
  "diagnosis.clear": "Share ganewar asali",
  "diagnosis.frequent": "Wanda aka fi amfani da shi a nan",
  "diagnosis.codeSaved": "Za a ajiye lambar ICD-10 {code}.",
  "diagnosis.sensitive":
    "Ganewar asali mai mahimmanci. Ana barin ta a fitar da bayanai da ake rabawa sai dai idan mai kula da ku ya haɗa ta.",
  "diagnosis.freeText":
    "Ba a zaɓi lamba ba. Za a ajiye shi a matsayin rubutu kyauta.",

  // ----- the visit form, visit card and edit-visit page
  "visit.title": "Ziyara",
  "visit.date": "Ranar ziyara",
  "visit.complaints": "Matsaloli",
  "visit.prefilled": "An cika daga rajistar farko. Gyara idan ya zama dole.",
  "visit.vitals": "Alamomin lafiya",
  "visit.bpTop": "Lamba ta sama ta BP (systolic)",
  "visit.bpBottom": "Lamba ta ƙasa ta BP (diastolic)",
  "visit.temperature": "Zafin jiki",
  "visit.weight": "Nauyi",
  "visit.flagsNote":
    "Alamun jagora ne, ba ganewar asali ba. Alamun BP suna shafar marasa lafiya masu shekara 13 zuwa sama.",
  "visit.assessment": "Bincike",
  "visit.diagnosis": "Ganewar asali (zaɓi)",
  "visit.treatment": "Magani / bayanai (zaɓi)",
  "visit.treatmentExample":
    "misali Artemether-lumefantrine, an shawarci a sha ruwa",
  "visit.followUpTitle": "Ziyarar biyo baya",
  "visit.nextDate": "Ranar ziyara ta gaba (zaɓi)",
  "visit.in3days": "Cikin kwana 3",
  "visit.in1week": "Cikin mako 1",
  "visit.in2weeks": "Cikin mako 2",
  "visit.in1month": "Cikin wata 1",
  "visit.saved": "An ajiye ziyara",
  "visit.updated": "An sabunta ziyara",
  "visit.saveFailed":
    "Ba a iya ajiye wannan ziyara ba. Da fatan a sake gwadawa.",
  "visit.save": "Ajiye ziyara",
  "visit.leaveConfirm": "Fita ba tare da ajiye wannan ziyara ba?",
  "visit.editAria": "Gyara ziyara",
  "visit.editTitle": "Gyara ziyara",
  "visit.editPageTitle": "Gyara ziyara · {name}",
  "visit.notFound": "Ba a sami ziyarar ba",
  "visit.backToPatient": "Koma wajen mara lafiya",

  // ----- messages under boxes that come from the form rules
  "err.fieldRequired": "Ana buƙatar {label}",
  "err.fieldShort": "{label} ya yi gajere",
  "err.fieldLong": "{label} ya yi tsayi",
  "form.nokName": "Sunan dangi na kusa",
  "err.tooLong": "Ya yi tsayi da yawa",
  "err.enterNumber": "Shigar da lamba",
  "err.complaintShort": "Bayyana dalilin ziyarar (aƙalla haruffa 3)",
  "err.smsChildren": "Ga yara, mai kula ne ke ba da izinin SMS.",
  "err.smsPhone": "Shigar da lambar waya don karɓar tunatarwar SMS.",
  "err.femaleOver12": "Don mata marasa lafiya masu fiye da shekara 12 kawai",
  "err.paraGravida": "Para ba zai fi gravida yawa ba",
  "err.vaccineDateMissing": "Shigar da ranar da aka yi {label}",
  "err.vaccineFuture": "Ranar {label} ba za ta zama a nan gaba ba",
  "err.vaccineBeforeBirth": "Ba za a iya yin {label} kafin ranar haihuwa ba",

  // ----- shared
  "common.loading": "Ana ɗauko…",

  // ----- the home page
  "home.goodMorning": "Barka da safe",
  "home.goodAfternoon": "Barka da rana",
  "home.goodEvening": "Barka da yamma",
  "home.find": "Nemi mara lafiya",
  "home.totalPatients": "Jimillar marasa lafiya",
  "home.registeredToday": "An yi rajista yau",
  "home.followUpsDue_one": "Ziyarar biyo baya {count} tana jira",
  "home.followUpsDue_other": "Ziyarori na biyo baya {count} suna jira",
  "home.followUpsHelp": "Waɗanda suka wuce lokaci da kwanaki 7 masu zuwa",
  "home.welcome": "Barka da zuwa Prima",
  "home.emptyHelp":
    "Rajistar ka babu komai a ciki. Yi wa mara lafiyarka na farko rajista. Yana aiki ko da babu network.",
  "home.registerFirst": "Yi wa mara lafiya na farko rajista",
  "home.recent": "An yi wa rajista kwanan nan",
  "home.viewAll": "Duba duka",
  "home.footer":
    "Prima tana aiki ba tare da network ba. Ana ajiye bayanai a wannan na'ura kuma suna daidaita kansu.",

  // ----- the patients page and the list
  "patients.subtitle": "Nemi ta suna, waya, NHIS ko lambar kati.",
  "patients.findDuplicates": "Nemi waɗanda aka maimaita",
  "patients.exportCsv": "Fitar da CSV",
  "patients.exportNeedsBasic": "Fitarwa tana buƙatar tsarin Basic",
  "patients.exportUpgradeText":
    "Haɓaka zuwa Basic ({price} a wata) don sauke cikakken rajistar marasa lafiyarka a matsayin CSV, da rahoton LGA ma.",
  "list.search": "Nemi suna, waya, NHIS ko lambar kati",
  "list.none": "Babu marasa lafiya tukuna",
  "list.noneHelp": "Yi wa mara lafiya na farko rajista, zai bayyana a nan.",
  "list.noMatch": "Babu mara lafiya ko mai kula da ya dace da “{search}”.",
  "list.guardians": "Masu kula",
  "list.count": "Marasa lafiya {count} cikin {total}",
  "list.first100": "Ana nuna 100 na farko. Yi nema don ƙunsar da su.",
  "limit.freePlan": "Tsarin kyauta",
  "limit.usage": "Marasa lafiya {used} / {limit}",
  "limit.spotsLeft_one": "Wuri {count} ya rage.",
  "limit.spotsLeft_other": "Wurare {count} sun rage.",
  "upgrade.notNow": "Ba yanzu ba",

  // ----- the patient card and scanning
  "card.pageTitle": "Katin mara lafiya",
  "card.printHelp":
    "Ana bugawa da girman katin banki. Buga a takardar kati, ko a takarda ta yau da kullum ka yanke a layin.",
  "card.unavailable": "Wannan mara lafiya ba ya nan.",
  "card.qrNote":
    "Lambar QR tana ɗauke da lambar kati kawai. Duk wanda ya sami katin ba zai iya karanta bayanan ba. Duba shi a Prima ta hanyar Duba kati.",
  "card.number": "Lambar kati",
  "card.note":
    "Zo da wannan kati a kowace ziyara. Ka ajiye shi a bushe kuma lafiya.",
  "card.about": "Kusan {age}",
  "card.born": "Haihuwa: {date}",
  "scan.title": "Duba kati",
  "scan.subtitle": "Nuna kyamara ga lambar QR da ke kan katin mara lafiya.",
  "scan.notPrima": "Wannan ba katin mara lafiya na Prima ba ne.",
  "scan.notFound":
    "Babu mara lafiya mai kati {card} a wannan waya. Idan an yi wa mara lafiyar rajista a wata waya, a jira ta daidaita.",
  "scan.typeLabel": "Ko ka rubuta lambar kati",
  "scan.open": "Buɗe mara lafiya",
  "scan.noCamera": "Kyamara ba ta nan.",
  "scan.denied":
    "Ka ba Prima izinin kyamara a saitin shafi na mai bincike, sannan ka sake buɗe wannan shafi.",
  "scan.noDevice": "Wannan na'ura ba ta da kyamarar da za a iya amfani da ita.",
  "scan.cameraError": "Kyamara ba ta iya farawa ba.",
  "scan.typeInstead": "Za ka iya rubuta lambar kati a ƙasa maimakon haka.",
  "scan.starting": "Ana kunna kyamara…",
  "scan.qrAria": "Lambar QR mai ɗauke da lambar kati",

  // ----- readings, steppers and visit rules
  "vitals.veryHigh": "Ya yi yawa sosai",
  "vitals.high": "Ya yi yawa",
  "vitals.highFever": "Zazzaɓi mai tsanani",
  "vitals.fever": "Zazzaɓi",
  "vitals.low": "Ya yi ƙasa",
  "stepper.increase": "Ƙara {label}",
  "stepper.decrease": "Rage {label}",
  "err.fieldNumber": "{label} dole ya zama lamba",
  "err.fieldWhole": "{label} dole ya zama cikakkiyar lamba",
  "err.fieldLow": "{label} ya yi kamar ƙasa da yawa",
  "err.fieldHigh": "{label} ya yi kamar sama da yawa",
  "err.visitDateRequired": "Shigar da ranar ziyara",
  "err.visitFuture": "Ranar ziyara ba za ta zama a nan gaba ba",
  "err.visitBeforeBirth": "Ziyara ba za ta zama kafin ranar haihuwa ba",
  "err.under500": "Ka rage shi ƙasa da haruffa 500",
  "err.bothBp": "Shigar da duka lambobin BP biyu",
  "err.diaLower": "Diastolic dole ya yi ƙasa da systolic",
  "err.validDate": "Shigar da ingantacciyar rana",
  "err.followAfter": "Ziyarar biyo baya dole ta zama bayan ranar ziyara",
};
