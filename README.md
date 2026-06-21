# Ticketon Affiliate Platform (TAP)

Партнёрская сеть Ticketon — self-serve платформа, где блогеры, UGC-авторы и веб-сервисы зарабатывают комиссию с продажи билетов. Партнёр получает трекинговую ссылку, размещает её в своих каналах и получает процент с каждого оплаченного заказа.

---

## Содержание

- [Архитектура](#архитектура)
- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Бизнес-логика](#бизнес-логика)
- [API](#api)
- [Переменные окружения](#переменные-окружения)
- [Разработка](#разработка)
- [Локализация](#локализация)

---

## Архитектура

```
┌─────────────────────────────────────────────────┐
│  Partner Portal       Admin Panel               │
│  React/Vite PWA       React/Vite                │
│  :5173                :5174                     │
└────────────┬──────────────┬────────────────────┘
             │  REST/JSON   │
             ▼              ▼
┌─────────────────────────────────────────────────┐
│  Go Backend (modular monolith)                  │
│  chi router · JWT · zerolog · :8080             │
└────────────┬──────────────┬────────────────────┘
             │              │
             ▼              ▼
       PostgreSQL 16     MinIO (S3)
       (основная БД)     (документы)
```

**Стек:**

| Слой | Технологии |
|------|-----------|
| Backend | Go 1.24, chi v5, pgx/v5, JWT HS256, bcrypt, zerolog |
| Partner Portal | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, i18next, Recharts, PWA |
| Admin Panel | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand |
| БД | PostgreSQL 16 |
| Хранилище файлов | MinIO (S3-совместимый) |
| Деплой | Docker Compose |

---

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- (для разработки) Go 1.24+, Node.js 20+

### Запуск через Docker Compose

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd affilate

# 2. Создать файл окружения
cp .env.example .env
# Обязательно измените JWT_SECRET и WEBHOOK_SECRET!

# 3. Запустить все сервисы
docker compose up -d

# 4. Проверить статус
docker compose ps
```

Сервисы после запуска:

| Сервис | URL |
|--------|-----|
| Partner Portal | http://localhost:5173 |
| Admin Panel | http://localhost:5174 |
| Backend API | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |

**Первый вход в Admin Panel:** `admin@ticketon.kz` / `Admin123!`

---

## Структура проекта

```
affilate/
├── backend/
│   ├── cmd/server/main.go          # Точка входа, роутинг
│   └── internal/
│       ├── config/                 # Конфиг из env
│       ├── db/
│       │   ├── db.go               # Подключение к PostgreSQL
│       │   └── migrations/         # SQL-миграции
│       ├── domain/
│       │   ├── models.go           # Все доменные типы
│       │   └── errors.go           # Sentinel ошибки
│       ├── middleware/             # JWT-аутентификация, логгирование
│       ├── repository/             # Слой данных (SQL-запросы)
│       ├── service/                # Бизнес-логика
│       └── handler/
│           ├── partner/            # API партнёрского кабинета
│           ├── admin/              # API панели администратора
│           └── tracking/           # Трекинговый редирект + webhook
├── frontend/
│   ├── partner-portal/             # PWA для партнёров
│   │   └── src/
│   │       ├── pages/              # Dashboard, Events, Payouts, Documents, Profile
│   │       ├── components/ui/      # Button, Card, Badge, Input
│   │       ├── i18n/locales/       # RU, EN, KZ, UZ, KG, TJ, TR
│   │       ├── store/              # Zustand (auth)
│   │       └── api/                # Axios-обёртки
│   └── admin-panel/                # Панель администратора
│       └── src/
│           ├── pages/              # Dashboard, Partners, Commissions, Payouts, Documents, Fraud
│           ├── components/ui/      # Btn, Badge, Table, Card, Stat, Filter
│           └── api/                # Axios-обёртки
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Бизнес-логика

### Тарифная сетка

Комиссия рассчитывается от **сервисного сбора** (не от суммы заказа):

| Tier | Ставка | CPA-бонус за нового покупателя |
|------|--------|-------------------------------|
| Bronze | 15% | настраивается |
| Silver | 20% | настраивается |
| Gold | 25% | настраивается |

- Апгрейд тира — **вручную** через Admin Panel → Partners → выпадающий список Tier.
- Поле `min_orders_for_silver` в тарифе Bronze хранит пороговое значение для будущей автоматизации (логика апгрейда — заглушка, реализуется в Phase 2).
- **Event-specific ставка**: в таблице `event_commission_rates` можно задать специальную ставку для конкретного события; она перекрывает тирную.

### Атрибуция кликов

- **Cookie-window:** 30 дней (настраивается через `COOKIE_WINDOW_DAYS`)
- **Cookie:** `tap_click=<click_id>`, `HttpOnly`, `SameSite=Lax`; флаг `Secure` включается только при `ENVIRONMENT=production`
- **Fallback для in-app browsers** (Instagram, TikTok): параметр `?tap_click=<click_id>` добавляется к URL назначения — Ticketon Core обязан передать его обратно в webhook-поле `click_id`
- **Модель:** last-click — засчитывается последний активный клик перед заказом в пределах окна

### Жизненный цикл комиссии

```
Клик (GET /track/<id>)
  → cookie + redirect на ticketon.kz?tap_click=<id>
  → Заказ (POST /webhook/order)
      ├── идемпотентность: если order_id уже известен — пропуск
      ├── Attribution: click_id из body → GetActiveClickForPartner
      └── commission.Calculate()
            ├── rate  = тарифная ставка тира (или event-специфичная)
            ├── base  = service_fee из webhook
            ├── bonus = tariff.cpa_bonus, если is_new_buyer == true
            └── Commission [status=pending] → сохранение в БД

Admin Panel → «Одобрить все»
  → Commission [pending → approved]
  → FlushToBalance: зачисляет сумму в partner_balances.available_amount

Партнёр → «Запросить выплату» (≥ 5 000 ₸)
  → FlushToBalance (на случай непроведённых flush)
  → проверка available_amount
  → Payout [status=pending], available → pending

Admin Panel → «В обработку» / «Выплачено» / «Ошибка»
  → Payout [processing → paid_out] или [processing → failed → available возвращается]
```

### Документооборот

Для вывода средств партнёр проходит KYC с пакетом документов по своему статусу:

| Статус | Пакет документов |
|--------|-----------------|
| Юридическое лицо | Договор о партнёрстве + Банковские реквизиты |
| ИП | Договор-оферта для ИП + Свидетельство о регистрации |
| Физическое лицо | Договор присоединения + Согласие на обработку ПД + Документ, удостоверяющий личность |

**Статусная машина:**
```
draft
  → awaiting_partner_signature   (после InitiateDocuments)
  → under_ticketon_review        (партнёр загрузил подписанный файл)
  → signed / rejected            (решение Admin Panel)
```

### Антифрод

Автоматическое обнаружение двух паттернов (SQL-запросы без ML):

| Сигнал | Условие |
|--------|---------|
| `click_spike` | > 100 кликов/час от одного партнёра |
| `zero_conversion` | > 50 кликов за 7 дней без единого заказа |

Поле `fraud_hold = true` на комиссии блокирует её выплату. Сигналы отображаются в Admin Panel → **Антифрод** (обновление раз в 60 секунд).

---

## API

Base URL: `http://localhost:8080`

### Публичные эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/health` | Проверка работоспособности → `{"status":"ok"}` |
| `GET` | `/track/{click_id}` | Трекинговый редирект: ставит cookie `tap_click`, добавляет `?tap_click` к URL и делает 302 |
| `POST` | `/api/v1/webhook/order` | Webhook от Ticketon Core о новом заказе |

### Партнёрский API `/api/v1/partner/...`

Требует `Authorization: Bearer <token>` (кроме `/auth/*`).

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/register` | Регистрация |
| `POST` | `/auth/login` | Вход |
| `GET` | `/profile` | Профиль + текущий тир |
| `PUT` | `/profile` | Обновить профиль (язык, страна и т.д.) |
| `POST` | `/kyc` | Сохранить KYC: IIN + Freedom Pay account |
| `POST` | `/offer/accept` | Принять оферту |
| `GET` | `/events` | Каталог событий (query: `city`, `category`, `search`, `page`, `per_page`) |
| `GET` | `/events/filters` | Доступные города и категории |
| `GET` | `/events/{id}` | Карточка события |
| `POST` | `/links/generate` | Сгенерировать ссылку + QR-код (через api.qrserver.com) |
| `GET` | `/stats` | Клики, заказы, конверсия за период |
| `GET` | `/stats/series` | Временной ряд кликов (для графика) |
| `GET` | `/payouts/balance` | Текущий баланс (available / pending / paid_out) |
| `POST` | `/payouts/request` | Запросить выплату (мин. 5 000 ₸) |
| `GET` | `/payouts` | История выплат |
| `POST` | `/documents` | Инициировать документооборот (body: `legal_status`) |
| `GET` | `/documents` | Список документов |
| `POST` | `/documents/{id}/upload-signed` | Загрузить URL подписанного документа |
| `GET` | `/documents/{id}/download` | Скачать финальный документ |

### Admin API `/api/v1/admin/...`

Требует `Authorization: Bearer <admin-token>`.

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/login` | Вход администратора |
| `GET` | `/me` | Профиль текущего администратора |
| `GET` | `/analytics` | Метрики: GMV%, CAC, активные партнёры (query: `period=7d\|30d\|90d`) |
| `GET` | `/partners` | Список партнёров (`status`, `segment`, `search`, `page`) |
| `GET` | `/partners/{id}` | Карточка партнёра |
| `PATCH` | `/partners/{id}/status` | `active` / `suspended` / `banned` |
| `PATCH` | `/partners/{id}/tier` | `bronze` / `silver` / `gold` |
| `GET` | `/tariffs` | Тарифы всех трёх тиров |
| `PUT` | `/tariffs` | Обновить тариф (`base_rate`, `cpa_bonus`, `min_orders_for_silver`) |
| `GET` | `/commissions` | Список комиссий (`status`, `page`, `per_page`) |
| `POST` | `/commissions/approve-all` | Одобрить все `pending`-комиссии → flush to balance |
| `GET` | `/payouts` | Список выплат (`status`, `page`, `per_page`) |
| `PATCH` | `/payouts/{id}/status` | `processing` / `paid_out` / `failed` |
| `GET` | `/payouts/export` | CSV-экспорт для Freedom Pay |
| `GET` | `/documents` | Список документов (`status`, `page`, `per_page`) |
| `GET` | `/documents/{id}` | Карточка документа |
| `GET` | `/documents/{id}/download-url` | URL файла, загруженного партнёром |
| `POST` | `/documents/{id}/sign` | Подписать: `ticketon_file_url` + `final_file_url` |
| `POST` | `/documents/{id}/reject` | Отклонить с указанием `reason` |
| `GET` | `/fraud/signals` | Список фрод-сигналов |

### Формат webhook-запроса от Ticketon Core

```json
POST /api/v1/webhook/order
Content-Type: application/json

{
  "order_id":    "ticketon-order-123",
  "secret":      "<WEBHOOK_SECRET>",
  "event_id":    "external-event-id",
  "buyer_email": "user@example.com",
  "is_new_buyer": false,
  "total_amount": 15000.00,
  "service_fee":  1500.00,
  "currency":    "KZT",
  "status":      "paid",
  "click_id":    "optional-click-id"
}
```

> **Важно:** поле `is_new_buyer: true` активирует CPA-бонус по тарифу. Поле `click_id` необходимо для атрибуции в in-app browsers, где cookie не сохраняется.

---

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения.

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `PORT` | `8080` | Порт HTTP-сервера |
| `ENVIRONMENT` | `development` | `production` включает `Secure` на cookie |
| `DATABASE_URL` | — | DSN PostgreSQL |
| `JWT_SECRET` | — | **Обязательно сменить** |
| `JWT_EXPIRY_HOURS` | `24` | Срок жизни access-токена |
| `JWT_REFRESH_EXPIRY_HOURS` | `168` | Срок жизни refresh-токена (7 дней) |
| `S3_ENDPOINT` | — | URL MinIO / S3 |
| `S3_BUCKET` | `tap-documents` | Имя bucket |
| `S3_REGION` | `us-east-1` | Регион |
| `S3_ACCESS_KEY` | — | Access key |
| `S3_SECRET_KEY` | — | Secret key |
| `BASE_REDIRECT_URL` | `https://ticketon.kz` | Запасной URL при неизвестном clickID |
| `COOKIE_WINDOW_DAYS` | `30` | Окно атрибуции в днях |
| `WEBHOOK_SECRET` | `dev-webhook-secret` | **Обязательно сменить** — аутентификация webhook |
| `PAYOUT_MIN_THRESHOLD` | `5000` | Минимальная выплата в KZT |
| `PAYOUT_CURRENCY` | `KZT` | Валюта выплат |
| `FRONTEND_URL` | `http://localhost:5173` | Разрешённый Origin для CORS |

---

## Разработка

### Backend

```bash
cd backend

# Запустить только инфраструктуру
docker compose up postgres minio minio-init -d

# Минимальный набор переменных для локального запуска
export PORT=8080
export DATABASE_URL="postgres://tap_user:tap_secret@localhost:5432/tap_db?sslmode=disable"
export JWT_SECRET="dev-secret-32-chars-minimum-here!!"
export S3_ENDPOINT="http://localhost:9000"
export S3_ACCESS_KEY="minioadmin"
export S3_SECRET_KEY="minioadmin123"
export S3_BUCKET="tap-documents"
export WEBHOOK_SECRET="dev-webhook-secret"

go run ./cmd/server
```

Миграции применяются автоматически при старте. Чтобы добавить новую — создайте файл `backend/internal/db/migrations/002_name.sql`.

### Partner Portal

```bash
cd frontend/partner-portal
npm install
npm run dev      # http://localhost:5173
npm run build    # Сборка в dist/
```

### Admin Panel

```bash
cd frontend/admin-panel
npm install
npm run dev      # http://localhost:5174
npm run build    # Сборка в dist/
```

---

## Локализация

Partner Portal поддерживает 7 языков. Переключатель доступен в шапке и в разделе **Профиль**.

| Код | Язык |
|-----|------|
| `ru` | Русский (по умолчанию) |
| `en` | English |
| `kz` | Қазақша |
| `uz` | O'zbekcha |
| `kg` | Кыргызча |
| `tj` | Тоҷикӣ |
| `tr` | Türkçe |

Файлы переводов: `frontend/partner-portal/src/i18n/locales/`

---

## Известные ограничения (Phase 2)

| Компонент | Текущее состояние |
|-----------|------------------|
| Авто-апгрейд тира Bronze → Silver | Заглушка; логика в `CommissionService.CheckAndUpgradeTier` не реализована |
| QR-коды | Генерируются через внешний сервис `api.qrserver.com` |
| Антифрод | Только два SQL-паттерна; ML-модели нет |
| Webhook-аутентификация | Shared secret в теле запроса; HMAC-подпись — Phase 2 |
| S3-загрузка файлов | Хранятся URL документов; прямой upload через presigned URLs не реализован |
