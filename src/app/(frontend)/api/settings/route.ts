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

    return NextResponse.json({
      delivery: {
        pickupEnabled: deliverySettings.deliveryPickupEnabled ?? true,
        cdekEnabled: deliverySettings.cdekEnabled ?? false,
        russianPostEnabled: deliverySettings.russianPostEnabled ?? false,
      },
      payment: {
        onlineEnabled: shopSettings.paymentOnlineEnabled ?? true,
        cashEnabled: shopSettings.paymentCashEnabled ?? false,
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
