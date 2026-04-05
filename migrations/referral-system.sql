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
-- 4. НОВАЯ ТАБЛИЦА referral_settings (глобальные настройки)
-- =====================================================

CREATE TABLE IF NOT EXISTS referral_settings (
    id SERIAL PRIMARY KEY,
    
    -- Включена ли программа
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Базовое количество очков за заказ
    points_per_order INTEGER DEFAULT 100,
    
    -- Процент от суммы заказа (дополнительные очки)
    points_percent_of_order INTEGER DEFAULT 5,
    
    -- Уровни (JSON массив)
    levels JSONB DEFAULT '[
        {"name": "Новичок", "minPoints": 0, "discountPercent": 0, "color": "#9CA3AF"},
        {"name": "Бронза", "minPoints": 100, "discountPercent": 3, "color": "#CD7F32"},
        {"name": "Серебро", "minPoints": 500, "discountPercent": 5, "color": "#C0C0C0"},
        {"name": "Золото", "minPoints": 1500, "discountPercent": 7, "color": "#FFD700"},
        {"name": "Платина", "minPoints": 5000, "discountPercent": 10, "color": "#E5E4E2"},
        {"name": "Бриллиант", "minPoints": 15000, "discountPercent": 15, "color": "#B9F2FF"}
    ]'::jsonb,
    
    -- Настройки шеринга
    share_title VARCHAR(255) DEFAULT 'Посмотри этот товар!',
    share_text TEXT DEFAULT 'Рекомендую этот товар от ЭТРА 🌿',
    enabled_sources JSONB DEFAULT '["telegram", "vk", "whatsapp", "copy"]'::jsonb,
    
    -- Срок жизни реферальной метки (дней)
    cookie_lifetime_days INTEGER DEFAULT 30,
    
    -- Минимальная сумма заказа для начисления очков
    min_order_amount_for_points INTEGER DEFAULT 0,
    
    -- При каком статусе начислять очки
    award_on_status VARCHAR(20) DEFAULT 'paid',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставить начальные настройки если таблица пустая
INSERT INTO referral_settings (id, enabled)
SELECT 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM referral_settings WHERE id = 1);

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
