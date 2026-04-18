import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/referral/apply
 * Публичный эндпоинт для подачи заявки на участие в реферальной программе
 * (клиенты и блогеры).
 *
 * Body: {
 *   applicationType: 'client' | 'blogger_paid' | 'blogger_barter' | 'mlm_partner',
 *   contactName, contactEmail, contactPhone, contactTelegram,
 *   socialLinks: [{url, description}],
 *   avgViews, audienceTopic, invitationCode, message
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    if (!body.contactName || !body.applicationType) {
      return NextResponse.json({ error: 'Не все поля заполнены' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any

    if (!settings?.enabled) {
      return NextResponse.json({ error: 'Реферальная программа отключена' }, { status: 400 })
    }

    const application = await payload.create({
      collection: 'partner-applications' as any,
      data: {
        applicationType: body.applicationType,
        status: 'new',
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        contactTelegram: body.contactTelegram,
        socialLinks: Array.isArray(body.socialLinks) ? body.socialLinks : [],
        avgViews: Number(body.avgViews || 0) || undefined,
        audienceTopic: body.audienceTopic,
        invitationCode: body.invitationCode,
        message: body.message,
      } as any,
    })

    return NextResponse.json({
      success: true,
      application: { id: application.id },
      message: 'Заявка принята! Мы свяжемся с вами в ближайшее время.',
    })
  } catch (error) {
    console.error('[referral/apply] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
