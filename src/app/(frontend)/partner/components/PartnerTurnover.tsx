'use client'

import { useState, useEffect, useCallback } from 'react'

export function PartnerTurnover({ token, settings }: { token: string; settings: any }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/referral/me/turnover?months=12', {
        headers: { Authorization: `JWT ${token}` },
      })
      if (res.ok) {
        const d = await res.json()
        setData(d.turnover || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div>Загрузка...</div>

  const threshold = settings?.teamBonusThreshold || 500000
  const teamBonusPercent = settings?.teamBonusPercent || 3
  const teamBonusEnabled = settings?.teamBonusEnabled

  // Текущий месяц
  const currentMonth = data[0]
  const currentTotal = Number(currentMonth?.totalTeamTurnover || 0)
  const progress = Math.min(100, (currentTotal / threshold) * 100)

  return (
    <div>
      {/* Прогресс до командного бонуса */}
      {teamBonusEnabled && (
        <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Прогресс до командного бонуса</h3>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            Текущий месяц: <strong>{currentTotal.toLocaleString('ru-RU')} ₽</strong> из{' '}
            <strong>{threshold.toLocaleString('ru-RU')} ₽</strong>
          </div>
          <div style={{ height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: progress >= 100 ? '#10b981' : '#4A7C59',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 13, marginTop: 8, color: currentMonth?.teamBonusAwarded ? '#10b981' : '#6b7280' }}>
            {currentMonth?.teamBonusAwarded
              ? `✅ Бонус начислен: ${Number(currentMonth.teamBonusAmount).toLocaleString('ru-RU')} ₽ (+${teamBonusPercent}%)`
              : `При достижении порога получаете +${teamBonusPercent}% от оборота команды`}
          </div>
        </div>
      )}

      {/* Таблица по месяцам */}
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>История по месяцам</h3>
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Пока нет данных по обороту</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={th}>Месяц</th>
                <th style={th}>Личные</th>
                <th style={th}>Ур. 1</th>
                <th style={th}>Ур. 2</th>
                <th style={th}>Ур. 3</th>
                <th style={th}>Всего команда</th>
                <th style={th}>Бонус</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.month} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={td}>{t.month}</td>
                  <td style={td}>{Number(t.personalSales).toLocaleString('ru-RU')} ₽</td>
                  <td style={td}>{Number(t.level1Turnover).toLocaleString('ru-RU')} ₽</td>
                  <td style={td}>{Number(t.level2Turnover).toLocaleString('ru-RU')} ₽</td>
                  <td style={td}>{Number(t.level3Turnover).toLocaleString('ru-RU')} ₽</td>
                  <td style={{ ...td, fontWeight: 600 }}>{Number(t.totalTeamTurnover).toLocaleString('ru-RU')} ₽</td>
                  <td style={td}>
                    {t.teamBonusAwarded
                      ? <span style={{ color: '#10b981', fontWeight: 600 }}>+{Number(t.teamBonusAmount).toLocaleString('ru-RU')} ₽</span>
                      : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = { padding: 10, fontSize: 12, fontWeight: 600, textAlign: 'left' as const }
const td: React.CSSProperties = { padding: 10, fontSize: 13 }
