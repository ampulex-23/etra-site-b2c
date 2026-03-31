import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCdekConfigFromPayload, getDeliveryPoints } from '@/lib/cdek'

/**
 * GET /api/cdek/pvz?city_code=44&type=ALL
 * Get CDEK delivery points (PVZ/POSTAMAT)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cityCode = searchParams.get('city_code')
    const type = (searchParams.get('type') || 'ALL') as 'PVZ' | 'POSTAMAT' | 'ALL'

    if (!cityCode) {
      return NextResponse.json(
        { error: 'city_code parameter is required' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const cdekConfig = await getCdekConfigFromPayload(payload)

    const points = await getDeliveryPoints(cdekConfig, {
      city_code: Number(cityCode),
      type,
      size: 100,
    })

    return NextResponse.json(points)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CDEK PVZ error'
    console.error('[CDEK PVZ]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
