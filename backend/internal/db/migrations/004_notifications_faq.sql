-- Partner Notifications
CREATE TABLE partner_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_partner ON partner_notifications(partner_id);
CREATE INDEX idx_notifications_unread ON partner_notifications(partner_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON partner_notifications(created_at DESC);

-- FAQ Items (managed by admin)
CREATE TABLE faq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faq_active ON faq_items(is_active, sort_order);

-- Contact Info (managed by admin)
CREATE TABLE contact_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_active ON contact_info(is_active, sort_order);

-- Default FAQ items
INSERT INTO faq_items (question, answer, category, sort_order) VALUES
    ('Как начать работу с TAP?', 'Зарегистрируйтесь на платформе, пройдите KYC-верификацию (укажите ИИН и Freedom Pay аккаунт), подпишите партнёрское соглашение и начните генерировать ссылки на события Ticketon.', 'general', 1),
    ('Как рассчитывается комиссия?', 'Комиссия рассчитывается от суммы заказа (GMV): Бронза — 3%, Серебро — 5%, Золото — 7%. Бонус за новых покупателей составляет 500 ₸.', 'commissions', 2),
    ('Когда мне перейдут деньги на выплату?', 'Комиссии переходят в статус «Доступно» после одобрения администратором. Вы можете запросить выплату при достижении порога в 5 000 ₸.', 'payments', 3),
    ('Сколько ждать выплату?', 'Выплаты обрабатываются в течение 3–5 рабочих дней через Freedom Pay. После одобрения запроса деньги поступают на указанный аккаунт.', 'payments', 4),
    ('Что такое прокод и когда его использовать?', 'Промокод — альтернативный способ атрибуции для Instagram Stories, TikTok и других форматов, где ссылка теряется при копировании. Зрители вводят ваш код при оплате билета.', 'tracking', 5),
    ('Как долго действует партнёрская ссылка?', 'Cookie-окно атрибуции составляет 30 дней. Если пользователь перейдёт по вашей ссылке и купит билет в течение 30 дней, заказ будет засчитан вам.', 'tracking', 6),
    ('Как повысить партнёрский тир?', 'Тир Серебро присваивается автоматически после выполнения порога заказов (уточните у менеджера). Тир Золото присваивается вручную администратором для партнёров с высоким объёмом продаж.', 'general', 7),
    ('Зачем нужны документы?', 'Подписание партнёрского соглашения обязательно для начала выплат. Вам нужно выбрать юридический статус (ФЛ, ИП или юрлицо) и пройти документооборот.', 'documents', 8);

-- Default contact info
INSERT INTO contact_info (type, label, value, sort_order) VALUES
    ('email', 'Email партнёрской поддержки', 'partners@ticketon.kz', 1),
    ('telegram', 'Telegram-менеджер', '@ticketon_partners', 2),
    ('whatsapp', 'WhatsApp', '+7 700 000 0000', 3);
