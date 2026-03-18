import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCdekConfigFromPayload, getDeliveryPoints } from '@/lib/cdek'

/**
 * GET /api/cdek/pvz?city_code=44&type=PVZ
 * Get CDEK delivery points (PVZ/POSTAMAT)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cityCode = searchParams.get('city_code')
    const postalCode = searchParams.get('postal_code')
    const type = (searchParams.get('type') || 'ALL') as 'PVZ' | 'POSTAMAT' | 'ALL'

    if (!cityCode && !postalCode) {
      return NextResponse.json(
        { error: 'city_code or postal_code is required' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const cdekConfig = await getCdekConfigFromPayload(payload)

    const points = await getDeliveryPoints(cdekConfig, {
      city_code: cityCode ? Number(cityCode) : undefined,
      postal_code: postalCode || undefined,
      type,
      country_code: 'RU',
    })

    return NextResponse.json(points)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CDEK PVZ error'
    console.error('[CDEK pvz]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
