import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Validates customer-submitted reports:
 * - Enrollment must belong to the customer
 * - Enrollment must be active
 * - No duplicate report for the same date
 * - Cannot report for a future date
 * - Auto-sets submittedAt and status (submitted/late)
 */
export const reportBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create') return data

  const { user, payload } = req
  if (!user || user.collection !== 'customers') return data

  const enrollmentId =
    typeof data.enrollment === 'object' ? data.enrollment.id : data.enrollment
  if (!enrollmentId) {
    throw new Error('Не указана запись на курс')
  }

  // Verify enrollment belongs to this customer and is active
  const enrollment = await (payload as any).findByID({
    collection: 'enrollments',
    id: enrollmentId,
    depth: 1,
  })

  if (!enrollment) {
    throw new Error('Запись на курс не найдена')
  }

  const enrollmentCustomerId =
    typeof enrollment.customer === 'object'
      ? enrollment.customer.id
      : enrollment.customer

  if (enrollmentCustomerId !== user.id) {
    throw new Error('Эта запись на курс принадлежит другому участнику')
  }

  if (enrollment.status !== 'active') {
    throw new Error('Запись на курс не активна')
  }

  // Validate date: not in the future
  const reportDate = new Date(data.date)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (reportDate > today) {
    throw new Error('Нельзя подать отчёт за будущий день')
  }

  // Check for duplicate report on the same date
  const dateStr = reportDate.toISOString().split('T')[0]
  const existing = await (payload as any).find({
    collection: 'participant-reports',
    where: {
      enrollment: { equals: enrollmentId },
      date: { equals: dateStr },
      status: { not_equals: 'missed' },
    },
    limit: 1,
    depth: 0,
  })

  if (existing.totalDocs > 0) {
    throw new Error('Отчёт за эту дату уже подан')
  }

  // Auto-set submittedAt
  data.submittedAt = new Date().toISOString()

  // Auto-determine status: check if report is on time
  // Get the cohort to find the course day for this date
  const cohortId =
    typeof enrollment.cohort === 'object'
      ? enrollment.cohort.id
      : enrollment.cohort

  if (cohortId) {
    const courseDays = await (payload as any).find({
      collection: 'course-days',
      where: {
        cohort: { equals: cohortId },
        date: { equals: dateStr },
      },
      limit: 1,
      depth: 0,
    })

    if (courseDays.docs.length > 0) {
      // Auto-link courseDay
      data.courseDay = courseDays.docs[0].id

      // If the report date is before today, mark as late
      const todayStr = new Date().toISOString().split('T')[0]
      if (dateStr < todayStr) {
        data.status = 'late'
      } else {
        data.status = 'submitted'
      }
    }
  }

  // Force enrollment to be the validated one (prevent customer from spoofing)
  data.enrollment = enrollmentId

  return data
}
