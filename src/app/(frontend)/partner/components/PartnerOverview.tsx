'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function PartnerOverview({
  partner,
  settings,
  customerName,
}: {
  partner: any
  settings: any
  customerName: string
}) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const referralLink = `${baseUrl}/?promo=${partner.promoCode}`

  const handleCopy = async (text: string, what: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* ignore */
    }
  }

  const shareText = `Рекомендую ЭТРА 🌿 Скидка ${settings?.customerDiscountFirstPurchase || 10}% по промокоду ${partner.promoCode}`
  const shareLinks = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
    vk: `https://vk.com/share.php?url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralLink)}`,
  }

  return (
    <div>
      {/* Промокод */}
      <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f9fafb', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Ваш персональный промокод</div>
        <div
          onClick={() => handleCopy(partner.promoCode, 'code')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 24px',
            border: '2px dashed #4A7C59',
            borderRadius: 12,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#4A7C59',
            cursor: 'pointer',
            background: 'white',
          }}
        >
          {partner.promoCode}
          {copied === 'code' ? <Check size={20} /> : <Copy size={20} />}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 12, lineHeight: 1.5 }}>
          Клиенты получают скидку <strong>{settings?.customerDiscountFirstPurchase || 10}%</strong> на первую покупку<br />
          Вам: <strong>{settings?.commissionFirstPurchase || 10}%</strong> с первой, <strong>{settings?.commissionRepeatPurchase || 9}%</strong> с повторных — пожизненно
        </div>
      </div>

      {/* Статистика */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Баланс к выплате" value={`${partner.balance.toLocaleString('ru-RU')} ₽`} color="#10b981" />
        <StatCard label="Всего заработано" value={`${partner.totalEarned.toLocaleString('ru-RU')} ₽`} color="#4A7C59" />
        <StatCard label="Выплачено" value={`${partner.totalPaid.toLocaleString('ru-RU')} ₽`} color="#6b7280" />
      </div>

      {/* Ссылка */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Ваша реферальная ссылка</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={referralLink}
            readOnly
            className="input"
            style={{ flex: 1, fontSize: 13 }}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => handleCopy(referralLink, 'link')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
            {copied === 'link' ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
      </div>

      {/* Шеринг */}
      <div>
        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Поделиться</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ShareLink href={shareLinks.telegram} bg="#0088cc">Telegram</ShareLink>
          <ShareLink href={shareLinks.vk} bg="#4a76a8">ВКонтакте</ShareLink>
          <ShareLink href={shareLinks.whatsapp} bg="#25d366">WhatsApp</ShareLink>
        </div>
      </div>

      {/* QR-код */}
      <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>QR-код</h3>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`}
          alt="QR"
          style={{ display: 'block', borderRadius: 8 }}
        />
      </div>

      {/* Info */}
      {partner.status === 'pending' && (
        <div style={{ marginTop: 20, padding: 16, background: '#fef3c7', borderRadius: 8, color: '#78350f' }}>
          ⏳ Ваш партнёрский статус ожидает активации. Сделайте первую покупку от{' '}
          {(settings?.minOrderForMLMEntry || 7000).toLocaleString('ru-RU')}₽, чтобы активировать МЛМ-возможности.
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function ShareLink({ href, bg, children }: { href: string; bg: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flex: '1 1 120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 16px',
        background: bg,
        color: 'white',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {children}
    </a>
  )
}
