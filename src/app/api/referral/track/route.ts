import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

const PROMO_COOKIE = 'etra_promo'
const SOURCE_COOKIE = 'etra_ref_source'

/**
 * GET /api/referral/track?ref=PROMOCODE&source=telegram&redirect=/
 * Устанавливает куку с промокодом и редиректит на страницу.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ref = (searchParams.get('ref') || '').toUpperCase()
    const source = searchParams.get('source') || 'direct'
    const redirect = searchParams.get('redirect') || '/'

    if (!ref) {
      return NextResponse.redirect(new URL(redirect, req.url))
    }

    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any

    if (!settings?.enabled) {
      return NextResponse.redirect(new URL(redirect, req.url))
    }

    // Поиск партнёра по промокоду
    const partners = await payload.find({
      collection: 'referral-partners' as any,
      where: {
        promoCode: { equals: ref },
        status: { equals: 'active' },
      },
      limit: 1,
    })

    if (partners.docs.length === 0) {
      return NextResponse.redirect(new URL(redirect, req.url))
    }

    const partner = partners.docs[0] as any
    const attributionLifetime = settings.attributionLifetime || 'lifetime'
    const attributionDays = Number(settings.attributionDays ?? 30)
    const maxAge = attributionLifetime === 'lifetime'
      ? 365 * 24 * 60 * 60 * 10 // ~10 лет
      : attributionDays * 24 * 60 * 60

    const cookieStore = await cookies()
    cookieStore.set(PROMO_COOKIE, ref, {
      maxAge,
      httpOnly: false, // Доступ из JS для отображения
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    cookieStore.set(SOURCE_COOKIE, source, {
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    // Создать событие клика
    try {
      const ipAddress =
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown'
      const userAgent = req.headers.get('user-agent') || ''
      const referer = req.headers.get('referer') || ''

      await payload.create({
        collection: 'referral-events' as any,
        data: {
          partner: partner.id,
          eventType: 'click',
          promoCode: ref,
          source,
          ipAddress,
          userAgent,
          referer,
        } as any,
      })
    } catch (err) {
      console.error('[referral/track] failed to record click:', err)
    }

    return NextResponse.redirect(new URL(redirect, req.url))
  } catch (error) {
    console.error('Referral tracking error:', error)
    const redirect = new URL(req.url).searchParams.get('redirect') || '/'
    return NextResponse.redirect(new URL(redirect, req.url))
  }
}

/**
 * POST /api/referral/track
 * Проверяет привязку из куки и возвращает информацию о партнёре.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const cookieStore = await cookies()

    const promoCode = cookieStore.get(PROMO_COOKIE)?.value
    const source = cookieStore.get(SOURCE_COOKIE)?.value || 'direct'

    if (!promoCode) {
      return NextResponse.json({ partner: null })
    }

    const partners = await payload.find({
      collection: 'referral-partners' as any,
      where: {
        promoCode: { equals: promoCode.toUpperCase() },
        status: { equals: 'active' },
      },
      depth: 1,
      limit: 1,
    })

    if (partners.docs.length === 0) {
      return NextResponse.json({ partner: null })
    }

    const partner = partners.docs[0] as any
    const customer = partner.customer as any

    return NextResponse.json({
      partner: {
        promoCode: partner.promoCode,
        name: customer?.name || null,
        type: partner.type,
      },
      source,
    })
  } catch (error) {
    console.error('Referral check error:', error)
    return NextResponse.json({ partner: null })
  }
}
