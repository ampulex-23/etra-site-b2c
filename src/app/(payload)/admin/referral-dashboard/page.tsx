import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function loadData() {
  const payload = await getPayload({ config })

  const [partners, commissions, payouts, applications] = await Promise.all([
    payload.find({
      collection: 'referral-partners' as any,
      limit: 10,
      sort: '-totalEarned',
      depth: 1,
    }),
    payload.find({
      collection: 'commissions' as any,
      limit: 0,
      where: { status: { equals: 'pending' } },
    }),
    payload.find({
      collection: 'referral-payouts' as any,
      limit: 0,
      where: { status: { in: ['requested', 'approved', 'processing'] } },
    }),
    payload.find({
      collection: 'partner-applications' as any,
      limit: 0,
      where: { status: { in: ['new', 'reviewing'] } },
    }),
  ])

  // Итоговые суммы
  const allCommissions = await payload.find({
    collection: 'commissions' as any,
    limit: 10000,
    depth: 0,
  })

  const totalCommissionsAmount = allCommissions.docs.reduce(
    (s: number, c: any) => s + Number(c.amount || 0),
    0,
  )
  const pendingCommissionsAmount = allCommissions.docs
    .filter((c: any) => c.status === 'pending')
    .reduce((s: number, c: any) => s + Number(c.amount || 0), 0)

  return {
    topPartners: partners.docs,
    totalPartners: partners.totalDocs,
    pendingCommissionsCount: commissions.totalDocs,
    pendingPayoutsCount: payouts.totalDocs,
    pendingApplicationsCount: applications.totalDocs,
    totalCommissionsAmount,
    pendingCommissionsAmount,
  }
}

export default async function ReferralDashboardPage() {
  const data = await loadData()

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        🎯 Реферальная программа — Дашборд
      </h1>

      {/* Основные метрики */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <MetricCard title="Партнёров всего" value={data.totalPartners} />
        <MetricCard title="Всего начислено" value={`${data.totalCommissionsAmount.toLocaleString('ru-RU')} ₽`} />
        <MetricCard title="К выплате (pending)" value={`${data.pendingCommissionsAmount.toLocaleString('ru-RU')} ₽`} />
        <MetricCard title="Заявок партнёров" value={data.pendingApplicationsCount} highlight={data.pendingApplicationsCount > 0} />
        <MetricCard title="Заявок на выплату" value={data.pendingPayoutsCount} highlight={data.pendingPayoutsCount > 0} />
      </div>

      {/* Быстрые действия */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Быстрые действия</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/admin/collections/referral-payouts?where[status][in][0]=requested&where[status][in][1]=approved" style={linkBtn}>
            Заявки на выплату ({data.pendingPayoutsCount})
          </Link>
          <Link href="/admin/collections/partner-applications?where[status][in][0]=new" style={linkBtn}>
            Новые заявки партнёров ({data.pendingApplicationsCount})
          </Link>
          <Link href="/admin/collections/commissions?where[status][equals]=pending" style={linkBtn}>
            Комиссии на проверке ({data.pendingCommissionsCount})
          </Link>
          <Link href="/api/admin/referral/payouts-csv" style={{ ...linkBtn, background: '#0f766e', color: 'white' }}>
            📥 Экспорт CSV выплат
          </Link>
          <Link href="/api/admin/referral/commissions-csv" style={{ ...linkBtn, background: '#0f766e', color: 'white' }}>
            📥 Экспорт CSV комиссий
          </Link>
        </div>
      </div>

      {/* Топ-10 партнёров */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>🏆 Топ-10 партнёров по заработку</h2>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={thStyle}>Промокод</th>
                <th style={thStyle}>Клиент</th>
                <th style={thStyle}>Тип</th>
                <th style={thStyle}>Баланс</th>
                <th style={thStyle}>Заработано</th>
                <th style={thStyle}>Выплачено</th>
              </tr>
            </thead>
            <tbody>
              {data.topPartners.map((p: any) => (
                <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>
                    <Link href={`/admin/collections/referral-partners/${p.id}`} style={{ fontWeight: 600, color: '#0369a1' }}>
                      {p.promoCode}
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    {typeof p.customer === 'object' ? p.customer?.name || p.customer?.email : '—'}
                  </td>
                  <td style={tdStyle}>{TYPE_LABELS[p.type] || p.type}</td>
                  <td style={tdStyle}>{Number(p.balance || 0).toLocaleString('ru-RU')} ₽</td>
                  <td style={tdStyle}>{Number(p.totalEarned || 0).toLocaleString('ru-RU')} ₽</td>
                  <td style={tdStyle}>{Number(p.totalPaid || 0).toLocaleString('ru-RU')} ₽</td>
                </tr>
              ))}
              {data.topPartners.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                    Пока нет партнёров
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const TYPE_LABELS: Record<string, string> = {
  client: 'Клиент',
  blogger_paid: 'Блогер (оплата)',
  blogger_barter: 'Блогер (бартер)',
  mlm_partner: 'МЛМ',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: 12,
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
}

const tdStyle: React.CSSProperties = {
  padding: 12,
  fontSize: 14,
}

const linkBtn: React.CSSProperties = {
  padding: '8px 14px',
  background: '#f3f4f6',
  borderRadius: 6,
  textDecoration: 'none',
  color: '#111',
  fontSize: 14,
  fontWeight: 500,
}

function MetricCard({
  title,
  value,
  highlight,
}: {
  title: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      style={{
        padding: 16,
        background: highlight ? '#fef3c7' : '#f9fafb',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  )
}
