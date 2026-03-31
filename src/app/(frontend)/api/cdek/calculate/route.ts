import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCdekConfigFromPayload, calculateTariff } from '@/lib/cdek'

/**
 * POST /api/cdek/calculate
 * Calculate delivery cost
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cityCode, weight, tariffCode } = body

    if (!cityCode) {
      return NextResponse.json(
        { error: 'cityCode is required' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const cdekConfig = await getCdekConfigFromPayload(payload)

    const result = await calculateTariff(cdekConfig, {
      tariff_code: tariffCode || cdekConfig.defaultTariffCode,
      from_location: { code: cdekConfig.senderCityCode },
      to_location: { code: cityCode },
      packages: [{ weight: weight || 500 }],
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CDEK calculate error'
    console.error('[CDEK calculate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
