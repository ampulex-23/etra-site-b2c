import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/infoproducts?type=course&limit=20&page=1
 * Returns active infoproducts for the catalog page.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)

    const type = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const page = parseInt(searchParams.get('page') || '1', 10)

    const where: Record<string, any> = {
      status: { equals: 'active' },
    }

    if (type) {
      where.type = { equals: type }
    }

    const infoproducts = await payload.find({
      collection: 'infoproducts' as any,
      where,
      sort: '-createdAt',
      limit,
      page,
      depth: 1, // populate coverImage
    })

    // Enrich with nearest upcoming cohort info
    const enriched = await Promise.all(
      infoproducts.docs.map(async (ip: any) => {
        const cohorts = await payload.find({
          collection: 'course-cohorts' as any,
          where: {
            infoproduct: { equals: ip.id },
            status: { in: ['upcoming', 'active'] },
          },
          sort: 'startDate',
          limit: 1,
          depth: 0,
        })

        const nearestCohort = cohorts.docs[0] || null

        return {
          id: ip.id,
          title: ip.title,
          slug: ip.slug,
          type: ip.type,
          shortDescription: ip.shortDescription,
          coverImage: ip.coverImage?.url || null,
          price: ip.price,
          oldPrice: ip.oldPrice,
          durationDays: ip.durationDays,
          nearestCohort: nearestCohort
            ? {
                id: nearestCohort.id,
                title: nearestCohort.title,
                startDate: nearestCohort.startDate,
                status: nearestCohort.status,
              }
            : null,
        }
      }),
    )

    return NextResponse.json({
      docs: enriched,
      totalDocs: infoproducts.totalDocs,
      totalPages: infoproducts.totalPages,
      page: infoproducts.page,
      hasNextPage: infoproducts.hasNextPage,
    })
  } catch (error: any) {
    console.error('[api/infoproducts] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
