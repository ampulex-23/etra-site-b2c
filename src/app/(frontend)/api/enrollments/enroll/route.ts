import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/enrollments/enroll
 * Body: { cohortId, hashtag? }
 * Creates a new enrollment for the authenticated customer.
 * Returns enrollment data + payment info if course has a price.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await req.json()
    const { cohortId, hashtag } = body

    if (!cohortId) {
      return NextResponse.json({ error: 'Не указан поток' }, { status: 400 })
    }

    // Authenticate customer
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    let customerId: string
    try {
      const parts = token.split('.')
      if (parts.length !== 3) throw new Error('Invalid token')
      const payloadData = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
      customerId = payloadData.id
    } catch {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 })
    }

    // Get cohort
    const cohort = await (payload as any).findByID({
      collection: 'course-cohorts',
      id: cohortId,
      depth: 1,
    })

    if (!cohort) {
      return NextResponse.json({ error: 'Поток не найден' }, { status: 404 })
    }

    if (cohort.status !== 'upcoming' && cohort.status !== 'active') {
      return NextResponse.json(
        { error: 'Запись на этот поток закрыта' },
        { status: 400 },
      )
    }

    // Check if already enrolled
    const existing = await (payload as any).find({
      collection: 'enrollments',
      where: {
        customer: { equals: customerId },
        cohort: { equals: cohortId },
        status: { not_in: ['refunded'] },
      },
      limit: 1,
      depth: 0,
    })

    if (existing.totalDocs > 0) {
      return NextResponse.json(
        { error: 'Вы уже записаны на этот поток', enrollmentId: existing.docs[0].id },
        { status: 409 },
      )
    }

    // Check capacity
    if (cohort.maxParticipants > 0) {
      const enrollmentCount = await (payload as any).find({
        collection: 'enrollments',
        where: {
          cohort: { equals: cohortId },
          status: { in: ['pending', 'active'] },
        },
        limit: 0,
        depth: 0,
      })

      if (enrollmentCount.totalDocs >= cohort.maxParticipants) {
        return NextResponse.json(
          { error: 'Все места на этот поток заняты' },
          { status: 400 },
        )
      }
    }

    // Get infoproduct for price info
    const infoproductId =
      typeof cohort.infoproduct === 'object'
        ? cohort.infoproduct.id
        : cohort.infoproduct
    const infoproduct = await (payload as any).findByID({
      collection: 'infoproducts',
      id: infoproductId,
      depth: 0,
    })

    // Create enrollment
    const enrollment = await (payload as any).create({
      collection: 'enrollments',
      data: {
        customer: customerId,
        cohort: cohortId,
        status: infoproduct?.price > 0 ? 'pending' : 'active',
        hashtag: hashtag || '',
        enrolledAt: new Date().toISOString(),
        currentDay: 0,
        reportStreak: 0,
        missedReports: 0,
      },
    })

    return NextResponse.json({
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        hashtag: enrollment.hashtag,
      },
      requiresPayment: (infoproduct?.price || 0) > 0,
      price: infoproduct?.price || 0,
      infoproductTitle: infoproduct?.title || '',
    })
  } catch (error: any) {
    console.error('[api/enrollments/enroll] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
