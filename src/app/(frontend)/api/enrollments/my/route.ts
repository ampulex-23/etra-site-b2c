import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

/**
 * GET /api/enrollments/my
 * Returns current customer's enrollments with course info and progress.
 * Requires customer JWT in Authorization header.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Authenticate customer
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    let customer: any
    try {
      const result = await payload.find({
        collection: 'customers',
        where: { id: { exists: true } },
        limit: 1,
        depth: 0,
        overrideAccess: false,
        user: null as any,
      })
      // Decode JWT manually to get customer id
      const parts = token.split('.')
      if (parts.length !== 3) throw new Error('Invalid token')
      const payloadData = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
      customer = { id: payloadData.id, collection: 'customers' }
    } catch {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 })
    }

    // Find enrollments for this customer
    const enrollments = await payload.find({
      collection: 'enrollments' as any,
      where: {
        customer: { equals: customer.id },
      },
      sort: '-enrolledAt',
      limit: 50,
      depth: 2, // populate cohort -> infoproduct
    })

    const enriched = enrollments.docs.map((e: any) => {
      const cohort = typeof e.cohort === 'object' ? e.cohort : null
      const infoproduct =
        cohort && typeof cohort.infoproduct === 'object' ? cohort.infoproduct : null

      return {
        id: e.id,
        status: e.status,
        hashtag: e.hashtag,
        currentDay: e.currentDay,
        reportStreak: e.reportStreak,
        missedReports: e.missedReports,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        cohort: cohort
          ? {
              id: cohort.id,
              title: cohort.title,
              status: cohort.status,
              startDate: cohort.startDate,
              endDate: cohort.endDate,
            }
          : null,
        infoproduct: infoproduct
          ? {
              id: infoproduct.id,
              title: infoproduct.title,
              slug: infoproduct.slug,
              type: infoproduct.type,
              coverImage: infoproduct.coverImage?.url || null,
              durationDays: infoproduct.durationDays,
            }
          : null,
      }
    })

    return NextResponse.json({ enrollments: enriched })
  } catch (error: any) {
    console.error('[api/enrollments/my] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
