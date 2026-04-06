'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface CourseCard {
  id: string
  title: string
  slug: string
  type: string
  shortDescription: string
  coverImage: string | null
  price: number
  oldPrice: number | null
  durationDays: number
  nearestCohort: {
    id: string
    title: string
    startDate: string
    status: string
  } | null
}

const typeLabels: Record<string, string> = {
  course: 'Курс',
  marathon: 'Марафон',
  program: 'Программа',
  retreat: 'Ретрит',
}

const typeIcons: Record<string, string> = {
  course: '📚',
  marathon: '🏃',
  program: '🌿',
  retreat: '🧘',
}

export function CoursesScreen() {
  const [courses, setCourses] = useState<CourseCard[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [activeFilter])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeFilter) params.set('type', activeFilter)
      const res = await fetch(`/api/public-infoproducts?${params}`)
      const data = await res.json()
      setCourses(data.docs || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    })
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU')
  }

  return (
    <div className="pwa-screen animate-in">
      <h1 className="t-h2" style={{ marginBottom: 8 }}>Курсы и программы</h1>
      <p className="t-body t-sec" style={{ marginBottom: 20 }}>
        Оздоровительные программы с сопровождением экспертов
      </p>

      {/* Type filter */}
      <div className="pill-toggle" style={{ marginBottom: 20, overflowX: 'auto' }}>
        <button
          className={`pill-toggle__item ${!activeFilter ? 'pill-toggle__item--active' : ''}`}
          onClick={() => setActiveFilter(null)}
        >
          Все
        </button>
        {Object.entries(typeLabels).map(([value, label]) => (
          <button
            key={value}
            className={`pill-toggle__item ${activeFilter === value ? 'pill-toggle__item--active' : ''}`}
            onClick={() => setActiveFilter(value)}
          >
            {typeIcons[value]} {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      )}

      {/* Empty state */}
      {!loading && courses.length === 0 && (
        <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <div className="t-h3" style={{ marginBottom: 8 }}>Пока нет доступных курсов</div>
          <p className="t-caption t-sec">Скоро здесь появятся новые программы</p>
        </div>
      )}

      {/* Course cards */}
      <div className="courses-grid">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="course-card glass"
          >
            {/* Cover image */}
            <div className="course-card__cover">
              {course.coverImage ? (
                <Image
                  src={course.coverImage}
                  alt={course.title}
                  fill
                  sizes="(max-width: 600px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="course-card__cover-placeholder">
                  <span>{typeIcons[course.type] || '📚'}</span>
                </div>
              )}
              {/* Type badge */}
              <div className="course-card__type-badge">
                {typeIcons[course.type]} {typeLabels[course.type] || course.type}
              </div>
              {/* Cohort badge */}
              {course.nearestCohort && (
                <div className="course-card__cohort-badge">
                  {course.nearestCohort.status === 'active'
                    ? '🟢 Идёт набор'
                    : `⏳ Старт ${formatDate(course.nearestCohort.startDate)}`}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="course-card__body">
              <h3 className="course-card__title">{course.title}</h3>
              {course.shortDescription && (
                <p className="course-card__desc">{course.shortDescription}</p>
              )}
              <div className="course-card__meta">
                {course.durationDays && (
                  <span className="course-card__meta-item">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {course.durationDays} дней
                  </span>
                )}
              </div>
              <div className="course-card__price-row">
                {course.price > 0 ? (
                  <>
                    <span className="course-card__price">
                      {formatPrice(course.price)} ₽
                    </span>
                    {course.oldPrice && course.oldPrice > course.price && (
                      <span className="course-card__old-price">
                        {formatPrice(course.oldPrice)} ₽
                      </span>
                    )}
                  </>
                ) : (
                  <span className="course-card__price course-card__price--free">
                    Бесплатно
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
