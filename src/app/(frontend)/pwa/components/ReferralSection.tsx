'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Users, TrendingUp, Gift, ExternalLink, Wallet } from 'lucide-react'

interface PartnerInfo {
  id: string | number
  promoCode: string
  type: string
  status: string
  balance: number
  totalEarned: number
  totalPaid: number
  isMLM: boolean
  partnerPriceEnabled: boolean
}

interface PartnerSettings {
  commissionFirstPurchase: number
  commissionRepeatPurchase: number
  customerDiscountFirstPurchase: number
  minPayoutAmount: number
  mlmEnabled: boolean
}

interface MeResponse {
  enabled: boolean
  partner: PartnerInfo | null
  settings?: PartnerSettings
}

interface ReferralSectionProps {
  token: string | null
}

export function ReferralSection({ token }: ReferralSectionProps) {
  const [data, setData] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchMe = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/referral/me', {
        headers: { Authorization: `JWT ${token}` },
      })
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  if (loading) {
    return (
      <div className="referral-section">
        <div className="loading-spinner">
          <div className="btn__spinner" />
        </div>
      </div>
    )
  }

  if (!data?.enabled) {
    return (
      <div className="referral-section">
        <div className="empty-state glass">
          <Gift size={48} strokeWidth={1.5} />
          <p>Реферальная программа временно недоступна</p>
        </div>
      </div>
    )
  }

  const partner = data.partner
  if (!partner) {
    return (
      <div className="referral-section">
        <div className="empty-state glass">
          <Gift size={48} strokeWidth={1.5} />
          <p>Войдите, чтобы участвовать в реферальной программе</p>
        </div>
      </div>
    )
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const referralLink = `${baseUrl}/?promo=${partner.promoCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(partner.promoCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const shareText = `Рекомендую ЭТРА 🌿 Скидка ${data.settings?.customerDiscountFirstPurchase || 10}% по промокоду ${partner.promoCode}`
  const shareLinks = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
    vk: `https://vk.com/share.php?url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralLink)}`,
  }

  return (
    <div className="referral-section">
      {/* Промокод */}
      <div className="referral-promo-card glass">
        <div className="referral-promo-card__label">Ваш промокод</div>
        <div className="referral-promo-code" onClick={handleCopyCode} title="Нажмите чтобы скопировать">
          {partner.promoCode}
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </div>
        <div className="referral-promo-card__desc">
          При использовании промокода ваши друзья получают скидку{' '}
          <strong>{data.settings?.customerDiscountFirstPurchase || 10}%</strong> на первую покупку.
          <br />
          Вам начисляется {data.settings?.commissionFirstPurchase || 10}% с первой покупки
          и {data.settings?.commissionRepeatPurchase || 9}% со всех повторных — пожизненно.
        </div>
      </div>

      {/* Баланс и статистика */}
      <div className="referral-stats">
        <div className="referral-stat glass">
          <Wallet size={24} />
          <div className="referral-stat__value">{partner.balance.toLocaleString('ru-RU')} ₽</div>
          <div className="referral-stat__label">Баланс к выплате</div>
        </div>
        <div className="referral-stat glass">
          <TrendingUp size={24} />
          <div className="referral-stat__value">{partner.totalEarned.toLocaleString('ru-RU')} ₽</div>
          <div className="referral-stat__label">Всего заработано</div>
        </div>
        <div className="referral-stat glass">
          <Users size={24} />
          <div className="referral-stat__value">{partner.totalPaid.toLocaleString('ru-RU')} ₽</div>
          <div className="referral-stat__label">Выплачено</div>
        </div>
      </div>

      {/* Ссылка и шеринг */}
      <div className="referral-link-card glass">
        <h4>Ваша реферальная ссылка</h4>
        <div className="referral-link-input">
          <input type="text" value={referralLink} readOnly className="input" />
          <button type="button" className="btn btn--primary" onClick={handleCopy}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
        <div className="referral-share-buttons">
          <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer" className="referral-share-btn" style={{ background: '#0088cc' }}>
            Telegram
          </a>
          <a href={shareLinks.vk} target="_blank" rel="noopener noreferrer" className="referral-share-btn" style={{ background: '#4a76a8' }}>
            ВКонтакте
          </a>
          <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="referral-share-btn" style={{ background: '#25d366' }}>
            WhatsApp
          </a>
        </div>
      </div>

      {/* CTA — открыть полный ЛК */}
      <a href="/partner" className="btn btn--secondary referral-open-dashboard">
        <ExternalLink size={18} />
        Открыть полный кабинет партнёра
      </a>

      <style jsx>{`
        .referral-section { display: flex; flex-direction: column; gap: 16px; }
        .referral-promo-card { padding: 24px; border-radius: 16px; text-align: center; }
        .referral-promo-card__label { font-size: 14px; color: #666; margin-bottom: 8px; }
        .referral-promo-code {
          font-size: 28px; font-weight: 700; letter-spacing: 2px;
          color: var(--c-primary, #4A7C59);
          padding: 16px;
          border: 2px dashed var(--c-primary, #4A7C59);
          border-radius: 12px;
          display: inline-flex; align-items: center; gap: 12px;
          cursor: pointer; transition: background 0.2s;
          margin-bottom: 12px;
        }
        .referral-promo-code:hover { background: rgba(74,124,89,0.05); }
        .referral-promo-card__desc { font-size: 13px; color: #666; line-height: 1.5; }
        .referral-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .referral-stat { padding: 16px; border-radius: 12px; text-align: center; }
        .referral-stat svg { color: var(--c-primary, #4A7C59); margin-bottom: 8px; }
        .referral-stat__value { font-size: 16px; font-weight: 700; color: #333; }
        .referral-stat__label { font-size: 11px; color: #666; margin-top: 4px; }
        .referral-link-card { padding: 20px; border-radius: 16px; }
        .referral-link-card h4 { margin: 0 0 12px; font-size: 16px; }
        .referral-link-input { display: flex; gap: 8px; margin-bottom: 12px; }
        .referral-link-input .input { flex: 1; font-size: 12px; }
        .referral-link-input .btn { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .referral-share-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .referral-share-btn {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 10px 16px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          color: white; text-decoration: none;
          transition: opacity 0.2s;
        }
        .referral-share-btn:hover { opacity: 0.9; }
        .referral-open-dashboard {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          text-decoration: none; padding: 12px;
        }
        @media (max-width: 480px) {
          .referral-stats { grid-template-columns: 1fr; }
          .referral-link-input { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
