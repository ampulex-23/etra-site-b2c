import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(req.url)

  const productId = searchParams.get('product')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const featured = searchParams.get('featured')

  const where: Record<string, unknown> = {
    status: { equals: 'published' },
  }

  if (productId) {
    where.product = { equals: productId }
  }

  if (featured === 'true') {
    where.featured = { equals: true }
  }

  const result = await (payload as any).find({
    collection: 'reviews',
    where,
    sort: '-publishedAt',
    limit,
    page,
    depth: 1,
  })

  const reviews = result.docs.map((doc: any) => {
    const customer = typeof doc.customer === 'object' && doc.customer
      ? doc.customer
      : null
    return {
      id: doc.id,
      title: doc.title,
      text: doc.text,
      rating: doc.rating,
      customerName: customer?.name || 'Покупатель',
      product: doc.product,
      adminReply: doc.adminReply,
      publishedAt: doc.publishedAt,
      createdAt: doc.createdAt,
    }
  })

  return NextResponse.json({
    docs: reviews,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page,
  })
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  // Get auth token from cookie
  const token = req.cookies.get('payload-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 })
  }

  // Verify customer
  let customer: { id: string } | null = null
  try {
    const meRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || ''}/api/customers/me`, {
      headers: { Authorization: `JWT ${token}` },
    })
    if (meRes.ok) {
      const meData = await meRes.json()
      customer = meData.user
    }
  } catch {
    // ignore
  }

  if (!customer) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 })
  }

  const body = await req.json()
  const { text, rating, productId, orderId, source } = body

  if (!text || !rating) {
    return NextResponse.json({ error: 'Текст и оценка обязательны' }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Оценка от 1 до 5' }, { status: 400 })
  }

  const reviewData: Record<string, unknown> = {
    text,
    rating,
    customer: customer.id,
    status: 'pending',
    source: source || 'site',
  }

  if (productId) {
    reviewData.product = productId
  }
  if (orderId) {
    reviewData.order = orderId
  }

  const review = await (payload as any).create({
    collection: 'reviews',
    data: reviewData,
  })

  return NextResponse.json({ id: review.id, message: 'Отзыв отправлен на модерацию' })
}
