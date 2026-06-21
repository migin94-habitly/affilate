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
# Обязательно поменяйте JWT_SECRET на случайную строку!

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

| Tier | Ставка | Апгрейд |
|------|--------|---------|
| Bronze | 15% | — |
| Silver | 20% | после N заказов (настраивается в Admin Panel) |
| Gold | 25% | вручную через Admin Panel |

Администратор может менять ставки, CPA-бонус и порог апгрейда в разделе **Комиссии → Тарифы**.

### Атрибуция

- **Cookie-window:** 30 дней (настраивается через `COOKIE_WINDOW_DAYS`)
- **Fallback для in-app browsers** (Instagram, TikTok): `?tap_click=<id>` в URL сохраняется как параметр на случай, если cookie не работает
- **Модель:** last-click — засчитывается последний клик перед заказом в пределах окна

### Жизненный цикл комиссии

```
Клик → Заказ (webhook) → Commission [pending]
    → Одобрение admin → Commission [approved]
    → Flush to balance → PartnerBalance.available_amount
    → Запрос выплаты  → Payout [pending]
    → Обработка       → Payout [paid_out]
```

Минимальная сумма для запроса выплаты: **5 000 ₸** (настраивается через `PAYOUT_MIN_THRESHOLD`).  
Выплаты только через **Freedom Pay** в тенге (KZT).

### Документооборот

Для вывода средств партнёр проходит KYC с пакетом документов по своему статусу:

| Статус | Пакет документов |
|--------|-----------------|
| Юридическое лицо | Договор о партнёрстве + Банковские реквизиты |
| ИП | Договор-оферта для ИП + Свидетельство о регистрации |
| Физическое лицо | Договор присоединения + Согласие на обработку ПД + Документ, удостоверяющий личность |

**Статусная машина:**
`draft` → `awaiting_partner_signature` → `under_ticketon_review` → `signed` / `rejected`

### Антифрод

Автоматическое обнаружение двух паттернов:

| Сигнал | Условие |
|--------|--------|
| Всплеск кликов | > 100 кликов/час от одного партнёра |
| Нулевая конверсия | > 50 кликов за 7 дней без единого заказа |

Сигналы отображаются в Admin Panel → **Антифрод** (обновление раз в 60 секунд).

---

## API

Base URL: `http://localhost:8080`

### Публичные эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/health` | Проверка работоспособности |
| `GET` | `/track/{click_id}` | Трекинговый редирект (устанавливает cookie) |
| `POST` | `/api/v1/webhook/order` | Webhook от Ticketon о новом заказе |

### Партнёрский API `/api/v1/partner/...`

Требует `Authorization: Bearer <token>` (кроме `/auth/*`).

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/register` | Регистрация |
| `POST` | `/auth/login` | Вход |
| `GET/PUT` | `/profile` | Профиль |
| `POST` | `/kyc` | KYC (IIN + Freedom Pay account) |
| `POST` | `/offer/accept` | Принять оферту |
| `GET` | `/events` | Каталог событий (фильтры: город, категория, поиск) |
| `POST` | `/links/generate` | Сгенерировать трекинговую ссылку + QR |
| `GET` | `/stats` | Клики, заказы, конверсия |
| `GET` | `/stats/series` | Временной ряд кликов |
| `GET` | `/payouts/balance` | Текущий баланс |
| `POST` | `/payouts/request` | Запросить выплату |
| `GET` | `/payouts` | История выплат |
| `POST` | `/documents` | Инициировать документооборот |
| `GET` | `/documents` | Список документов |
| `POST` | `/documents/{id}/upload-signed` | Загрузить подписанный документ |
| `GET` | `/documents/{id}/download` | Скачать финальный документ |

### Admin API `/api/v1/admin/...`

Требует `Authorization: Bearer <admin-token>`.

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/login` | Вход администратора |
| `GET` | `/analytics` | Метрики канала (GMV%, CAC, активные партнёры) |
| `GET` | `/partners` | Список партнёров с фильтрами |
| `PATCH` | `/partners/{id}/status` | active / suspended / banned |
| `PATCH` | `/partners/{id}/tier` | bronze / silver / gold |
| `GET/PUT` | `/tariffs` | Тарифы по тирам |
| `GET` | `/commissions` | Список комиссий |
| `POST` | `/commissions/approve-all` | Одобрить все pending-комиссии |
| `GET` | `/payouts` | Список выплат |
| `PATCH` | `/payouts/{id}/status` | Обновить статус выплаты |
| `GET` | `/payouts/export` | CSV-экспорт для Freedom Pay |
| `GET` | `/documents` | Список документов |
| `POST` | `/documents/{id}/sign` | Подписать со стороны Ticketon |
| `POST` | `/documents/{id}/reject` | Отклонить с указанием причины |
| `GET` | `/fraud/signals` | Список фрод-сигналов |

### Формат webhook-запроса от Ticketon

```json
POST /api/v1/webhook/order
Content-Type: application/json

{
  "external_order_id": "ticketon-order-123",
  "click_id": "optional-if-cookie-present",
  "service_fee": 1500.00,
  "status": "paid",
  "event_id": "uuid-of-event"
}
```

---

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения.

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `SERVER_PORT` | `8080` | Порт бэкенда |
| `DATABASE_URL` | — | DSN PostgreSQL |
| `JWT_SECRET` | — | **Обязательно сменить в продакшене** |
| `JWT_EXPIRY_HOURS` | `72` | Срок жизни токена |
| `S3_ENDPOINT` | — | URL MinIO / S3 |
| `S3_BUCKET` | `tap-documents` | Имя bucket |
| `S3_ACCESS_KEY` | — | Access key |
| `S3_SECRET_KEY` | — | Secret key |
| `TRACKING_BASE_URL` | — | Публичный URL для трекинговых ссылок |
| `COOKIE_WINDOW_DAYS` | `30` | Окно атрибуции в днях |
| `PAYOUT_MIN_THRESHOLD` | `5000` | Минимальная выплата в KZT |

---

## Разработка

### Backend

```bash
cd backend

# Запустить только инфраструктуру
docker compose up postgres minio minio-init -d

# Переменные для локального запуска
export DATABASE_URL="postgres://tap_user:tap_secret@localhost:5432/tap_db?sslmode=disable"
export JWT_SECRET="dev-secret-32-chars-minimum-here!!"
export S3_ENDPOINT="http://localhost:9000"
export S3_ACCESS_KEY="minioadmin"
export S3_SECRET_KEY="minioadmin123"
export S3_BUCKET="tap-documents"

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
