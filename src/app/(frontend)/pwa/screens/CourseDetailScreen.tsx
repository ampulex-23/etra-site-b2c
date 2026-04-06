'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../../auth/AuthProvider'
import { RichText } from '../../components/RichText'

interface CohortInfo {
  id: string
  title: string
  status: string
  startDate: string
  endDate: string | null
  maxParticipants: number
  currentParticipants: number
  isFull: boolean
}

interface TeamMember {
  name: string
  role: string
  avatar: string | null
}

interface ModuleInfo {
  id: string
  title: string
  slug: string
  type: string
  icon: string
  description: string
}

interface ResultInfo {
  id: string
  type: string
  text: string
  photos: { url: string | null; caption: string }[]
  weightBefore: number | null
  weightAfter: number | null
  effects: { category: string; description: string }[]
  publishedAt: string
}

interface CourseDetail {
  id: string
  title: string
  slug: string
  type: string
  shortDescription: string
  description: any
  coverImage: string | null
  price: number
  oldPrice: number | null
  durationDays: number
  productBundle: { id: string; title: string } | null
  scheduleMorning: any
  scheduleDay: any
  scheduleEvening: any
  dietRecommendations: any
  contraindications: any
  rules: any
  reportTemplate: { item: string; emoji: string }[]
  team: TeamMember[]
  seo: any
}

const typeLabels: Record<string, string> = {
  course: 'Курс',
  marathon: 'Марафон',
  program: 'Программа',
  retreat: 'Ретрит',
}

