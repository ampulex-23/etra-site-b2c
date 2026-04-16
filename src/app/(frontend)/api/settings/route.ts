import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const [deliverySettings, shopSettings] = await Promise.all([
      payload.findGlobal({ slug: 'delivery-settings' }),
      payload.findGlobal({ slug: 'shop-settings' }),
    ])

    const delivery = deliverySettings as any
    const shop = shopSettings as any

    return NextResponse.json({
      delivery: {
        pickupEnabled: delivery.deliveryPickupEnabled ?? true,
        cdekEnabled: delivery.cdekEnabled ?? false,
        russianPostEnabled: delivery.russianPostEnabled ?? false,
      },
      payment: {
        onlineEnabled: shop.paymentOnlineEnabled ?? true,
        cashEnabled: shop.paymentCashEnabled ?? false,
      },
    })
  } catch (error) {
    console.error('[Settings API] Error:', error)
    return NextResponse.json(
      { 
        delivery: { pickupEnabled: true, cdekEnabled: false, russianPostEnabled: false },
        payment: { onlineEnabled: true, cashEnabled: false },
      },
      { status: 200 }
    )
  }
}
