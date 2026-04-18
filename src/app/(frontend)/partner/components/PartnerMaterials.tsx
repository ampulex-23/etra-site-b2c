'use client'

export function PartnerMaterials() {
  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Обучение и материалы</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <MaterialCard
          icon="🧬"
          title="Что такое энзимы и микробиом"
          description="Обучающее видео для понимания продукта"
          link="/materials/enzymes-intro"
        />
        <MaterialCard
          icon="💬"
          title="Как рассказывать о продукте"
          description="Скрипты и примеры живых разговоров"
          link="/materials/sales-scripts"
        />
        <MaterialCard
          icon="📋"
          title="Карточки продуктов"
          description="Готовые материалы для соцсетей"
          link="/materials/product-cards"
        />
        <MaterialCard
          icon="🎥"
          title="Презентация продукта"
          description="Для встреч и видео-звонков"
          link="/materials/presentation"
        />
        <MaterialCard
          icon="🎁"
          title="Стартовый набор партнёра"
          description="Состав, цены, как презентовать"
          link="/materials/starter-kit"
        />
        <MaterialCard
          icon="❓"
          title="FAQ партнёра"
          description="Частые вопросы и ответы"
          link="/materials/faq"
        />
      </div>

      <div style={{ marginTop: 24, padding: 16, background: '#f0f9ff', borderRadius: 12, fontSize: 13, color: '#075985' }}>
        💡 Материалы готовятся. Если нужны конкретные материалы — напишите нам в поддержку.
      </div>
    </div>
  )
}

function MaterialCard({
  icon,
  title,
  description,
  link,
}: {
  icon: string
  title: string
  description: string
  link: string
}) {
  return (
    <a
      href={link}
      style={{
        display: 'block',
        padding: 16,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>{description}</div>
    </a>
  )
}
