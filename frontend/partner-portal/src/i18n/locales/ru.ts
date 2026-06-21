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
    step3: 'Freedom Pay',
    step4: 'Оферта',
    title: 'Добро пожаловать в TAP',
    subtitle: 'Завершите регистрацию за 4 простых шага',
    freedomPayHint: 'Все выплаты производятся через Freedom Pay в тенге (KZT)',
    offerTitle: 'Партнёрская оферта',
    offerText: 'Я соглашаюсь с условиями партнёрского соглашения Ticketon Affiliate Platform, включая требования к размещению #партнёрский материал, запрет на накрутку и self-referral.',
    accept: 'Принять оферту'
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
    noEvents: 'События не найдены'
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
    amount: 'Сумма',
    minThreshold: 'Минимальная сумма: 5 000 ₸',
    status: {
      requested: 'Запрошено',
      processing: 'В обработке',
      paid: 'Выплачено',
      failed: 'Ошибка'
    },
    history: 'История выплат',
    freedomPayOnly: 'Выплаты только через Freedom Pay в KZT'
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
  }
}
