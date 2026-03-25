'use client'

import React, { useEffect, useState } from 'react'

interface CohortStats {
  id: string
  title: string
  infoproductTitle: string
  status: string
  startDate: string
  endDate: string | null
  currentDay: number
  totalDays: number
  totalParticipants: number
  activeParticipants: number
  expelledCount: number
  todayReportsSubmitted: number
  todayReportsTotal: number
  nextBroadcast: {
    dayNumber: number
    title: string
    time: string
    date: string
  } | null
}

export default function InfproductsDashboard() {
  const [cohorts, setCohorts] = useState<CohortStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError(null)
    try {
      // Fetch active cohorts
      const cohortsRes = await fetch('/api/course-cohorts?where[status][equals]=active&depth=1&limit=50')
      if (!cohortsRes.ok) throw new Error('Failed to fetch cohorts')
      const cohortsData = await cohortsRes.json()

      const stats: CohortStats[] = []
      const today = new Date().toISOString().split('T')[0]

      for (const cohort of cohortsData.docs) {
        const infoproduct = typeof cohort.infoproduct === 'object' ? cohort.infoproduct : null
        const totalDays = infoproduct?.durationDays || 30
        const startDate = new Date(cohort.startDate)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const currentDay = Math.max(1, Math.min(daysDiff + 1, totalDays))

        // Fetch enrollment stats
        const enrollmentsRes = await fetch(
          `/api/enrollments?where[cohort][equals]=${cohort.id}&limit=0&depth=0`
        )
        const enrollmentsData = await enrollmentsRes.json()

        const activeEnrollmentsRes = await fetch(
          `/api/enrollments?where[cohort][equals]=${cohort.id}&where[status][equals]=active&limit=0&depth=0`
        )
        const activeData = await activeEnrollmentsRes.json()

        const expelledRes = await fetch(
          `/api/enrollments?where[cohort][equals]=${cohort.id}&where[status][equals]=expelled&limit=0&depth=0`
        )
        const expelledData = await expelledRes.json()

        // Fetch today's reports
        const reportsRes = await fetch(
          `/api/participant-reports?where[enrollment][cohort][equals]=${cohort.id}&where[date][equals]=${today}&where[status][not_equals]=missed&limit=0&depth=0`
        )
        const reportsData = await reportsRes.json()

        // Fetch next broadcast
        let nextBroadcast: CohortStats['nextBroadcast'] = null
        const daysRes = await fetch(
          `/api/course-days?where[cohort][equals]=${cohort.id}&where[broadcast.scheduled][equals]=true&where[date][greater_than_equal]=${today}&sort=date&limit=1&depth=0`
        )
        const daysData = await daysRes.json()
        if (daysData.docs?.[0]) {
          const bd = daysData.docs[0]
          nextBroadcast = {
            dayNumber: bd.dayNumber,
            title: bd.broadcast?.title || 'Эфир',
            time: bd.broadcast?.time || '',
            date: bd.date,
          }
        }

        stats.push({
          id: cohort.id,
          title: cohort.title,
          infoproductTitle: infoproduct?.title || '—',
          status: cohort.status,
          startDate: cohort.startDate,
          endDate: cohort.endDate,
          currentDay,
          totalDays,
          totalParticipants: enrollmentsData.totalDocs || 0,
          activeParticipants: activeData.totalDocs || 0,
          expelledCount: expelledData.totalDocs || 0,
          todayReportsSubmitted: reportsData.totalDocs || 0,
          todayReportsTotal: activeData.totalDocs || 0,
          nextBroadcast,
        })
      }

      setCohorts(stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const reportPercent = (submitted: number, total: number) => {
    if (total === 0) return 0
    return Math.round((submitted / total) * 100)
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        Загрузка дашборда...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#c00' }}>
        Ошибка: {error}
      </div>
    )
  }

  if (cohorts.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        Нет активных потоков
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 600 }}>
        📊 Дашборд инфопродуктов
      </h2>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))' }}>
        {cohorts.map((c) => (
          <div
            key={c.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 12,
              padding: 20,
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{c.infoproductTitle}</div>
              </div>
              <span
                style={{
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                День {c.currentDay} / {c.totalDays}
              </span>
            </div>

            <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              {formatDate(c.startDate)} — {c.endDate ? formatDate(c.endDate) : '...'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <StatBox label="Участники" value={`${c.activeParticipants} / ${c.totalParticipants}`} />
              <StatBox label="Исключены" value={String(c.expelledCount)} warn={c.expelledCount > 0} />
              <StatBox
                label="Отчёты сегодня"
                value={`${c.todayReportsSubmitted} / ${c.todayReportsTotal}`}
                sub={`${reportPercent(c.todayReportsSubmitted, c.todayReportsTotal)}%`}
              />
            </div>

            {c.nextBroadcast && (
              <div
                style={{
                  background: '#f3f0ff',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                🎥 <strong>Ближайший эфир:</strong> День {c.nextBroadcast.dayNumber} —{' '}
                {c.nextBroadcast.title}{' '}
                {c.nextBroadcast.time && `(${c.nextBroadcast.time})`}{' '}
                · {formatDate(c.nextBroadcast.date)}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <QuickLink href={`/admin/collections/enrollments?where[cohort][equals]=${c.id}`} label="Записи" />
              <QuickLink
                href={`/admin/collections/participant-reports?where[date][equals]=${new Date().toISOString().split('T')[0]}`}
                label="Отчёты за сегодня"
              />
              <QuickLink href={`/admin/collections/course-days?where[cohort][equals]=${c.id}`} label="Дни" />
              <QuickLink href={`/admin/collections/course-results?where[status][equals]=pending`} label="На модерации" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatBox({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div
      style={{
        background: warn ? '#fff3e0' : '#f5f5f5',
        borderRadius: 8,
        padding: '8px 12px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, color: warn ? '#e65100' : '#333' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#888' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa' }}>{sub}</div>}
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{
        fontSize: 12,
        padding: '4px 10px',
        borderRadius: 6,
        background: '#f0f0f0',
        color: '#555',
        textDecoration: 'none',
        border: '1px solid #ddd',
      }}
    >
      {label} →
    </a>
  )
}
