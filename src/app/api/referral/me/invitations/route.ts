import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer, getCustomerPartner } from '@/utils/auth/getAuthenticatedCustomer'
import crypto from 'crypto'

async function generateInviteCode(payload: any): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    const existing = await payload.find({
      collection: 'mlm-invitations' as any,
      where: { code: { equals: code } },
      limit: 1,
    })
    if (existing.docs.length === 0) return code
  }
  return crypto.randomBytes(8).toString('hex').toUpperCase()
}

/**
 * GET /api/referral/me/invitations
 * Список инвайт-кодов партнёра
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, req)
    if (!customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const partner = await getCustomerPartner(payload, customer.id)
    if (!partner || partner.type !== 'mlm_partner') {
      return NextResponse.json({ invitations: [] })
    }

    const result = await payload.find({
      collection: 'mlm-invitations' as any,
      where: { issuedBy: { equals: partner.id } },
      sort: '-createdAt',
      limit: 100,
      depth: 1,
    })

    return NextResponse.json({
      invitations: result.docs.map((i: any) => ({
        id: i.id,
        code: i.code,
        status: i.status,
        usedBy: i.usedBy
          ? typeof i.usedBy === 'object'
            ? i.usedBy.name || i.usedBy.email
            : 'Использован'
          : null,
        usedAt: i.usedAt,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
        note: i.note,
      })),
    })
  } catch (error) {
    console.error('[invitations/list] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

/**
 * POST /api/referral/me/invitations
 * Выпустить новый инвайт-код
 * Body: { note?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, req)
    if (!customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const partner = await getCustomerPartner(payload, customer.id)
    if (!partner || partner.type !== 'mlm_partner' || partner.status !== 'active') {
      return NextResponse.json(
        { error: 'Только активный МЛМ-партнёр может выпускать инвайты' },
        { status: 403 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const settings = (await payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any
    const expiryDays = Number(settings?.invitationExpiryDays ?? 90)
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()

    const code = await generateInviteCode(payload)

    const invitation = await payload.create({
      collection: 'mlm-invitations' as any,
      data: {
        code,
        issuedBy: partner.id,
        issuedByCustomer: customer.id,
        status: 'active',
        expiresAt,
        note: (body.note || '').toString().slice(0, 200),
      } as any,
    })

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        code: invitation.code,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error) {
    console.error('[invitations/create] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

/**
 * DELETE /api/referral/me/invitations?id=XXX
 * Отозвать инвайт-код (только если не использован)
 */
export async function DELETE(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, req)
    if (!customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const partner = await getCustomerPartner(payload, customer.id)
    if (!partner) {
      return NextResponse.json({ error: 'Не являетесь партнёром' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID инвайта не указан' }, { status: 400 })
    }

    const invitation = (await payload.findByID({
      collection: 'mlm-invitations' as any,
      id,
    })) as any

    const issuedBy =
      typeof invitation?.issuedBy === 'object' ? invitation.issuedBy.id : invitation?.issuedBy
    if (issuedBy !== partner.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    if (invitation.status === 'used') {
      return NextResponse.json({ error: 'Нельзя отозвать использованный инвайт' }, { status: 400 })
    }

    await payload.update({
      collection: 'mlm-invitations' as any,
      id,
      data: { status: 'revoked' } as any,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[invitations/revoke] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
