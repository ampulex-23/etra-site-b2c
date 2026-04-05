import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/enrollments/[id]/results
 * Returns results for an enrollment.
 *
 * POST /api/enrollments/[id]/results
 * Body: { text, weightBefore?, weightAfter?, effects?: [{category, description}] }
 * Submits a result. Hook validates ownership and forces status=pending.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config })

    const results = await (payload as any).find({
      collection: 'course-results',
      where: { enrollment: { equals: id } },
      sort: '-createdAt',
      limit: 20,
      depth: 1,
    })

    return NextResponse.json({
      results: results.docs.map((r: any) => ({
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
        status: r.status,
        publishedAt: r.publishedAt,
      })),
    })
  } catch (error: any) {
    console.error('[api/enrollments/results] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config })
    const body = await req.json()

    const { text, type, weightBefore, weightAfter, effects } = body

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Поле "text" обязательно' },
        { status: 400 },
      )
    }

    // Get auth token
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

    const result = await (payload as any).create({
      collection: 'course-results',
      data: {
        enrollment: id,
        type: type || 'final',
        text: text.trim(),
        weightBefore: weightBefore || undefined,
        weightAfter: weightAfter || undefined,
        effects: effects || [],
      },
      user: { id: customerId, collection: 'customers' },
    })

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('[api/enrollments/results] POST error:', error)
    if (error.message && !error.message.includes('Internal')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
