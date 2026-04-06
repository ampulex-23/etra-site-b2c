'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../../auth/AuthProvider'

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

interface CourseBasic {
  id: string
  title: string
  slug: string
  type: string
  coverImage: string | null
  price: number
  oldPrice: number | null
  durationDays: number
}

const typeLabels: Record<string, string> = {
  course: 'Курс',
  marathon: 'Марафон',
  program: 'Программа',
  retreat: 'Ретрит',
}

export function CourseEnrollScreen() {
  const params = useParams()
  const router = useRouter()
  const { customer, token } = useAuth()

  const [course, setCourse] = useState<CourseBasic | null>(null)
  const [cohorts, setCohorts] = useState<CohortInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  const [hashtag, setHashtag] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ enrollmentId: string; requiresPayment: boolean } | null>(null)

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
      const available = (data.cohorts || []).filter((c: CohortInfo) => !c.isFull)
      setCohorts(available)
      if (available.length === 1) setSelectedCohort(available[0].id)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!selectedCohort || !token) return
    setEnrolling(true)
    setError(null)

    try {
      const res = await fetch('/api/enrollments/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cohortId: selectedCohort,
          hashtag: hashtag.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409 && data.enrollmentId) {
          router.push(`/courses/my/${data.enrollmentId}`)
          return
        }
        setError(data.error || 'Ошибка записи')
        return
      }

      setSuccess({
        enrollmentId: data.enrollment.id,
        requiresPayment: data.requiresPayment,
      })
    } catch (err) {
      setError('Ошибка сети')
    } finally {
      setEnrolling(false)
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

  if (loading) {
    return (
      <div className="pwa-screen animate-in" style={{ textAlign: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!course) return null

  // Not authenticated
  if (!customer) {
    return (
      <div className="pwa-screen animate-in">
        <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h2 className="t-h2" style={{ marginBottom: 8 }}>Войдите для записи</h2>
          <p className="t-body t-sec" style={{ marginBottom: 20 }}>
            Для записи на курс необходимо авторизоваться
          </p>
          <Link href="/auth/login" className="btn btn--primary">
            Войти
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="pwa-screen animate-in">
        <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 className="t-h2" style={{ marginBottom: 8 }}>Вы записаны!</h2>
          <p className="t-body t-sec" style={{ marginBottom: 20 }}>
            {success.requiresPayment
              ? 'Запись оформлена. После оплаты вы получите доступ к курсу.'
              : 'Добро пожаловать на курс! Вы получите уведомление о старте.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
            <Link
              href={`/courses/my/${success.enrollmentId}`}
              className="btn btn--primary btn--full"
            >
              Перейти к курсу
            </Link>
            <Link href="/courses" className="btn btn--secondary btn--full">
              Все курсы
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pwa-screen animate-in">
      {/* Course summary */}
      <div className="enroll-header glass">
        <div className="enroll-header__cover">
          {course.coverImage ? (
            <Image
              src={course.coverImage}
              alt={course.title}
              width={80}
              height={80}
              style={{ borderRadius: 12, objectFit: 'cover' }}
            />
          ) : (
            <div className="enroll-header__cover-placeholder">📚</div>
          )}
        </div>
        <div className="enroll-header__info">
          <div className="enroll-header__type">
            {typeLabels[course.type]} · {course.durationDays} дней
          </div>
          <h1 className="enroll-header__title">{course.title}</h1>
          <div className="enroll-header__price">
            {course.price > 0 ? (
              <>
                {formatPrice(course.price)} ₽
                {course.oldPrice && course.oldPrice > course.price && (
                  <span className="enroll-header__old-price">
                    {formatPrice(course.oldPrice)} ₽
                  </span>
                )}
              </>
            ) : (
              'Бесплатно'
            )}
          </div>
        </div>
      </div>

      {/* No cohorts */}
      {cohorts.length === 0 && (
        <div className="glass" style={{ padding: 24, textAlign: 'center', marginTop: 16 }}>
          <p className="t-body t-sec">
            К сожалению, нет доступных потоков для записи. Следите за обновлениями!
          </p>
          <Link href={`/courses/${course.slug}`} className="btn btn--secondary" style={{ marginTop: 12 }}>
            Назад
          </Link>
        </div>
      )}

      {/* Enrollment form */}
      {cohorts.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {/* Step 1: Select cohort */}
          <div className="enroll-section">
            <div className="enroll-section__number">1</div>
            <div className="enroll-section__content">
              <h3 className="enroll-section__title">Выберите поток</h3>
              <div className="enroll-cohorts">
                {cohorts.map((cohort) => (
                  <button
                    key={cohort.id}
                    className={`enroll-cohort-card glass ${selectedCohort === cohort.id ? 'enroll-cohort-card--active' : ''}`}
                    onClick={() => setSelectedCohort(cohort.id)}
                  >
                    <div className="enroll-cohort-card__title">{cohort.title}</div>
                    <div className="enroll-cohort-card__date">
                      📅 Старт: {formatDate(cohort.startDate)}
                    </div>
                    {cohort.maxParticipants > 0 && (
                      <div className="enroll-cohort-card__seats">
                        👥 {cohort.maxParticipants - cohort.currentParticipants} мест свободно
                      </div>
                    )}
                    {selectedCohort === cohort.id && (
                      <div className="enroll-cohort-card__check">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Hashtag */}
          <div className="enroll-section">
            <div className="enroll-section__number">2</div>
            <div className="enroll-section__content">
              <h3 className="enroll-section__title">Ваш хэштег (необязательно)</h3>
              <p className="t-caption t-sec" style={{ marginBottom: 10 }}>
                Формат: #ИмяЧислоРождения (например #Кирилл15)
              </p>
              <input
                type="text"
                className="input"
                placeholder="#Кирилл15"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
              />
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="enroll-section">
            <div className="enroll-section__number">3</div>
            <div className="enroll-section__content">
              <h3 className="enroll-section__title">Подтверждение</h3>
              <div className="enroll-summary glass">
                <div className="enroll-summary__row">
                  <span>Курс</span>
                  <span>{course.title}</span>
                </div>
                {selectedCohort && (
                  <div className="enroll-summary__row">
                    <span>Поток</span>
                    <span>{cohorts.find((c) => c.id === selectedCohort)?.title}</span>
                  </div>
                )}
                <div className="enroll-summary__row enroll-summary__row--total">
                  <span>Итого</span>
                  <span>{course.price > 0 ? `${formatPrice(course.price)} ₽` : 'Бесплатно'}</span>
                </div>
              </div>

              {error && (
                <div className="enroll-error">{error}</div>
              )}

              <button
                className="btn btn--primary btn--full"
                onClick={handleEnroll}
                disabled={!selectedCohort || enrolling}
                style={{ marginTop: 16 }}
              >
                {enrolling
                  ? 'Оформляем...'
                  : course.price > 0
                    ? `Записаться за ${formatPrice(course.price)} ₽`
                    : 'Записаться бесплатно'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
