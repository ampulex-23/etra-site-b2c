import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const settings = await payload.findGlobal({
      slug: 'referral-settings' as any,
    }) as any

    if (!settings?.enabled) {
      return NextResponse.json({ enabled: false })
    }

    return NextResponse.json({
      enabled: true,
      shareTitle: settings.shareTitle || 'Посмотри этот товар!',
      shareText: settings.shareText || 'Рекомендую этот товар 🌿',
      enabledSources: settings.enabledSources || ['telegram', 'vk', 'whatsapp', 'copy'],
      levels: (settings.levels || []).map((level: any) => ({
        name: level.name,
        minPoints: level.minPoints,
        discountPercent: level.discountPercent,
        color: level.color,
      })),
    })
  } catch (error) {
    console.error('Error fetching referral settings:', error)
    return NextResponse.json({ enabled: false })
  }
}
