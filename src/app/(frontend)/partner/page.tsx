'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '../auth/AuthProvider'
import { PartnerOverview } from './components/PartnerOverview'
import { PartnerNetwork } from './components/PartnerNetwork'
import { PartnerCommissions } from './components/PartnerCommissions'
import { PartnerTurnover } from './components/PartnerTurnover'
import { PartnerInvitations } from './components/PartnerInvitations'
import { PartnerPayouts } from './components/PartnerPayouts'
import { PartnerMaterials } from './components/PartnerMaterials'

type Tab = 'overview' | 'network' | 'commissions' | 'turnover' | 'invitations' | 'payouts' | 'materials'

export default function PartnerDashboard() {
  const { customer, token, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [partnerData, setPartnerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
        const data = await res.json()
        setPartnerData(data)
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

  if (authLoading || loading) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="btn__spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>
          <h2>Войдите в аккаунт</h2>
          <p>Чтобы получить доступ к кабинету партнёра</p>
          <Link href="/auth" className="btn btn--primary">Войти</Link>
        </div>
      </div>
    )
  }

  if (!partnerData?.enabled) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>
          <h2>Реферальная программа отключена</h2>
          <p>Приходите позже</p>
        </div>
      </div>
    )
  }

  const partner = partnerData.partner
  const settings = partnerData.settings

  if (!partner) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>
          <h2>Создание партнёрского аккаунта...</h2>
          <button className="btn btn--primary" onClick={fetchMe}>Обновить</button>
        </div>
      </div>
    )
  }

  const isMLM = partner.type === 'mlm_partner'

  const tabs: { key: Tab; label: string; mlmOnly?: boolean }[] = [
    { key: 'overview', label: '📊 Обзор' },
    { key: 'network', label: '👥 Моя сеть', mlmOnly: true },
    { key: 'commissions', label: '💸 Начисления' },
    { key: 'turnover', label: '📈 Оборот команды', mlmOnly: true },
    { key: 'invitations', label: '✉️ Инвайты', mlmOnly: true },
    { key: 'payouts', label: '💰 Выплаты' },
    { key: 'materials', label: '📚 Материалы' },
  ]

  const visibleTabs = tabs.filter((t) => !t.mlmOnly || isMLM)

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Кабинет партнёра</h1>
          <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            {customer.name || customer.email} •{' '}
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              background: PARTNER_TYPE_COLORS[partner.type] || '#e5e7eb',
              color: 'white',
            }}>
              {PARTNER_TYPE_LABELS[partner.type] || partner.type}
            </span>
          </div>
        </div>
        <Link href="/account" style={backLinkStyle}>← В личный кабинет</Link>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              ...tabStyle,
              ...(activeTab === t.key ? activeTabStyle : {}),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={contentStyle}>
        {activeTab === 'overview' && (
          <PartnerOverview partner={partner} settings={settings} customerName={customer.name || customer.email} />
        )}
        {activeTab === 'network' && isMLM && <PartnerNetwork token={token!} />}
        {activeTab === 'commissions' && <PartnerCommissions token={token!} />}
        {activeTab === 'turnover' && isMLM && <PartnerTurnover token={token!} settings={settings} />}
        {activeTab === 'invitations' && isMLM && <PartnerInvitations token={token!} />}
        {activeTab === 'payouts' && <PartnerPayouts token={token!} partner={partner} settings={settings} onUpdate={fetchMe} />}
        {activeTab === 'materials' && <PartnerMaterials />}
      </div>
    </div>
  )
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  client: 'Клиент-реферал',
  blogger_paid: 'Блогер (оплата)',
  blogger_barter: 'Блогер (бартер)',
  mlm_partner: 'МЛМ-партнёр',
}

const PARTNER_TYPE_COLORS: Record<string, string> = {
  client: '#60a5fa',
  blogger_paid: '#a855f7',
  blogger_barter: '#ec4899',
  mlm_partner: '#10b981',
}

const pageStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px 16px',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
  flexWrap: 'wrap',
  gap: 12,
}

const backLinkStyle: React.CSSProperties = {
  color: '#6b7280',
  textDecoration: 'none',
  fontSize: 14,
}

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  marginBottom: 16,
  overflowX: 'auto',
  paddingBottom: 4,
}

const tabStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  color: '#6b7280',
  borderRadius: 8,
  whiteSpace: 'nowrap',
  transition: 'all 0.2s',
}

const activeTabStyle: React.CSSProperties = {
  background: '#4A7C59',
  color: 'white',
}

const contentStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}

const emptyCardStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 60,
  background: 'white',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}
