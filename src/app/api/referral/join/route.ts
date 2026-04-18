import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer, getCustomerPartner } from '@/utils/auth/getAuthenticatedCustomer'
import { generatePromoCode } from '@/utils/referral/generatePromoCode'

/**
 * POST /api/referral/join
 * Body: { invitationCode: string }
 *
 * Регистрирует авторизованного клиента как МЛМ-партнёра по инвайт-коду.
 * Статус становится активным только после первой покупки от 7000₽ или стартового набора.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, req)
    if (!customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { invitationCode } = await req.json().catch(() => ({}))
    if (!invitationCode) {
      return NextResponse.json({ error: 'Инвайт-код не указан' }, { status: 400 })
    }

    const settings = (await payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any
    if (!settings?.enabled || !settings?.mlmEnabled) {
      return NextResponse.json({ error: 'МЛМ отключён' }, { status: 400 })
    }

    const code = invitationCode.trim().toUpperCase()
    const invitations = await payload.find({
      collection: 'mlm-invitations' as any,
      where: {
        code: { equals: code },
        status: { equals: 'active' },
      },
      depth: 1,
      limit: 1,
    })

    if (invitations.docs.length === 0) {
      return NextResponse.json({ error: 'Инвайт не найден или неактивен' }, { status: 404 })
    }

    const invitation = invitations.docs[0] as any

    // Проверка срока действия
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      await payload.update({
        collection: 'mlm-invitations' as any,
        id: invitation.id,
        data: { status: 'expired' } as any,
      })
      return NextResponse.json({ error: 'Срок действия инвайта истёк' }, { status: 400 })
    }

    const sponsorId =
      typeof invitation.issuedBy === 'object' ? invitation.issuedBy.id : invitation.issuedBy

    // Самоприглашение недопустимо
    const sponsorFull = (await payload.findByID({
      collection: 'referral-partners' as any,
      id: sponsorId,
    })) as any
    const sponsorCustomerId =
      typeof sponsorFull.customer === 'object' ? sponsorFull.customer.id : sponsorFull.customer
    if (sponsorCustomerId === customer.id) {
      return NextResponse.json({ error: 'Нельзя использовать собственный инвайт' }, { status: 400 })
    }

    // Проверка: клиент уже партнёр?
    let partner = await getCustomerPartner(payload, customer.id)

    if (partner && partner.type === 'mlm_partner') {
      return NextResponse.json({ error: 'Вы уже МЛМ-партнёр' }, { status: 400 })
    }

    if (partner) {
      // Апгрейд существующего партнёра (клиент/блогер → МЛМ)
      partner = await payload.update({
        collection: 'referral-partners' as any,
        id: partner.id,
        data: {
          type: 'mlm_partner',
          sponsor: sponsorId,
          invitationSource: 'invite',
          invitationCode: code,
          joinedMLMAt: new Date().toISOString(),
          partnerPriceEnabled: true,
          status: 'pending', // активируется после покупки
        } as any,
      })
    } else {
      // Создаём нового
      const pattern = settings?.promoCodePattern || 'uppercase_name'
      const promoCode = await generatePromoCode(payload, pattern, customer.name || customer.email)
      partner = await payload.create({
        collection: 'referral-partners' as any,
        data: {
          customer: customer.id,
          type: 'mlm_partner',
          status: 'pending',
          promoCode,
          sponsor: sponsorId,
          invitationSource: 'invite',
          invitationCode: code,
          joinedMLMAt: new Date().toISOString(),
          partnerPriceEnabled: true,
          balance: 0,
          totalEarned: 0,
          totalPaid: 0,
        } as any,
      })
    }

    // Помечаем инвайт использованным
    await payload.update({
      collection: 'mlm-invitations' as any,
      id: invitation.id,
      data: {
        status: 'used',
        usedBy: customer.id,
        usedAt: new Date().toISOString(),
      } as any,
    })

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        promoCode: partner.promoCode,
        status: partner.status,
      },
      message:
        'Вы приглашены в МЛМ. Статус станет активным после первой покупки от ' +
        Number(settings.minOrderForMLMEntry ?? 7000) +
        '₽ или стартового набора.',
    })
  } catch (error) {
    console.error('[referral/join] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
