-- =====================================================
-- МИГРАЦИЯ: Реферальная система для ЭТРА
-- Дата: 2026-04-04
-- =====================================================

-- =====================================================
-- 1. НОВЫЕ ПОЛЯ В ТАБЛИЦЕ customers
-- =====================================================

-- Реферальный код (уникальный идентификатор для ссылок)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

-- Очки опыта
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;

-- Уровень реферальной программы (текст, рассчитывается автоматически)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referral_level VARCHAR(50);

-- Персональная скидка по реферальной программе (%)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referral_discount INTEGER DEFAULT 0;

-- Кто пригласил (ссылка на другого клиента)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referred_by_id INTEGER REFERENCES customers(id);

-- Статистика: всего рефералов
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

-- Статистика: заказов по рефералке
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_referral_orders INTEGER DEFAULT 0;

-- Статистика: сумма заказов по рефералке
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_referral_revenue NUMERIC DEFAULT 0;

-- Индекс для быстрого поиска по реферальному коду
CREATE INDEX IF NOT EXISTS idx_customers_referral_code 
ON customers(referral_code);

-- =====================================================
-- 2. НОВЫЕ ПОЛЯ В ТАБЛИЦЕ orders
-- =====================================================

-- Реферер (клиент, по чьей ссылке оформлен заказ)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS referrer_id INTEGER REFERENCES customers(id);

-- Флаг: очки реферу уже начислены
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS referral_points_awarded BOOLEAN DEFAULT FALSE;

-- Индекс для поиска заказов по рефереру
CREATE INDEX IF NOT EXISTS idx_orders_referrer 
ON orders(referrer_id);

-- =====================================================
-- 3. НОВАЯ ТАБЛИЦА referrals
-- =====================================================

CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    
    -- Реферер (источник ссылки)
    referrer_id INTEGER NOT NULL REFERENCES customers(id),
    
    -- Приглашённый клиент (может быть NULL для кликов)
    referred_id INTEGER REFERENCES customers(id),
    
    -- Связанный заказ
    order_id INTEGER REFERENCES orders(id),
    
    -- Связанный товар (на который была ссылка)
    product_id INTEGER REFERENCES products(id),
    
    -- Статус реферала
    status VARCHAR(20) DEFAULT 'click',
    
    -- Начислено очков
    points_awarded INTEGER DEFAULT 0,
    
    -- Сумма заказа на момент оформления
    order_total NUMERIC,
    
    -- Источник перехода
    source VARCHAR(20),
    
    -- IP адрес
    ip_address VARCHAR(50),
    
    -- User Agent
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для таблицы referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer 
ON referrals(referrer_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referred 
ON referrals(referred_id);

CREATE INDEX IF NOT EXISTS idx_referrals_order 
ON referrals(order_id);

CREATE INDEX IF NOT EXISTS idx_referrals_status 
ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_referrals_created 
ON referrals(created_at DESC);

-- =====================================================
-- 4. ТАБЛИЦЫ referral_settings (Payload CMS формат для Global)
-- =====================================================

-- Удалить старую таблицу если была создана в неправильном формате
DROP TABLE IF EXISTS referral_settings CASCADE;

-- Основная таблица глобальных настроек
CREATE TABLE IF NOT EXISTS referral_settings (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN DEFAULT TRUE,
    points_per_order NUMERIC DEFAULT 100,
    points_percent_of_order NUMERIC DEFAULT 5,
    share_title VARCHAR(255) DEFAULT 'Посмотри этот товар!',
    share_text TEXT DEFAULT 'Рекомендую этот товар от ЭТРА 🌿',
    cookie_lifetime_days NUMERIC DEFAULT 30,
    min_order_amount_for_points NUMERIC DEFAULT 0,
    award_on_status VARCHAR(20) DEFAULT 'paid',
    updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Таблица уровней (array field "levels")
CREATE TABLE IF NOT EXISTS referral_settings_levels (
    _order INTEGER NOT NULL,
    _parent_id INTEGER NOT NULL REFERENCES referral_settings(id) ON DELETE CASCADE,
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    min_points NUMERIC,
    discount_percent NUMERIC,
    color VARCHAR(255),
    icon_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_referral_settings_levels_order ON referral_settings_levels(_order);
CREATE INDEX IF NOT EXISTS idx_referral_settings_levels_parent ON referral_settings_levels(_parent_id);

-- Таблица enabledSources (select hasMany field)
CREATE TABLE IF NOT EXISTS referral_settings_enabled_sources (
    "order" INTEGER NOT NULL,
    parent_id INTEGER NOT NULL REFERENCES referral_settings(id) ON DELETE CASCADE,
    value VARCHAR(255),
    id SERIAL PRIMARY KEY
);

CREATE INDEX IF NOT EXISTS idx_referral_settings_enabled_sources_order ON referral_settings_enabled_sources("order");
CREATE INDEX IF NOT EXISTS idx_referral_settings_enabled_sources_parent ON referral_settings_enabled_sources(parent_id);

-- Вставить начальные настройки
INSERT INTO referral_settings (id, enabled, points_per_order, points_percent_of_order, share_title, share_text, cookie_lifetime_days, min_order_amount_for_points, award_on_status)
SELECT 1, TRUE, 100, 5, 'Посмотри этот товар!', 'Рекомендую этот товар от ЭТРА 🌿', 30, 0, 'paid'
WHERE NOT EXISTS (SELECT 1 FROM referral_settings WHERE id = 1);

-- Вставить уровни по умолчанию
INSERT INTO referral_settings_levels (_order, _parent_id, name, min_points, discount_percent, color) VALUES
    (1, 1, 'Новичок', 0, 0, '#9CA3AF'),
    (2, 1, 'Бронза', 100, 3, '#CD7F32'),
    (3, 1, 'Серебро', 500, 5, '#C0C0C0'),
    (4, 1, 'Золото', 1500, 7, '#FFD700'),
    (5, 1, 'Платина', 5000, 10, '#E5E4E2'),
    (6, 1, 'Бриллиант', 15000, 15, '#B9F2FF');

-- Вставить источники шеринга по умолчанию
INSERT INTO referral_settings_enabled_sources ("order", parent_id, value) VALUES
    (1, 1, 'telegram'),
    (2, 1, 'vk'),
    (3, 1, 'whatsapp'),
    (4, 1, 'copy');

-- =====================================================
-- 5. ГЕНЕРАЦИЯ РЕФЕРАЛЬНЫХ КОДОВ ДЛЯ СУЩЕСТВУЮЩИХ КЛИЕНТОВ
-- =====================================================

-- Включить расширение pgcrypto для генерации случайных байтов
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Функция для генерации случайного кода с использованием pgcrypto
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS VARCHAR(8) AS $$
DECLARE
    result VARCHAR(8);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Генерируем 4 случайных байта и конвертируем в hex (8 символов)
        result := upper(encode(gen_random_bytes(4), 'hex'));
        
        -- Проверяем уникальность
        SELECT EXISTS(SELECT 1 FROM customers WHERE referral_code = result) INTO code_exists;
        
        -- Выходим если код уникален
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Сгенерировать коды для клиентов без кода
UPDATE customers 
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Установить начальный уровень для всех
UPDATE customers 
SET referral_level = 'Новичок', referral_discount = 0
WHERE referral_level IS NULL;

-- =====================================================
-- 6. ОБНОВЛЕНИЕ СЛУЖЕБНЫХ ТАБЛИЦ PAYLOAD
-- =====================================================

-- Добавить поддержку referrals в таблицу связей для locked documents
ALTER TABLE payload_locked_documents_rels 
ADD COLUMN IF NOT EXISTS referrals_id INTEGER REFERENCES referrals(id) ON DELETE CASCADE;

-- Создать индекс для производительности
CREATE INDEX IF NOT EXISTS idx_payload_locked_documents_rels_referrals 
ON payload_locked_documents_rels(referrals_id);

-- =====================================================
-- ГОТОВО!
-- =====================================================

-- Проверка созданных структур:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers' AND column_name LIKE 'referral%';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name LIKE 'referr%';
-- SELECT * FROM referrals LIMIT 5;
-- SELECT * FROM referral_settings;
