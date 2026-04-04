'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ReferralStats {
  totalCustomers: number
  activeReferrers: number
  totalReferrals: number
  totalPointsAwarded: number
  totalReferralRevenue: number
  topReferrers: TopReferrer[]
  recentReferrals: RecentReferral[]
}

interface TopReferrer {
  id: string
  name: string
  email: string
  referralCode: string
  experiencePoints: number
  referralLevel: string
  totalReferrals: number
  totalReferralOrders: number
  totalReferralRevenue: number
}

interface RecentReferral {
  id: string
  referrer: { id: string; name: string; email: string } | null
  referred: { id: string; name: string; email: string } | null
  order: { id: string; orderNumber: string; total: number } | null
  status: string
  pointsAwarded: number
  createdAt: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  click: { label: 'Клик', color: '#9CA3AF' },
  registration: { label: 'Регистрация', color: '#3B82F6' },
  order_placed: { label: 'Заказ оформлен', color: '#F59E0B' },
  order_paid: { label: 'Заказ оплачен', color: '#8B5CF6' },
  points_awarded: { label: 'Очки начислены', color: '#10B981' },
}

export default function ReferralProgramPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/referral-stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Реферальная программа</h1>
        <Link href="/admin/globals/referral-settings" style={styles.settingsLink}>
          ⚙️ Настройки
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats?.totalCustomers || 0}</div>
          <div style={styles.statLabel}>Всего клиентов</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats?.activeReferrers || 0}</div>
          <div style={styles.statLabel}>Активных рефереров</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats?.totalReferrals || 0}</div>
          <div style={styles.statLabel}>Всего рефералов</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats?.totalPointsAwarded?.toLocaleString('ru-RU') || 0}</div>
          <div style={styles.statLabel}>Очков начислено</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats?.totalReferralRevenue?.toLocaleString('ru-RU') || 0} ₽</div>
          <div style={styles.statLabel}>Выручка по рефералам</div>
        </div>
      </div>

      {/* Top Referrers */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Топ рефереров</h2>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Клиент</th>
                <th style={styles.th}>Код</th>
                <th style={styles.th}>Уровень</th>
                <th style={styles.th}>Очки</th>
                <th style={styles.th}>Рефералов</th>
                <th style={styles.th}>Заказов</th>
                <th style={styles.th}>Выручка</th>
              </tr>
            </thead>
            <tbody>
              {stats?.topReferrers?.map((referrer) => (
                <tr key={referrer.id}>
                  <td style={styles.td}>
                    <Link href={`/admin/collections/customers/${referrer.id}`} style={styles.link}>
                      <div>{referrer.name || 'Без имени'}</div>
                      <div style={styles.email}>{referrer.email}</div>
                    </Link>
                  </td>
                  <td style={styles.td}>
                    <code style={styles.code}>{referrer.referralCode}</code>
                  </td>
                  <td style={styles.td}>{referrer.referralLevel || '—'}</td>
                  <td style={styles.td}>{referrer.experiencePoints?.toLocaleString('ru-RU')}</td>
                  <td style={styles.td}>{referrer.totalReferrals}</td>
                  <td style={styles.td}>{referrer.totalReferralOrders}</td>
                  <td style={styles.td}>{referrer.totalReferralRevenue?.toLocaleString('ru-RU')} ₽</td>
                </tr>
              ))}
              {(!stats?.topReferrers || stats.topReferrers.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#666' }}>
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Referrals */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Последние рефералы</h2>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Дата</th>
                <th style={styles.th}>Реферер</th>
                <th style={styles.th}>Приглашённый</th>
                <th style={styles.th}>Заказ</th>
                <th style={styles.th}>Статус</th>
                <th style={styles.th}>Очки</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentReferrals?.map((referral) => {
                const status = STATUS_LABELS[referral.status] || { label: referral.status, color: '#666' }
                return (
                  <tr key={referral.id}>
                    <td style={styles.td}>
                      {new Date(referral.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={styles.td}>
                      {referral.referrer ? (
                        <Link href={`/admin/collections/customers/${referral.referrer.id}`} style={styles.link}>
                          {referral.referrer.name || referral.referrer.email}
                        </Link>
                      ) : '—'}
                    </td>
                    <td style={styles.td}>
                      {referral.referred ? (
                        <Link href={`/admin/collections/customers/${referral.referred.id}`} style={styles.link}>
                          {referral.referred.name || referral.referred.email}
                        </Link>
                      ) : '—'}
                    </td>
                    <td style={styles.td}>
                      {referral.order ? (
                        <Link href={`/admin/collections/orders/${referral.order.id}`} style={styles.link}>
                          #{referral.order.orderNumber} ({referral.order.total?.toLocaleString('ru-RU')} ₽)
                        </Link>
                      ) : '—'}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {referral.pointsAwarded > 0 ? `+${referral.pointsAwarded}` : '—'}
                    </td>
                  </tr>
                )
              })}
              {(!stats?.recentReferrals || stats.recentReferrals.length === 0) && (
                <tr>
                  <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#666' }}>
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Link href="/admin/collections/referrals" style={styles.viewAllLink}>
          Смотреть все рефералы →
        </Link>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    margin: 0,
  },
  settingsLink: {
    padding: '8px 16px',
    background: '#f0f0f0',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#333',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '48px',
    color: '#ef4444',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
  },
  section: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '2px solid #e5e5e5',
    fontSize: '13px',
    fontWeight: 600,
    color: '#666',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
  email: {
    fontSize: '12px',
    color: '#666',
  },
  code: {
    background: '#f5f5f5',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'white',
  },
  viewAllLink: {
    display: 'inline-block',
    marginTop: '16px',
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '14px',
  },
}
