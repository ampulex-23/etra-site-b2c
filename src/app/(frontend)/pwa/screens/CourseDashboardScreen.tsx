'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../auth/AuthProvider'
import { RichText } from '../../components/RichText'

interface DayInfo {
  id: string
  dayNumber: number
  date: string
  title: string
  morningBlock: any
  dayBlock: any
  eveningBlock: any
  specialNotes: string | null
  broadcast: { scheduled: boolean; time?: string; title?: string; type?: string; zoomLink?: string; recordingUrl?: string } | null
  sportProgram: any
}

interface ModuleInfo {
  id: string
  title: string
  slug: string
  type: string
  icon: string
  description: string
  content: any
}

interface ReportInfo {
  id: string
  date: string
  items: { label: string; completed: boolean }[]
  completionRate: number
  notes: string
  status: string
  submittedAt: string
  courseDay: string | null
}

interface ChatRoomInfo {
  id: string
  title: string
  type: string
}

interface DashboardData {
  enrollment: {
    id: string
    status: string
    hashtag: string
    currentDay: number
    reportStreak: number
    missedReports: number
    enrolledAt: string
  }
  infoproduct: {
    id: string
    title: string
    slug: string
    type: string
    durationDays: number
    coverImage: string | null
    reportTemplate: { item: string; emoji: string }[]
    reportRules: { maxMissed?: number }
    team: { name: string; role: string; avatar: string | null }[]
  }
  cohort: {
    id: string
    title: string
    status: string
    startDate: string
    endDate: string | null
  }
  days: DayInfo[]
  modules: ModuleInfo[]
  reports: ReportInfo[]
  chatRooms: ChatRoomInfo[]
  todayDay: DayInfo | null
  todayReport: ReportInfo | null
}

type TabKey = 'nav' | 'schedule' | 'report' | 'broadcasts' | 'results' | 'chat'

