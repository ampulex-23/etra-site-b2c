import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    
    // Get shop settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = await (payload.findGlobal as any)({ slug: 'shop-settings' }) as Record<string, unknown>
    
    // Return only public fields
    return NextResponse.json({
      telegramBotUsername: settings.telegramBotUsername || null,
      minOrderAmount: settings.minOrderAmount || 0,
      freeDeliveryThreshold: settings.freeDeliveryThreshold || 0,
    })
  } catch (err) {
    console.error('Shop settings error:', err)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 },
    )
  }
}
