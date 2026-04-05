import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/enrollments/[id]/reports
 * Returns all reports for an enrollment.
 * 
 * POST /api/enrollments/[id]/reports
 * Body: { date, items: [{label, completed}], notes? }
 * Submits a daily report.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config })

    const reports = await (payload as any).find({
      collection: 'participant-reports',
      where: { enrollment: { equals: id } },
      sort: '-date',
      limit: 500,
      depth: 0,
    })

    return NextResponse.json({
      reports: reports.docs.map((r: any) => ({
        id: r.id,
        date: r.date,
        items: r.items || [],
        completionRate: r.completionRate,
        notes: r.notes,
        status: r.status,
        submittedAt: r.submittedAt,
        courseDay: r.courseDay,
      })),
    })
  } catch (error: any) {
    console.error('[api/enrollments/reports] GET error:', error)
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

    const { date, items, notes } = body

    if (!date || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Поля "date" и "items" обязательны' },
        { status: 400 },
      )
    }

    // Get auth token from header to identify customer
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

    // Create report — hooks will validate ownership and set status
    const report = await (payload as any).create({
      collection: 'participant-reports',
      data: {
        enrollment: id,
        date,
        items: items.map((item: any) => ({
          label: item.label,
          completed: item.completed || false,
        })),
        notes: notes || '',
      },
      user: { id: customerId, collection: 'customers' },
    })

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('[api/enrollments/reports] POST error:', error)
    // Return hook validation errors as 400
    if (error.message && !error.message.includes('Internal')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
