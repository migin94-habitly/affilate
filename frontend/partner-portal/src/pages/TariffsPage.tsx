import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { IconCheck } from '@/components/ui/Icons'

const tiers = [
  {
    key: 'bronze',
    name: 'Бронза',
    rate: '3%',
    gmv: 'от GMV',
    gradient: 'from-orange-400 to-amber-500',
    border: 'border-orange-200 dark:border-orange-500/30',
    badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
    emoji: '🥉',
    minOrders: 0,
    maxOrders: 9,
    features: [
      'Трекинговые ссылки',
      'Промокоды',
      'Панель аналитики',
      'Доступ к каталогу событий',
      'Выплаты от 5 000 ₸',
    ],
  },
  {
    key: 'silver',
    name: 'Серебро',
    rate: '5%',
    gmv: 'от GMV',
    gradient: 'from-slate-400 to-slate-500',
    border: 'border-slate-200 dark:border-slate-500/30',
    badge: 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300',
    emoji: '🥈',
    minOrders: 10,
    maxOrders: null,
    features: [
      'Всё из Бронзы',
      'Повышенная ставка 5% GMV',
      'Приоритетная поддержка',
      'Расширенная аналитика',
      'Специальные предложения',
    ],
    highlight: true,
  },
  {
    key: 'gold',
    name: 'Золото',
    rate: '7%',
    gmv: 'от GMV',
    gradient: 'from-yellow-400 to-amber-400',
    border: 'border-yellow-200 dark:border-yellow-500/30',
    badge: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    emoji: '🏆',
    minOrders: null,
    maxOrders: null,
    note: 'По приглашению',
    features: [
      'Всё из Серебра',
      'Максимальная ставка 7% GMV',
      'Доступ к Gold API',
      'Персональный менеджер',
      'Индивидуальные условия',
    ],
  },
]

const howItWorks = [
  {
    step: '1',
    title: 'Зарегистрируйтесь',
    desc: 'Создайте партнёрский аккаунт и пройдите верификацию. Это займёт несколько минут.',
  },
  {
    step: '2',
    title: 'Генерируйте ссылки',
    desc: 'Выбирайте события из каталога и создавайте уникальные трекинговые ссылки для своей аудитории.',
  },
  {
    step: '3',
    title: 'Делитесь контентом',
    desc: 'Публикуйте ссылки в соцсетях, Telegram-каналах, YouTube или на сайте.',
  },
  {
    step: '4',
    title: 'Зарабатывайте',
    desc: 'Получайте комиссию с каждого заказа, совершённого по вашей ссылке. Выплаты быстро и удобно.',
  },
]

const faq = [
  {
    q: 'Когда начисляется комиссия?',
    a: 'Комиссия начисляется после успешной оплаты заказа клиентом. Обычно это происходит в течение нескольких минут после покупки.',
  },
  {
    q: 'Как долго действует трекинговая ссылка?',
    a: 'Cookie-окно составляет 30 дней. Если покупатель перешёл по вашей ссылке, любая покупка в течение 30 дней будет засчитана вам.',
  },
  {
    q: 'Когда можно запросить выплату?',
    a: 'Выплату можно запросить при достижении минимального порога в 5 000 ₸ на балансе. Средства зачисляются через Freedom Pay.',
  },
  {
    q: 'Как повысить тир?',
    a: 'Переход с Бронзы на Серебро происходит автоматически при достижении 10 заказов. Золотой тир назначается персонально за выдающиеся результаты.',
  },
  {
    q: 'Можно ли получить индивидуальную ставку?',
    a: 'Для Gold-партнёров возможна установка индивидуальных ставок на конкретные события. Свяжитесь с поддержкой для обсуждения условий.',
  },
]

export function TariffsPage() {
  const { t } = useTranslation()
  const partner = useAuthStore(s => s.partner)
  const currentTier = partner?.tier ?? 'bronze'

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Тарифы и комиссии</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
          Зарабатывайте вместе с Ticketon — крупнейшей билетной платформой Казахстана. Чем больше продаёте, тем выше ставка.
        </p>
        {currentTier && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-2xl text-sm text-brand-700 dark:text-brand-300 font-medium">
            <span>Ваш текущий тир:</span>
            <span className="font-bold">
              {currentTier === 'bronze' ? '🥉 Бронза' : currentTier === 'silver' ? '🥈 Серебро' : '🏆 Золото'}
            </span>
          </div>
        )}
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiers.map(tier => {
          const isActive = currentTier === tier.key
          return (
            <div
              key={tier.key}
              className={`relative rounded-2xl border p-5 space-y-4 transition-all
                ${isActive
                  ? `${tier.border} shadow-md ring-2 ring-brand-500/30`
                  : `${tier.border} bg-white dark:bg-gray-900`
                }
                ${tier.highlight && !isActive ? 'bg-white dark:bg-gray-900' : 'bg-white dark:bg-gray-900'}`}
            >
              {isActive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-full shadow">
                  Ваш тир
                </span>
              )}
              {tier.note && !isActive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow">
                  {tier.note}
                </span>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tier.emoji}</span>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{tier.name}</p>
                    {tier.minOrders !== null && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {tier.maxOrders !== null
                          ? `${tier.minOrders}–${tier.maxOrders} заказов`
                          : `от ${tier.minOrders} заказов`}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${tier.badge}`}>{tier.rate}</span>
              </div>

              <div className={`h-1.5 rounded-full bg-gradient-to-r ${tier.gradient} opacity-80`} />

              <div className="text-3xl font-black text-gray-900 dark:text-gray-100">
                {tier.rate} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">{tier.gmv}</span>
              </div>

              <ul className="space-y-2">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <IconCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Special rates note */}
      <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⭐</span>
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Специальные ставки на события</p>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              На отдельные мероприятия могут быть установлены повышенные ставки комиссии. Следите за значком <strong>+X%</strong> в карточках событий — это дополнительный бонус сверх вашей базовой ставки.
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Как это работает</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {howItWorks.map((step, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500 text-white text-sm font-bold flex items-center justify-center">
                {step.step}
              </div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{step.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Ticketon */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-3xl font-black">500K+</p>
            <p className="text-sm opacity-80">покупателей в месяц</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black">2 000+</p>
            <p className="text-sm opacity-80">событий в каталоге</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black">30 дн.</p>
            <p className="text-sm opacity-80">cookie-окно</p>
          </div>
        </div>
        <p className="text-center mt-4 text-sm opacity-80">
          Ticketon — самая популярная билетная платформа Казахстана. Ваша аудитория уже покупает здесь.
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Часто задаваемые вопросы</h2>
        <div className="space-y-3">
          {faq.map((item, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">{item.q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
