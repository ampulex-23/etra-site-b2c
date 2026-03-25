import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/cron/check-missed-reports
 * 
 * Called daily (e.g. by external cron scheduler) to mark missed reports.
 * For each active cohort, checks if each active participant submitted
 * a report for yesterday. If not, creates a 'missed' report.
 * 
 * Security: requires Authorization header with CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Get yesterday's date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Find all active cohorts
    const activeCohorts = await payload.find({
      collection: 'course-cohorts' as any,
      where: { status: { equals: 'active' } },
      limit: 100,
      depth: 0,
    })

    let totalMissed = 0
    let totalChecked = 0

    for (const cohort of activeCohorts.docs) {
      // Check if yesterday was within the cohort's date range
      const startDate = new Date(cohort.startDate)
      const endDate = cohort.endDate ? new Date(cohort.endDate) : null
      if (yesterday < startDate) continue
      if (endDate && yesterday > endDate) continue

      // Find the course day for yesterday
      const courseDays = await payload.find({
        collection: 'course-days' as any,
        where: {
          cohort: { equals: cohort.id },
          date: { equals: yesterdayStr },
        },
        limit: 1,
        depth: 0,
      })

      const courseDay = courseDays.docs[0] || null

      // Find all active enrollments for this cohort
      const enrollments = await payload.find({
        collection: 'enrollments' as any,
        where: {
          cohort: { equals: cohort.id },
          status: { equals: 'active' },
        },
        limit: 1000,
        depth: 0,
      })

      for (const enrollment of enrollments.docs) {
        totalChecked++

        // Check if participant already submitted a report for yesterday
        const existingReport = await payload.find({
          collection: 'participant-reports' as any,
          where: {
            enrollment: { equals: enrollment.id },
            date: { equals: yesterdayStr },
          },
          limit: 1,
          depth: 0,
        })

        if (existingReport.totalDocs > 0) continue

        // Create a missed report
        await payload.create({
          collection: 'participant-reports' as any,
          data: {
            enrollment: enrollment.id,
            courseDay: courseDay?.id || undefined,
            date: yesterdayStr,
            items: [],
            status: 'missed',
            completionRate: 0,
            submittedAt: new Date().toISOString(),
          },
          depth: 0,
        })

        totalMissed++
      }
    }

    console.log(
      `[cron/check-missed-reports] Checked ${totalChecked} enrollments across ${activeCohorts.totalDocs} active cohorts. Created ${totalMissed} missed reports for ${yesterdayStr}.`,
    )

    return NextResponse.json({
      success: true,
      date: yesterdayStr,
      cohortsChecked: activeCohorts.totalDocs,
      enrollmentsChecked: totalChecked,
      missedReportsCreated: totalMissed,
    })
  } catch (error: any) {
    console.error('[cron/check-missed-reports] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