export function CourseDetailScreen() {
  const params = useParams()
  const router = useRouter()
  const { customer } = useAuth()

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [cohorts, setCohorts] = useState<CohortInfo[]>([])
  const [modules, setModules] = useState<ModuleInfo[]>([])
  const [results, setResults] = useState<ResultInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    if (params.slug) fetchCourse(params.slug as string)
  }, [params.slug])

  const fetchCourse = async (slug: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/public-infoproducts/${slug}`)
      if (!res.ok) {
        router.replace('/courses')
        return
      }
      const data = await res.json()
      setCourse(data.infoproduct)
      setCohorts(data.cohorts || [])
      setModules(data.modules || [])
      setResults(data.results || [])
    } catch (err) {
      console.error('Error fetching course:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatPrice = (price: number) => price.toLocaleString('ru-RU')

  const availableCohorts = cohorts.filter((c) => !c.isFull)
  const discount =
    course?.oldPrice && course.oldPrice > course.price
      ? Math.round(((course.oldPrice - course.price) / course.oldPrice) * 100)
      : 0

  if (loading) {
    return (
      <div className="pwa-screen animate-in" style={{ textAlign: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="pwa-screen pwa-screen--flush animate-in">
      {/* Hero */}
      <div className="course-hero">
        {course.coverImage ? (
          <Image
            src={course.coverImage}
            alt={course.title}
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        ) : (
          <div className="course-hero__placeholder" />
        )}
        <div className="course-hero__overlay" />
        <div className="course-hero__content">
          <div className="course-hero__type">
            {typeLabels[course.type] || course.type} · {course.durationDays} дней
          </div>
          <h1 className="course-hero__title">{course.title}</h1>
          {course.shortDescription && (
            <p className="course-hero__desc">{course.shortDescription}</p>
          )}
          <div className="course-hero__price-row">
            {course.price > 0 ? (
              <>
                <span className="course-hero__price">{formatPrice(course.price)} ₽</span>
                {course.oldPrice && discount > 0 && (
                  <>
                    <span className="course-hero__old-price">{formatPrice(course.oldPrice)} ₽</span>
                    <span className="course-hero__discount">-{discount}%</span>
                  </>
                )}
              </>
            ) : (
              <span className="course-hero__price">Бесплатно</span>
            )}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      {availableCohorts.length > 0 && (
        <div className="course-sticky-cta">
          <Link
            href={`/courses/${course.slug}/enroll`}
            className="btn btn--primary btn--full"
          >
            Записаться на курс
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="course-tabs">
        <div className="pill-toggle" style={{ padding: '0 16px' }}>
          {[
            { key: 'about', label: 'О курсе' },
            { key: 'schedule', label: 'Расписание' },
            { key: 'team', label: 'Команда' },
            ...(results.length > 0 ? [{ key: 'results', label: 'Результаты' }] : []),
          ].map((tab) => (
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

      <div style={{ padding: '0 16px 100px' }}>
        {/* About tab */}
        {activeTab === 'about' && (
          <div className="course-section animate-in">
            {/* Description */}
            {course.description && (
              <div className="course-block">
                <h2 className="course-block__title">Описание</h2>
                <div className="course-block__content rich-text">
                  <RichText content={course.description} />
                </div>
              </div>
            )}

            {/* Modules */}
            {modules.length > 0 && (
              <div className="course-block">
                <h2 className="course-block__title">Что входит в программу</h2>
                <div className="course-modules-grid">
                  {modules.map((m) => (
                    <div key={m.id} className="course-module-card glass">
                      <div className="course-module-card__icon">{m.icon || '📋'}</div>
                      <div className="course-module-card__title">{m.title}</div>
                      {m.description && (
                        <div className="course-module-card__desc">{m.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report template */}
            {course.reportTemplate.length > 0 && (
              <div className="course-block">
                <h2 className="course-block__title">Ежедневный чек-лист</h2>
                <div className="glass" style={{ padding: 16 }}>
                  {course.reportTemplate.map((item, i) => (
                    <div key={i} className="course-checklist-item">
                      <span className="course-checklist-item__emoji">{item.emoji || '✅'}</span>
                      <span>{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diet */}
            {course.dietRecommendations && (
              <div className="course-block">
                <h2 className="course-block__title">🥗 Диетические рекомендации</h2>
                <div className="course-block__content rich-text glass" style={{ padding: 16 }}>
                  <RichText content={course.dietRecommendations} />
                </div>
              </div>
            )}

            {/* Contraindications */}
            {course.contraindications && (
              <div className="course-block">
                <h2 className="course-block__title">⚠️ Противопоказания</h2>
                <div className="course-block__content rich-text glass" style={{ padding: 16 }}>
                  <RichText content={course.contraindications} />
                </div>
              </div>
            )}

            {/* Rules */}
            {course.rules && (
              <div className="course-block">
                <h2 className="course-block__title">📜 Правила курса</h2>
                <div className="course-block__content rich-text glass" style={{ padding: 16 }}>
                  <RichText content={course.rules} />
                </div>
              </div>
            )}

            {/* Cohorts */}
            {cohorts.length > 0 && (
              <div className="course-block">
                <h2 className="course-block__title">Ближайшие потоки</h2>
                {cohorts.map((cohort) => (
                  <div key={cohort.id} className={`course-cohort-card glass ${cohort.isFull ? 'course-cohort-card--full' : ''}`}>
                    <div className="course-cohort-card__header">
                      <span className="course-cohort-card__title">{cohort.title}</span>
                      <span className={`course-cohort-card__status course-cohort-card__status--${cohort.status}`}>
                        {cohort.status === 'upcoming' ? 'Набор открыт' : 'Идёт'}
                      </span>
                    </div>
                    <div className="course-cohort-card__info">
                      <span>📅 {formatDate(cohort.startDate)}</span>
                      {cohort.maxParticipants > 0 && (
                        <span>👥 {cohort.currentParticipants}/{cohort.maxParticipants}</span>
                      )}
                    </div>
                    {cohort.isFull && (
                      <div className="course-cohort-card__full-badge">Все места заняты</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule tab */}
        {activeTab === 'schedule' && (
          <div className="course-section animate-in">
            <div className="course-block">
              <h2 className="course-block__title">Шаблон дня</h2>
              <p className="t-caption t-sec" style={{ marginBottom: 16 }}>
                Программа каждого дня строится по единому расписанию с индивидуальными дополнениями
              </p>
              {course.scheduleMorning && (
                <div className="course-schedule-block glass">
                  <div className="course-schedule-block__header">⭐️ Утро</div>
                  <div className="rich-text">
                    <RichText content={course.scheduleMorning} />
                  </div>
                </div>
              )}
              {course.scheduleDay && (
                <div className="course-schedule-block glass">
                  <div className="course-schedule-block__header">☀️ День</div>
                  <div className="rich-text">
                    <RichText content={course.scheduleDay} />
                  </div>
                </div>
              )}
              {course.scheduleEvening && (
                <div className="course-schedule-block glass">
                  <div className="course-schedule-block__header">🌙 Вечер</div>
                  <div className="rich-text">
                    <RichText content={course.scheduleEvening} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team tab */}
        {activeTab === 'team' && (
          <div className="course-section animate-in">
            <div className="course-block">
              <h2 className="course-block__title">Команда курса</h2>
              <div className="course-team-grid">
                {course.team.map((member, i) => (
                  <div key={i} className="course-team-card glass">
                    <div className="course-team-card__avatar">
                      {member.avatar ? (
                        <Image src={member.avatar} alt={member.name} width={64} height={64} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <span className="course-team-card__initials">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="course-team-card__name">{member.name}</div>
                    <div className="course-team-card__role">{member.role}</div>
                  </div>
                ))}
              </div>
              {course.team.length === 0 && (
                <div className="glass" style={{ padding: 24, textAlign: 'center' }}>
                  <p className="t-caption t-sec">Команда будет объявлена позже</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results tab */}
        {activeTab === 'results' && (
          <div className="course-section animate-in">
            <div className="course-block">
              <h2 className="course-block__title">Результаты участников</h2>
              {results.map((result) => (
                <div key={result.id} className="course-result-card glass">
                  <div className="course-result-card__text">&ldquo;{result.text}&rdquo;</div>
                  {(result.weightBefore || result.weightAfter) && (
                    <div className="course-result-card__weight">
                      {result.weightBefore && <span>До: {result.weightBefore} кг</span>}
                      {result.weightBefore && result.weightAfter && <span> → </span>}
                      {result.weightAfter && <span>После: {result.weightAfter} кг</span>}
                      {result.weightBefore && result.weightAfter && (
                        <span className="course-result-card__diff">
                          {' '}(-{(result.weightBefore - result.weightAfter).toFixed(1)} кг)
                        </span>
                      )}
                    </div>
                  )}
                  {result.photos.length > 0 && (
                    <div className="course-result-card__photos">
                      {result.photos.map((photo, i) => (
                        photo.url && (
                          <div key={i} className="course-result-card__photo">
                            <Image src={photo.url} alt={photo.caption || ''} width={120} height={120} style={{ borderRadius: 8, objectFit: 'cover' }} />
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  {result.effects.length > 0 && (
                    <div className="course-result-card__effects">
                      {result.effects.map((e, i) => (
                        <span key={i} className="course-result-card__effect-badge">{e.description || e.category}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
