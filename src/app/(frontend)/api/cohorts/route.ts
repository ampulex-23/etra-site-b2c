import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/cohorts?infoproduct=<id>&status=upcoming
 * Returns available cohorts for a given infoproduct (for purchase flow).
 * Includes current enrollment count for each cohort.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)

    const infoproductId = searchParams.get('infoproduct')
    const status = searchParams.get('status') || 'upcoming'

    if (!infoproductId) {
      return NextResponse.json(
        { error: 'Parameter "infoproduct" is required' },
        { status: 400 },
      )
    }

    const where: Record<string, any> = {
      infoproduct: { equals: infoproductId },
    }

    if (status === 'all') {
      where.status = { in: ['upcoming', 'active'] }
    } else {
      where.status = { equals: status }
    }

    const cohorts = await payload.find({
      collection: 'course-cohorts' as any,
      where,
      sort: 'startDate',
      limit: 50,
      depth: 0,
    })

    // Enrich with enrollment counts
    const enriched = await Promise.all(
      cohorts.docs.map(async (cohort: any) => {
        const enrollmentCount = await payload.find({
          collection: 'enrollments' as any,
          where: {
            cohort: { equals: cohort.id },
            status: { in: ['pending', 'active'] },
          },
          limit: 0,
          depth: 0,
        })

        return {
          id: cohort.id,
          title: cohort.title,
          status: cohort.status,
          startDate: cohort.startDate,
          endDate: cohort.endDate,
          maxParticipants: cohort.maxParticipants || 0,
          currentParticipants: enrollmentCount.totalDocs,
          isFull:
            cohort.maxParticipants > 0 &&
            enrollmentCount.totalDocs >= cohort.maxParticipants,
        }
      }),
    )

    return NextResponse.json({ cohorts: enriched })
  } catch (error: any) {
    console.error('[api/cohorts] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
