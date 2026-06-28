export default {
  common: {
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    close: 'Закрыть',
    next: 'Далее',
    back: 'Назад',
    submit: 'Отправить',
    required: 'Обязательное поле',
    error: 'Ошибка',
    success: 'Успешно',
    copy: 'Копировать',
    copied: 'Скопировано!'
  },
  nav: {
    dashboard: 'Дашборд',
    events: 'События',
    links: 'Ссылки',
    promoCodes: 'Промокоды',
    payouts: 'Выплаты',
    documents: 'Документы',
    requests: 'Запросы',
    faq: 'FAQ',
    notifications: 'Уведомления',
    profile: 'Профиль',
    logout: 'Выйти'
  },
  auth: {
    login: 'Войти',
    register: 'Зарегистрироваться',
    email: 'Email',
    password: 'Пароль',
    fullName: 'Полное имя',
    phone: 'Телефон',
    segment: 'Тип партнёра',
    segments: {
      influencer: 'Блогер / Инфлюенсер',
      ugc: 'UGC / Контент-площадка',
      webservice: 'Веб-сервис / Сайт'
    },
    loginTitle: 'Вход в партнёрский кабинет',
    registerTitle: 'Регистрация партнёра',
    noAccount: 'Нет аккаунта?',
    hasAccount: 'Уже есть аккаунт?'
  },
  onboarding: {
    step1: 'Тип партнёра',
    step2: 'Контакты',
    step3: 'Банковские данные',
    step4: 'Оферта',
    title: 'Добро пожаловать в TAP',
    subtitle: 'Завершите регистрацию за 4 простых шага',
    freedomPayHint: 'Выплаты производятся на указанные банковские реквизиты в тенге (KZT)',
    offerTitle: 'Партнёрская оферта',
    offerText: 'Я соглашаюсь с условиями партнёрского соглашения Ticketon Affiliate Platform, включая требования к размещению #партнёрский материал, запрет на накрутку и self-referral.',
    accept: 'Принять оферту',
    checklistTitle: 'Начало работы',
    checklistDone: 'выполнено',
    steps: {
      account: 'Аккаунт создан',
      kyc: 'Банковские данные заполнены',
      kycLink: 'Заполнить',
      offer: 'Оферта принята',
      offerLink: 'Принять',
      documents: 'Документооборот инициирован',
      documentsLink: 'Начать',
    }
  },
  kyc: {
    title: 'Банковские реквизиты',
    subtitle: 'Укажите реквизиты для получения выплат',
    iin: 'ИИН / БИН (необязательно)',
    accountHolder: 'Получатель платежа',
    accountHolderPlaceholder: 'Полное имя или название компании',
    bankName: 'Название банка',
    bankNamePlaceholder: 'Например: Halyk Bank, Kaspi, Freedom Pay...',
    bankAccount: 'Номер счёта / IBAN',
    bankBic: 'БИК / Swift-код',
    bankBicPlaceholder: 'HSBKKZKX',
    freedomPayOptional: 'Если вы используете Freedom Pay — укажите номер аккаунта',
    accountOptional: '(необязательно)',
    freedomPayPlaceholder: 'Номер аккаунта или email Freedom Pay',
    save: 'Сохранить реквизиты',
    verified: 'Реквизиты подтверждены',
    verifiedDesc: 'Платёжные данные успешно верифицированы'
  },
  dashboard: {
    title: 'Дашборд',
    welcome: 'Привет,',
    clicks: 'Клики',
    orders: 'Заказы',
    earned: 'Заработано',
    conversion: 'Конверсия',
    balance: 'Доступный баланс',
    pending: 'В обработке',
    chartTitle: 'Клики и заказы (30 дней)',
    period: {
      day: 'Сегодня',
      week: 'Неделя',
      month: 'Месяц'
    }
  },
  events: {
    title: 'Каталог событий',
    search: 'Поиск событий',
    city: 'Город',
    category: 'Категория',
    allCities: 'Все города',
    allCategories: 'Все категории',
    getLink: 'Получить ссылку',
    noEvents: 'События не найдены',
    goldTitle: 'Полный каталог Ticketon.kz',
    goldDesc: 'Как партнёр Gold-уровня вы видите все события с ticketon.kz через открытый API',
    goldApiAccess: 'У вас активирован доступ к открытому API Ticketon — все события платформы доступны для продвижения',
    resetFilters: 'Сбросить фильтры',
    totalEvents: 'событий'
  },
  links: {
    title: 'Генератор ссылок',
    generate: 'Сгенерировать ссылку',
    generated: 'Ваша ссылка готова',
    trackingUrl: 'Ссылка для отслеживания',
    channel: 'Канал размещения',
    channels: {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      telegram: 'Telegram',
      web: 'Веб-сайт'
    }
  },
  promoCodes: {
    title: 'Промокоды',
    description: 'Промокод — альтернативный способ атрибуции для Stories и постов, где ссылка теряется при копировании',
    create: 'Создать промокод',
    code: 'Код',
    codePlaceholder: 'Например: VASYA2026',
    eventOptional: 'Событие (необязательно)',
    noEvent: 'Все события',
    uses: 'использований',
    active: 'Активен',
    inactive: 'Неактивен',
    deactivate: 'Деактивировать',
    noCodes: 'У вас пока нет промокодов'
  },
  payouts: {
    title: 'Выплаты',
    request: 'Запросить выплату',
    requestTitle: 'Новая заявка на выплату',
    submit: 'Отправить заявку',
    amount: 'Сумма выплаты',
    minThreshold: 'Минимальная сумма: 5 000 ₸',
    minError: 'Минимальная сумма выплаты — 5 000 ₸',
    insufficientBalance: 'Недостаточно средств на балансе',
    availableToWithdraw: 'Доступно к выводу',
    paid: 'Выплачено',
    willSendTo: 'Средства будут переведены на:',
    destination: 'Реквизиты выплаты',
    noBankDetails: 'Заполните банковские реквизиты в профиле, чтобы запросить выплату',
    status: {
      requested: 'Запрошено',
      processing: 'В обработке',
      paid: 'Выплачено',
      failed: 'Ошибка'
    },
    history: 'История выплат',
    emptyTitle: 'Выплат пока нет',
    emptyDesc: 'Запросите выплату, когда накопите минимальную сумму'
  },
  documents: {
    title: 'Документы',
    legalStatus: 'Юридический статус',
    legalStatuses: {
      legal_entity: 'Юридическое лицо',
      sole_proprietor: 'Индивидуальный предприниматель',
      individual: 'Физическое лицо'
    },
    docTypes: {
      partnership_agreement: 'Договор о партнёрстве',
      partnership_agreement_ip: 'Договор-оферта для ИП',
      accession_agreement: 'Договор присоединения',
      personal_data_consent: 'Согласие на обработку ПД',
      identity_document: 'Документ, удостоверяющий личность',
      bank_details: 'Банковские реквизиты',
      registration_certificate: 'Свидетельство о регистрации ИП'
    },
    status: {
      draft: 'Черновик',
      awaiting_partner_signature: 'На подписи у партнёра',
      under_ticketon_review: 'На проверке Ticketon',
      awaiting_ticketon_signature: 'Ожидает подписи Ticketon',
      signed: 'Подписан с обеих сторон',
      archived: 'Архив',
      rejected: 'Отклонён'
    },
    upload: 'Загрузить подписанный документ',
    download: 'Скачать',
    downloadFinal: 'Скачать финальный документ',
    initiateTitle: 'Начать документооборот',
    chooseStatus: 'Выберите ваш юридический статус для формирования пакета документов',
    confirmStatus: 'Подтвердите статус:',
    confirmDesc: 'Будет создан пакет документов для вашего статуса. Вы получите их для скачивания, подписания и загрузки обратно.',
    createPackage: 'Создать пакет документов',
    rejectionReason: 'Причина отказа:',
    uploadHint: 'Загрузите ссылку на подписанный документ (Google Drive, Dropbox или другое облачное хранилище)',
    uploadBtn: 'Загрузить'
  },
  notifications: {
    title: 'Уведомления',
    markAllRead: 'Прочитать все',
    empty: 'У вас пока нет уведомлений'
  },
  requests: {
    title: 'Мои запросы',
    subtitle: 'Отправляйте запросы в поддержку и отслеживайте их статус',
    new: 'Новый запрос',
    newTitle: 'Создать запрос',
    type: 'Тип запроса',
    subject: 'Тема',
    subjectPlaceholder: 'Кратко опишите вашу проблему или вопрос',
    body: 'Описание',
    bodyPlaceholder: 'Подробно опишите ситуацию...',
    formRequired: 'Заполните тему и описание',
    empty: 'Запросов пока нет',
    emptyDesc: 'Создайте запрос, если у вас есть вопросы или проблемы',
    adminNotes: 'Комментарии от команды',
    types: {
      general: 'Общий',
      api_access: 'Доступ к API',
      payment_issue: 'Проблема с выплатой',
      document: 'Документооборот',
      technical: 'Технический вопрос',
      other: 'Другое'
    },
    status: {
      new: 'Новый',
      in_progress: 'В работе',
      resolved: 'Решён',
      closed: 'Закрыт'
    }
  },
  faq: {
    title: 'Часто задаваемые вопросы',
    subtitle: 'Ответы на популярные вопросы о работе с TAP',
    contacts: 'Связаться с нами',
    noContacts: 'Контакты не указаны',
    categories: {
      general: 'Общие',
      payments: 'Выплаты',
      commissions: 'Комиссии',
      tracking: 'Отслеживание',
      documents: 'Документы'
    }
  }
}
