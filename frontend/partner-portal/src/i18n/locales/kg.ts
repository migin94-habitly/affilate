export default {
  common: {
    loading: 'Жүктөлүүдө...',
    save: 'Сактоо',
    cancel: 'Жокко чыгаруу',
    close: 'Жабуу',
    next: 'Кийинки',
    back: 'Артка',
    submit: 'Жөнөтүү',
    required: 'Милдеттүү талаа',
    error: 'Ката',
    success: 'Ийгиликтүү',
    copy: 'Көчүрүү',
    copied: 'Көчүрүлдү!'
  },
  nav: {
    dashboard: 'Башкы бет',
    events: 'Иш-чаралар',
    tariffs: 'Тарифтер',
    links: 'Шилтемелер',
    promoCodes: 'Промокодтор',
    payouts: 'Төлөмдөр',
    documents: 'Документтер',
    requests: 'Суроо-талаптар',
    faq: 'FAQ',
    notifications: 'Билдирүүлөр',
    profile: 'Профиль',
    logout: 'Чыгуу'
  },
  auth: {
    login: 'Кирүү',
    register: 'Катталуу',
    email: 'Email',
    password: 'Сырсөз',
    fullName: 'Толук аты-жөнү',
    phone: 'Телефон',
    segment: 'Өнөктөш түрү',
    segments: {
      influencer: 'Блогер / Инфлюенсер',
      ugc: 'UGC / Контент платформа',
      webservice: 'Веб-сервис / Сайт'
    },
    loginTitle: 'Өнөктөш кабинетине кирүү',
    registerTitle: 'Өнөктөштү каттоо',
    noAccount: 'Аккаунт жокпу?',
    hasAccount: 'Аккаунт барбы?'
  },
  onboarding: {
    step1: 'Өнөктөш түрү',
    step2: 'Байланыш',
    step3: 'Банк маалыматтары',
    step4: 'Оферта',
    title: "TAP'ка кош келиңиз",
    subtitle: '4 жөнөкөй кадам менен катталууну аяктаңыз',
    freedomPayHint: 'Бардык төлөмдөр банк эсебиңизге теңгеде (KZT) жүргүзүлөт',
    offerTitle: 'Өнөктөштүк оферта',
    offerText: 'Мен Ticketon Affiliate Platform өнөктөштүк макулдашуусунун шарттарын кабыл алам.',
    accept: 'Офертаны кабыл алуу',
    checklistTitle: 'Иштепмашыгуу',
    checklistDone: 'аткарылды',
    steps: {
      account: 'Аккаунт жаратылды',
      kyc: 'Банк маалыматтары толтурулду',
      kycLink: 'Толтуруу',
      offer: 'Оферта кабыл алынды',
      offerLink: 'Кабыл алуу',
      documents: 'Документ жүгүртүү башталды',
      documentsLink: 'Баштоо',
    }
  },
  kyc: {
    title: 'Банктык реквизиттер',
    subtitle: 'Төлөмдөрдү алуу үчүн банктык реквизиттерди киргизиңиз',
    iin: 'ИНН (милдеттүү эмес)',
    accountHolder: 'Төлөм алуучу',
    accountHolderPlaceholder: 'Толук аты-жөнү же компания аталышы',
    bankName: 'Банктын аталышы',
    bankNamePlaceholder: 'Мисалы: Halyk Bank, Kaspi, Freedom Pay...',
    bankAccount: 'Эсеп номери / IBAN',
    bankBic: 'БИК / Swift-код',
    bankBicPlaceholder: 'HSBKKZKX',
    freedomPayOptional: 'Freedom Pay колдонсоңуз — эсеп номерин көрсөтүңүз',
    accountOptional: '(милдеттүү эмес)',
    freedomPayPlaceholder: 'Freedom Pay эсеп номери же email',
    save: 'Реквизиттерди сактоо',
    verified: 'Реквизиттер тастыкталды',
    verifiedDesc: 'Төлөм маалыматтары ийгиликтүү тастыкталды'
  },
  dashboard: {
    title: 'Башкы бет',
    welcome: 'Саламатсызбы,',
    clicks: 'Кликтер',
    orders: 'Буйрутмалар',
    earned: 'Киреше',
    conversion: 'Конверсия',
    balance: 'Жеткиликтүү баланс',
    pending: 'Иштетилүүдө',
    chartTitle: 'Кликтер жана буйрутмалар (30 күн)',
    period: {
      day: 'Бүгүн',
      week: 'Апта',
      month: 'Ай'
    }
  },
  events: {
    title: 'Иш-чаралар каталогу',
    search: 'Иш-чараларды издөө',
    city: 'Шаар',
    category: 'Категория',
    allCities: 'Бардык шаарлар',
    allCategories: 'Бардык категориялар',
    getLink: 'Шилтеме алуу',
    noEvents: 'Иш-чаралар табылган жок',
    goldTitle: "Ticketon.kz'нун толук каталогу",
    goldDesc: 'Gold өнөктөш катары сиз ачык API аркылуу бардык ticketon.kz иш-чараларына кире аласыз',
    goldApiAccess: 'Ticketon ачык API-га кирүү активдештирилди — платформанын бардык иш-чаралары жарнамалоо үчүн жеткиликтүү',
    resetFilters: 'Чыпкаларды тазалоо',
    totalEvents: 'иш-чара'
  },
  links: {
    title: 'Шилтеме генератору',
    generate: 'Шилтеме жаратуу',
    generated: 'Шилтемеңиз даяр',
    trackingUrl: 'Байкоо шилтемеси',
    channel: 'Жайгаштыруу каналы',
    channels: {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      telegram: 'Telegram',
      web: 'Веб-сайт'
    }
  },
  promoCodes: {
    title: 'Промокодтор',
    description: 'Промокод — Stories жана посттарда шилтемелер жоголгон жерде атрибуциянын альтернативдүү ыкмасы',
    create: 'Промокод жаратуу',
    code: 'Код',
    codePlaceholder: 'Мисалы: VASYA2026',
    eventOptional: 'Иш-чара (милдеттүү эмес)',
    noEvent: 'Бардык иш-чаралар',
    uses: 'колдонуу',
    active: 'Активдүү',
    inactive: 'Активдүү эмес',
    deactivate: 'Деактивациялоо',
    noCodes: 'Промокодтор жок'
  },
  payouts: {
    title: 'Төлөмдөр',
    request: 'Төлөм суроо',
    requestTitle: 'Жаңы төлөм өтүнүчү',
    submit: 'Өтүнүчтү жөнөтүү',
    amount: 'Төлөм суммасы',
    minThreshold: 'Минималдык сумма: 5 000 ₸',
    minError: 'Минималдык төлөм суммасы — 5 000 ₸',
    insufficientBalance: 'Баланс жетишсиз',
    availableToWithdraw: 'Чыгаруу үчүн жеткиликтүү',
    paid: 'Төлөндү',
    willSendTo: 'Каражат жөнөтүлөт:',
    destination: 'Төлөм реквизиттери',
    noBankDetails: 'Төлөм суроо үчүн профилде банктык реквизиттерди толтуруңуз',
    status: {
      requested: 'Суралды',
      processing: 'Иштетилүүдө',
      paid: 'Төлөндү',
      failed: 'Ката'
    },
    history: 'Төлөмдөр тарыхы',
    emptyTitle: 'Дагы эле төлөмдөр жок',
    emptyDesc: 'Минималдык суммага жеткенде төлөм сураңыз'
  },
  documents: {
    title: 'Документтер',
    legalStatus: 'Юридикалык статус',
    legalStatuses: {
      legal_entity: 'Юридикалык жак',
      sole_proprietor: 'Жеке ишкер',
      individual: 'Жеке адам'
    },
    docTypes: {
      partnership_agreement: 'Өнөктөштүк келишими',
      partnership_agreement_ip: 'ЖИ үчүн оферта келишими',
      accession_agreement: 'Кошулуу келишими',
      personal_data_consent: 'Жеке маалыматтарды иштетүүгө макулдук',
      identity_document: 'Инсандыкты тастыктаган документ',
      bank_details: 'Банктык реквизиттер',
      registration_certificate: 'ЖИ катталуу күбөлүгү'
    },
    status: {
      draft: 'Долбоор',
      awaiting_partner_signature: 'Өнөктөштүн колун күтүүдө',
      under_ticketon_review: 'Ticketon карап чыгууда',
      awaiting_ticketon_signature: 'Ticketon колун күтүүдө',
      signed: 'Эки тарабынан колу коюлду',
      archived: 'Архив',
      rejected: 'Четке кагылды'
    },
    upload: 'Кол коюлган документти жүктөө',
    download: 'Жүктөп алуу',
    downloadFinal: 'Акыркы документти жүктөп алуу',
    initiateTitle: 'Документ жүгүртүүнү баштоо',
    chooseStatus: 'Документтер пакетин түзүү үчүн юридикалык статусуңузду тандаңыз',
    confirmStatus: 'Статусту тастыктаңыз:',
    confirmDesc: 'Статусуңуз үчүн документтер пакети түзүлөт.',
    createPackage: 'Документтер пакетин түзүү',
    rejectionReason: 'Четке кагуу себеби:',
    uploadHint: 'Кол коюлган документке шилтеме жүктөңүз (Google Drive, Dropbox же башка булут хранилище)',
    uploadBtn: 'Жүктөө'
  },
  notifications: {
    title: 'Билдирүүлөр',
    markAllRead: 'Бардыгын окулду деп белгилөө',
    empty: 'Дагы эле билдирүүлөр жок'
  },
  requests: {
    title: 'Менин суроо-талаптарым',
    subtitle: 'Колдоо кызматына суроо-талаптар жибериңиз жана алардын абалын байкаңыз',
    new: 'Жаңы суроо-талап',
    newTitle: 'Суроо-талап түзүү',
    type: 'Суроо-талап түрү',
    subject: 'Тема',
    subjectPlaceholder: 'Маселеңизди же сурооңузду кыскача баяндаңыз',
    body: 'Сүрөттөмө',
    bodyPlaceholder: 'Кырдаалды кеңири баяндаңыз...',
    formRequired: 'Теманы жана сүрөттөмөнү толтуруңуз',
    empty: 'Дагы эле суроо-талаптар жок',
    emptyDesc: 'Суроолоруңуз же маселеңиз болсо, суроо-талап түзүңүз',
    adminNotes: 'Команданын пикирлери',
    types: {
      general: 'Жалпы',
      api_access: 'API мүмкүнчүлүгү',
      payment_issue: 'Төлөм маселеси',
      document: 'Документтер',
      technical: 'Техникалык суроо',
      other: 'Башка'
    },
    status: {
      new: 'Жаңы',
      in_progress: 'Иштетилүүдө',
      resolved: 'Чечилди',
      closed: 'Жабылды'
    }
  },
  faq: {
    title: 'Көп берилүүчү суроолор',
    subtitle: 'TAP менен иштөө боюнча жыш берилүүчү суроолорго жооптор',
    contacts: 'Биз менен байланышуу',
    noContacts: 'Байланыш маалыматтары көрсөтүлгөн жок',
    categories: {
      general: 'Жалпы',
      payments: 'Төлөмдөр',
      commissions: 'Комиссиялар',
      tracking: 'Байкоо',
      documents: 'Документтер'
    }
  }
}
