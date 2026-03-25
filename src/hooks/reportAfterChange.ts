import type { CollectionAfterChangeHook } from 'payload'
import { notifyEnrollmentExpelled } from '../lib/notifications'

export const reportAfterChange: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation !== 'create' && operation !== 'update') return doc

  const { payload } = req

  try {
    const enrollmentId =
      typeof doc.enrollment === 'object' ? doc.enrollment.id : doc.enrollment
    if (!enrollmentId) return doc

    // Calculate completionRate from items
    if (doc.items && Array.isArray(doc.items) && doc.items.length > 0) {
      const completed = doc.items.filter((item: any) => item.completed).length
      const total = doc.items.length
      const completionRate = Math.round((completed / total) * 100)

      if (doc.completionRate !== completionRate) {
        await (payload as any).update({
          collection: 'participant-reports',
          id: doc.id,
          data: { completionRate },
          depth: 0,
        })
      }
    }

    // Recalculate enrollment stats: reportStreak, missedReports
    const allReports = await (payload as any).find({
      collection: 'participant-reports',
      where: {
        enrollment: { equals: enrollmentId },
      },
      sort: '-date',
      limit: 1000,
      depth: 0,
    })

    const reports = allReports.docs || []

    const missedReports = reports.filter(
      (r: any) => r.status === 'missed',
    ).length

    // Calculate streak: count consecutive non-missed reports from most recent
    let streak = 0
    const sortedByDate = [...reports].sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    for (const report of sortedByDate) {
      if (report.status === 'missed') break
      streak++
    }

    // Find max day number from submitted reports
    let currentDay = 0
    for (const report of reports) {
      if (report.status !== 'missed') {
        const dayRef = report.courseDay
        if (dayRef) {
          // If courseDay is populated, try to get dayNumber
          const dayId = typeof dayRef === 'object' ? dayRef.id : dayRef
          try {
            const dayDoc = await (payload as any).findByID({
              collection: 'course-days',
              id: dayId,
              depth: 0,
            })
            if (dayDoc?.dayNumber && dayDoc.dayNumber > currentDay) {
              currentDay = dayDoc.dayNumber
            }
          } catch {
            // Day not found, skip
          }
        }
      }
    }
    // Fallback: count non-missed reports as currentDay
    if (currentDay === 0) {
      currentDay = reports.filter((r: any) => r.status !== 'missed').length
    }

    // Update enrollment
    await (payload as any).update({
      collection: 'enrollments',
      id: enrollmentId,
      data: {
        reportStreak: streak,
        missedReports,
        currentDay,
      },
      depth: 0,
    })

    // Check auto-expel: get infoproduct's reportRules.maxMissed
    const enrollment = await (payload as any).findByID({
      collection: 'enrollments',
      id: enrollmentId,
      depth: 2,
    })

    if (enrollment?.status === 'active' && enrollment?.cohort?.infoproduct) {
      const infoproduct =
        typeof enrollment.cohort.infoproduct === 'object'
          ? enrollment.cohort.infoproduct
          : null

      if (infoproduct?.reportRules?.maxMissed) {
        const maxMissed = infoproduct.reportRules.maxMissed
        if (maxMissed > 0 && missedReports >= maxMissed) {
          await (payload as any).update({
            collection: 'enrollments',
            id: enrollmentId,
            data: { status: 'expelled' },
            depth: 0,
          })
          console.log(
            `[reportAfterChange] Enrollment ${enrollmentId} expelled: ${missedReports} missed reports (max: ${maxMissed})`,
          )
          // Send expulsion notification
          notifyEnrollmentExpelled(payload, enrollment).catch(() => {})
        }
      }
    }
  } catch (error) {
    console.error('[reportAfterChange] Error:', error)
  }

  return doc
}
