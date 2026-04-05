import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/infoproducts/[slug]
 * Returns full infoproduct details + cohorts + published results.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const payload = await getPayload({ config })

    // Find infoproduct by slug
    const infoproducts = await payload.find({
      collection: 'infoproducts' as any,
      where: {
        slug: { equals: slug },
        status: { equals: 'active' },
      },
      limit: 1,
      depth: 2, // populate coverImage, team avatars, productBundle
    })

    if (infoproducts.docs.length === 0) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 })
    }

    const ip = infoproducts.docs[0] as any

    // Get cohorts (upcoming + active)
    const cohorts = await payload.find({
      collection: 'course-cohorts' as any,
      where: {
        infoproduct: { equals: ip.id },
        status: { in: ['upcoming', 'active'] },
      },
      sort: 'startDate',
      limit: 10,
      depth: 0,
    })

    // Enrich cohorts with enrollment counts
    const enrichedCohorts = await Promise.all(
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

    // Get modules
    const modules = await payload.find({
      collection: 'course-modules' as any,
      where: {
        infoproduct: { equals: ip.id },
        visible: { equals: true },
      },
      sort: 'order',
      limit: 50,
      depth: 0,
    })

    // Get published results
    const results = await payload.find({
      collection: 'course-results' as any,
      where: {
        status: { in: ['published', 'featured'] },
      },
      sort: '-publishedAt',
      limit: 10,
      depth: 2, // populate enrollment -> cohort -> infoproduct, photos
    })

    // Filter results by this infoproduct
    const filteredResults = results.docs.filter((r: any) => {
      const enrollment = r.enrollment
      if (!enrollment || typeof enrollment !== 'object') return false
      const cohort = enrollment.cohort
      if (!cohort || typeof cohort !== 'object') return false
      const infoproductRef = cohort.infoproduct
      const infoproductId =
        typeof infoproductRef === 'object' ? infoproductRef?.id : infoproductRef
      return String(infoproductId) === String(ip.id)
    })

    return NextResponse.json({
      infoproduct: {
        id: ip.id,
        title: ip.title,
        slug: ip.slug,
        type: ip.type,
        shortDescription: ip.shortDescription,
        description: ip.description,
        coverImage: ip.coverImage?.url || null,
        price: ip.price,
        oldPrice: ip.oldPrice,
        durationDays: ip.durationDays,
        productBundle:
          ip.productBundle && typeof ip.productBundle === 'object'
            ? { id: ip.productBundle.id, title: ip.productBundle.title }
            : null,
        scheduleMorning: ip.scheduleMorning,
        scheduleDay: ip.scheduleDay,
        scheduleEvening: ip.scheduleEvening,
        dietRecommendations: ip.dietRecommendations,
        contraindications: ip.contraindications,
        rules: ip.rules,
        reportTemplate: ip.reportTemplate || [],
        team: (ip.team || []).map((t: any) => ({
          name: t.name,
          role: t.role,
          avatar: t.avatar?.url || null,
        })),
        seo: ip.seo || {},
      },
      cohorts: enrichedCohorts,
      modules: modules.docs.map((m: any) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        type: m.type,
        icon: m.icon,
        description: m.description,
      })),
      results: filteredResults.map((r: any) => ({
        id: r.id,
        type: r.type,
        text: r.text,
        photos: (r.photos || []).map((p: any) => ({
          url: p.image?.url || null,
          caption: p.caption,
        })),
        weightBefore: r.weightBefore,
        weightAfter: r.weightAfter,
        effects: r.effects || [],
        publishedAt: r.publishedAt,
      })),
    })
  } catch (error: any) {
    console.error('[api/infoproducts/slug] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