export function CourseDashboardScreen() {
  const params = useParams()
  const router = useRouter()
  const { customer, token } = useAuth()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('nav')
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null)

  // Report state
  const [reportItems, setReportItems] = useState<{ label: string; completed: boolean }[]>([])
  const [reportNotes, setReportNotes] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  // Result state
  const [resultText, setResultText] = useState('')
  const [weightBefore, setWeightBefore] = useState('')
  const [weightAfter, setWeightAfter] = useState('')
  const [submittingResult, setSubmittingResult] = useState(false)
  const [resultSuccess, setResultSuccess] = useState(false)

  const enrollmentId = params.enrollmentId as string

  const fetchDashboard = useCallback(async () => {
    if (!enrollmentId) return
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/dashboard`)
      if (!res.ok) {
        router.replace('/courses')
        return
      }
      const d = await res.json()
      setData(d)

      // Init report items from template
      if (d.infoproduct?.reportTemplate?.length > 0 && !d.todayReport) {
        setReportItems(
          d.infoproduct.reportTemplate.map((t: any) => ({
            label: `${t.emoji || '✅'} ${t.item}`,
            completed: false,
          })),
        )
      }

      // Set today's day as selected
      if (d.todayDay) {
        setSelectedDay(d.todayDay)
      } else if (d.days?.length > 0) {
        setSelectedDay(d.days[d.days.length - 1])
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [enrollmentId, router])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleReportToggle = (index: number) => {
    setReportItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, completed: !item.completed } : item,
      ),
    )
  }

  const handleSubmitReport = async () => {
    if (!token || !data) return
    setSubmittingReport(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/enrollments/${enrollmentId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: todayStr,
          items: reportItems,
          notes: reportNotes.trim() || undefined,
        }),
      })

      if (res.ok) {
        setReportSuccess(true)
        fetchDashboard()
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка подачи отчёта')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setSubmittingReport(false)
    }
  }

  const handleSubmitResult = async () => {
    if (!token || !resultText.trim()) return
    setSubmittingResult(true)
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: resultText.trim(),
          weightBefore: weightBefore ? parseFloat(weightBefore) : undefined,
          weightAfter: weightAfter ? parseFloat(weightAfter) : undefined,
        }),
      })

      if (res.ok) {
        setResultSuccess(true)
        setResultText('')
        setWeightBefore('')
        setWeightAfter('')
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка отправки результата')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setSubmittingResult(false)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  const isToday = (dateStr: string) => {
    if (!dateStr) return false
    return dateStr.split('T')[0] === new Date().toISOString().split('T')[0]
  }

  const isPast = (dateStr: string) => {
    if (!dateStr) return false
    return dateStr.split('T')[0] < new Date().toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="pwa-screen animate-in" style={{ textAlign: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!data || !customer) {
    return (
      <div className="pwa-screen animate-in" style={{ textAlign: 'center', padding: 40 }}>
        <p className="t-body t-sec">Курс не найден или нет доступа</p>
        <Link href="/courses" className="btn btn--secondary" style={{ marginTop: 16 }}>
          К курсам
        </Link>
      </div>
    )
  }

  const { enrollment, infoproduct, cohort, days, modules, reports, chatRooms, todayDay, todayReport } = data
  const progress = infoproduct.durationDays > 0
    ? Math.round((enrollment.currentDay / infoproduct.durationDays) * 100)
    : 0

  // Broadcasts: days with scheduled broadcast
  const broadcasts = days.filter((d) => d.broadcast?.scheduled)
  const upcomingBroadcasts = broadcasts.filter((d) => !isPast(d.date))
  const pastBroadcasts = broadcasts.filter((d) => isPast(d.date))

  // Reports by date for calendar view
  const reportsByDate = new Map<string, ReportInfo>()
  reports.forEach((r) => {
    if (r.date) reportsByDate.set(r.date.split('T')[0], r)
  })

  return (
    <div className="pwa-screen animate-in course-dashboard">
      {/* Header */}
      <div className="cdash-header glass">
        <div className="cdash-header__top">
          <div>
            <div className="cdash-header__type">{infoproduct.type === 'course' ? 'Курс' : infoproduct.type === 'marathon' ? 'Марафон' : 'Программа'}</div>
            <h1 className="cdash-header__title">{infoproduct.title}</h1>
            <div className="cdash-header__cohort">{cohort.title}</div>
          </div>
          {enrollment.hashtag && (
            <div className="cdash-header__hashtag">{enrollment.hashtag}</div>
          )}
        </div>
        {/* Progress bar */}
        <div className="cdash-progress">
          <div className="cdash-progress__bar">
            <div className="cdash-progress__fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <div className="cdash-progress__text">
            День {enrollment.currentDay} из {infoproduct.durationDays} ({progress}%)
          </div>
        </div>
        {/* Stats */}
        <div className="cdash-stats">
          <div className="cdash-stat">
            <div className="cdash-stat__value">🔥 {enrollment.reportStreak}</div>
            <div className="cdash-stat__label">стрик</div>
          </div>
          <div className="cdash-stat">
            <div className="cdash-stat__value">📋 {reports.length}</div>
            <div className="cdash-stat__label">отчётов</div>
          </div>
          <div className="cdash-stat">
            <div className="cdash-stat__value">⚠️ {enrollment.missedReports}</div>
            <div className="cdash-stat__label">пропусков</div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="cdash-tabs" style={{ overflowX: 'auto' }}>
        <div className="pill-toggle">
          {([
            { key: 'nav', label: '📋 Навигация' },
            { key: 'schedule', label: '📅 Расписание' },
            { key: 'report', label: '✅ Отчёт' },
            { key: 'broadcasts', label: '🎞 Эфиры' },
            { key: 'results', label: '🏆 Результаты' },
            ...(chatRooms.length > 0 ? [{ key: 'chat', label: '💬 Чат' }] : []),
          ] as { key: TabKey; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              className={`pill-toggle__item ${activeTab === tab.key ? 'pill-toggle__item--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="cdash-content">
        {/* ─── NAV TAB ─── */}
        {activeTab === 'nav' && (
          <div className="animate-in">
            {/* Today card */}
            {todayDay && (
              <div className="cdash-today glass" onClick={() => { setSelectedDay(todayDay); setActiveTab('schedule') }}>
                <div className="cdash-today__badge">Сегодня — День {todayDay.dayNumber}</div>
                <div className="cdash-today__title">{todayDay.title || `День ${todayDay.dayNumber}`}</div>
                {todayDay.broadcast?.scheduled && (
                  <div className="cdash-today__broadcast">
                    🎞 Эфир в {todayDay.broadcast.time}: {todayDay.broadcast.title}
                  </div>
                )}
                {!todayReport && (
                  <div className="cdash-today__report-hint">📝 Не забудьте сдать отчёт</div>
                )}
              </div>
            )}

            {/* Module grid */}
            <div className="cdash-nav-grid">
              {modules.map((m) => (
                <button
                  key={m.id}
                  className="cdash-nav-card glass"
                  onClick={() => {
                    if (m.type === 'schedule') setActiveTab('schedule')
                    else if (m.type === 'reports') setActiveTab('report')
                    else if (m.type === 'broadcasts' || m.type === 'qa') setActiveTab('broadcasts')
                    else if (m.type === 'results') setActiveTab('results')
                    else if (m.type === 'communication') setActiveTab('chat')
                    else if (m.type === 'recipes') router.push('/recipes')
                    else if (m.type === 'products') router.push('/catalog')
                  }}
                >
                  <div className="cdash-nav-card__icon">{m.icon || '📋'}</div>
                  <div className="cdash-nav-card__title">{m.title}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── SCHEDULE TAB ─── */}
        {activeTab === 'schedule' && (
          <div className="animate-in">
            {/* Day pills */}
            <div className="cdash-day-pills">
              {days.map((day) => {
                const hasReport = reportsByDate.has(day.date?.split('T')[0] || '')
                return (
                  <button
                    key={day.id}
                    className={`cdash-day-pill ${selectedDay?.id === day.id ? 'cdash-day-pill--active' : ''} ${isToday(day.date) ? 'cdash-day-pill--today' : ''} ${hasReport ? 'cdash-day-pill--reported' : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <span className="cdash-day-pill__num">{day.dayNumber}</span>
                    {day.date && (
                      <span className="cdash-day-pill__date">{formatDate(day.date)}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected day content */}
            {selectedDay && (
              <div className="cdash-day-content animate-in">
                <h3 className="cdash-day-content__title">
                  {selectedDay.title || `День ${selectedDay.dayNumber}`}
                  {isToday(selectedDay.date) && <span className="cdash-day-content__today-badge">сегодня</span>}
                </h3>

                {selectedDay.specialNotes && (
                  <div className="cdash-day-alert glass">
                    ❗️ {selectedDay.specialNotes}
                  </div>
                )}

                {selectedDay.morningBlock && (
                  <div className="cdash-day-block glass">
                    <div className="cdash-day-block__header">⭐️ Утро</div>
                    <div className="rich-text"><RichText content={selectedDay.morningBlock} /></div>
                  </div>
                )}

                {selectedDay.dayBlock && (
                  <div className="cdash-day-block glass">
                    <div className="cdash-day-block__header">☀️ День</div>
                    <div className="rich-text"><RichText content={selectedDay.dayBlock} /></div>
                  </div>
                )}

                {selectedDay.eveningBlock && (
                  <div className="cdash-day-block glass">
                    <div className="cdash-day-block__header">🌙 Вечер</div>
                    <div className="rich-text"><RichText content={selectedDay.eveningBlock} /></div>
                  </div>
                )}

                {selectedDay.sportProgram && (
                  <div className="cdash-day-block glass">
                    <div className="cdash-day-block__header">💪 Спорт</div>
                    <div className="rich-text"><RichText content={selectedDay.sportProgram} /></div>
                  </div>
                )}

                {selectedDay.broadcast?.scheduled && (
                  <div className="cdash-broadcast-card glass">
                    <div className="cdash-broadcast-card__header">
                      🎞 Эфир: {selectedDay.broadcast.title}
                    </div>
                    {selectedDay.broadcast.time && (
                      <div className="cdash-broadcast-card__time">⏰ {selectedDay.broadcast.time}</div>
                    )}
                    {selectedDay.broadcast.zoomLink && (
                      <a href={selectedDay.broadcast.zoomLink} target="_blank" rel="noopener noreferrer" className="btn btn--primary" style={{ marginTop: 8 }}>
                        Подключиться к Zoom
                      </a>
                    )}
                    {selectedDay.broadcast.recordingUrl && (
                      <a href={selectedDay.broadcast.recordingUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary" style={{ marginTop: 8 }}>
                        Смотреть запись
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── REPORT TAB ─── */}
        {activeTab === 'report' && (
          <div className="animate-in">
            {todayReport || reportSuccess ? (
              <div className="cdash-report-done glass">
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 className="t-h3">Отчёт за сегодня сдан!</h3>
                <p className="t-caption t-sec" style={{ marginTop: 8 }}>
                  Серия: {enrollment.reportStreak} 🔥
                </p>
              </div>
            ) : (
              <div className="cdash-report-form">
                <h3 className="t-h3" style={{ marginBottom: 16 }}>Отчёт за сегодня</h3>

                {/* Checklist */}
                <div className="cdash-checklist">
                  {reportItems.map((item, i) => (
                    <button
                      key={i}
                      className={`cdash-checklist__item glass ${item.completed ? 'cdash-checklist__item--done' : ''}`}
                      onClick={() => handleReportToggle(i)}
                    >
                      <span className="cdash-checklist__check">
                        {item.completed ? '✅' : '⬜️'}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Notes */}
                <textarea
                  className="input"
                  placeholder="Комментарий (необязательно)"
                  rows={3}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  style={{ marginTop: 12 }}
                />

                <button
                  className="btn btn--primary btn--full"
                  onClick={handleSubmitReport}
                  disabled={submittingReport}
                  style={{ marginTop: 16 }}
                >
                  {submittingReport ? 'Отправка...' : 'Отправить отчёт'}
                </button>
              </div>
            )}

            {/* Report history */}
            {reports.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 className="t-h3" style={{ marginBottom: 12 }}>История отчётов</h3>
                {reports.slice(0, 10).map((r) => (
                  <div key={r.id} className="cdash-report-history-item glass">
                    <div className="cdash-report-history-item__header">
                      <span>{formatDate(r.date)} — День</span>
                      <span className={`cdash-report-history-item__status cdash-report-history-item__status--${r.status}`}>
                        {r.status === 'submitted' ? '✅' : r.status === 'late' ? '⏰' : '❌'}
                      </span>
                    </div>
                    {r.completionRate !== undefined && (
                      <div className="cdash-report-history-item__rate">
                        Выполнение: {r.completionRate}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── BROADCASTS TAB ─── */}
        {activeTab === 'broadcasts' && (
          <div className="animate-in">
            {upcomingBroadcasts.length > 0 && (
              <div>
                <h3 className="t-h3" style={{ marginBottom: 12 }}>Предстоящие эфиры</h3>
                {upcomingBroadcasts.map((day) => (
                  <div key={day.id} className="cdash-broadcast-card glass">
                    <div className="cdash-broadcast-card__header">
                      {day.broadcast?.title || `Эфир дня ${day.dayNumber}`}
                    </div>
                    <div className="cdash-broadcast-card__meta">
                      📅 {formatDate(day.date)} {day.broadcast?.time && `⏰ ${day.broadcast.time}`}
                    </div>
                    {day.broadcast?.type && (
                      <div className="cdash-broadcast-card__type">
                        {day.broadcast.type === 'thematic' ? 'Тематический' : day.broadcast.type === 'qa' ? 'Вопрос-ответ' : 'Вводный'}
                      </div>
                    )}
                    {day.broadcast?.zoomLink && (
                      <a href={day.broadcast.zoomLink} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--sm" style={{ marginTop: 8 }}>
                        Подключиться
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {pastBroadcasts.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 className="t-h3" style={{ marginBottom: 12 }}>Записи эфиров</h3>
                {pastBroadcasts.map((day) => (
                  <div key={day.id} className="cdash-broadcast-card glass">
                    <div className="cdash-broadcast-card__header">
                      {day.broadcast?.title || `Эфир дня ${day.dayNumber}`}
                    </div>
                    <div className="cdash-broadcast-card__meta">
                      📅 {formatDate(day.date)}
                    </div>
                    {day.broadcast?.recordingUrl ? (
                      <a href={day.broadcast.recordingUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--sm" style={{ marginTop: 8 }}>
                        ▶️ Смотреть запись
                      </a>
                    ) : (
                      <div className="t-caption t-sec" style={{ marginTop: 8 }}>Запись скоро появится</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {broadcasts.length === 0 && (
              <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎞</div>
                <p className="t-body t-sec">Эфиры пока не запланированы</p>
              </div>
            )}
          </div>
        )}

        {/* ─── RESULTS TAB ─── */}
        {activeTab === 'results' && (
          <div className="animate-in">
            {resultSuccess ? (
              <div className="glass" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h3 className="t-h3">Результат отправлен!</h3>
                <p className="t-caption t-sec" style={{ marginTop: 8 }}>
                  После модерации он появится на странице курса.
                </p>
                <button className="btn btn--secondary" style={{ marginTop: 16 }} onClick={() => setResultSuccess(false)}>
                  Отправить ещё
                </button>
              </div>
            ) : (
              <div className="cdash-result-form">
                <h3 className="t-h3" style={{ marginBottom: 16 }}>Поделитесь результатом</h3>

                <textarea
                  className="input"
                  placeholder="Расскажите о вашем опыте и результатах..."
                  rows={5}
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                />

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label className="t-caption t-sec">Вес до (кг)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="Напр. 75"
                      value={weightBefore}
                      onChange={(e) => setWeightBefore(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="t-caption t-sec">Вес после (кг)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="Напр. 70"
                      value={weightAfter}
                      onChange={(e) => setWeightAfter(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="btn btn--primary btn--full"
                  onClick={handleSubmitResult}
                  disabled={submittingResult || !resultText.trim()}
                  style={{ marginTop: 16 }}
                >
                  {submittingResult ? 'Отправка...' : 'Отправить результат'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── CHAT TAB ─── */}
        {activeTab === 'chat' && (
          <div className="animate-in">
            {chatRooms.length > 0 ? (
              <div>
                <h3 className="t-h3" style={{ marginBottom: 12 }}>Чат-комнаты</h3>
                {chatRooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/courses/my/${enrollmentId}/chat/${room.id}`}
                    className="cdash-chatroom-card glass"
                  >
                    <div className="cdash-chatroom-card__icon">
                      {room.type === 'general' ? '💬' : room.type === 'support' ? '🛟' : '📢'}
                    </div>
                    <div className="cdash-chatroom-card__title">{room.title}</div>
                    <div className="cdash-chatroom-card__arrow">→</div>
                  </Link>
                ))}
                <p className="t-caption t-sec" style={{ marginTop: 12 }}>
                  Полноценный чат с WebSocket будет доступен после настройки сервера
                </p>
              </div>
            ) : (
              <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <p className="t-body t-sec">Чат-комнаты пока не созданы</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
