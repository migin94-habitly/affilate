export default {
  common: {
    loading: 'Жүктөлүүдө...',
    save: 'Сактоо',
    cancel: 'Жокко чыгаруу',
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
    links: 'Шилтемелер',
    payouts: 'Төлөмдөр',
    documents: 'Документтер',
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
    step3: 'Freedom Pay',
    step4: 'Оферта',
    title: 'TAP\'ка кош келиңиз',
    subtitle: '4 жөнөкөй кадам менен катталууну аяктаңыз',
    freedomPayHint: 'Бардык төлөмдөр Freedom Pay аркылуу теңгеде (KZT) жүргүзүлөт',
    offerTitle: 'Өнөктөштүк оферта',
    offerText: 'Мен Ticketon Affiliate Platform өнөктөштүк макулдашуусунун шарттарын кабыл алам.',
    accept: 'Офертаны кабыл алуу'
  },
  dashboard: {
    title: 'Башкы бет',
    clicks: 'Кликтер',
    orders: 'Буйрутмалар',
    earned: 'Киреше',
    conversion: 'Конверсия',
    balance: 'Жеткиликтүү баланс',
    pending: 'Иштетилүүдө',
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
    noEvents: 'Иш-чаралар табылган жок'
  },
  links: {
    title: 'Шилтеме генератору',
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
  payouts: {
    title: 'Төлөмдөр',
    request: 'Төлөм суроо',
    amount: 'Сумма',
    minThreshold: 'Минималдык сумма: 5 000 ₸',
    status: {
      requested: 'Суралды',
      processing: 'Иштетилүүдө',
      paid: 'Төлөндү',
      failed: 'Ката'
    },
    history: 'Төлөмдөр тарыхы',
    freedomPayOnly: 'Төлөмдөр Freedom Pay аркылуу гана KZT менен жүргүзүлөт'
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
    chooseStatus: 'Документтер пакетин түзүү үчүн юридикалык статусуңузду тандаңыз'
  }
}
