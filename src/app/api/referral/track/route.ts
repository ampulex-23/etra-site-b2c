import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

const REFERRAL_COOKIE_NAME = 'ref_code'
const REFERRAL_PRODUCT_COOKIE = 'ref_product'
const REFERRAL_SOURCE_COOKIE = 'ref_source'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const refCode = searchParams.get('ref')
    const productSlug = searchParams.get('product')
    const source = searchParams.get('source') || 'direct'
    const redirect = searchParams.get('redirect') || '/'

    if (!refCode) {
      return NextResponse.redirect(new URL(redirect, req.url))
    }

    const payload = await getPayload({ config })

    const referralSettings = await payload.findGlobal({
      slug: 'referral-settings' as any,
    }) as any

    if (!referralSettings?.enabled) {
      return NextResponse.redirect(new URL(redirect, req.url))
    }

    const customers = await payload.find({
      collection: 'customers',
      where: {
        referralCode: { equals: refCode },
      },
      limit: 1,
    })

    if (customers.docs.length === 0) {
      return NextResponse.redirect(new URL(redirect, req.url))
    }

    const referrer = customers.docs[0]

    const cookieStore = await cookies()
    const cookieLifetime = (referralSettings.cookieLifetimeDays || 30) * 24 * 60 * 60

    cookieStore.set(REFERRAL_COOKIE_NAME, refCode, {
      maxAge: cookieLifetime,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    if (productSlug) {
      cookieStore.set(REFERRAL_PRODUCT_COOKIE, productSlug, {
        maxAge: cookieLifetime,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }

    cookieStore.set(REFERRAL_SOURCE_COOKIE, source, {
      maxAge: cookieLifetime,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = req.headers.get('user-agent') || ''

    let product = null
    if (productSlug) {
      const products = await payload.find({
        collection: 'products',
        where: {
          slug: { equals: productSlug },
        },
        limit: 1,
      })
      if (products.docs.length > 0) {
        product = products.docs[0]
      }
    }

    await payload.create({
      collection: 'referrals',
      data: {
        referrer: referrer.id,
        product: product?.id || null,
        status: 'click',
        source: source as any,
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.redirect(new URL(redirect, req.url))
  } catch (error) {
    console.error('Referral tracking error:', error)
    const redirect = new URL(req.url).searchParams.get('redirect') || '/'
    return NextResponse.redirect(new URL(redirect, req.url))
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const cookieStore = await cookies()
    
    const refCode = cookieStore.get(REFERRAL_COOKIE_NAME)?.value
    const productSlug = cookieStore.get(REFERRAL_PRODUCT_COOKIE)?.value
    const source = cookieStore.get(REFERRAL_SOURCE_COOKIE)?.value || 'direct'

    if (!refCode) {
      return NextResponse.json({ referrer: null })
    }

    const customers = await payload.find({
      collection: 'customers',
      where: {
        referralCode: { equals: refCode },
      },
      limit: 1,
    })

    if (customers.docs.length === 0) {
      return NextResponse.json({ referrer: null })
    }

    const referrer = customers.docs[0]

    return NextResponse.json({
      referrer: {
        id: referrer.id,
        name: referrer.name,
        referralCode: refCode,
      },
      productSlug,
      source,
    })
  } catch (error) {
    console.error('Referral check error:', error)
    return NextResponse.json({ referrer: null })
  }
}
