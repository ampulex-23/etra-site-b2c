import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCdekConfigFromPayload, calculateTariffList } from '@/lib/cdek'

/**
 * POST /api/cdek/calculate
 * Calculate delivery cost - returns list of available tariffs and picks the cheapest one.
 * Body: { cityCode?: string, postalCode?: string, weight?: number }
 * Returns: cheapest tariff + list of all available tariffs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cityCode, postalCode, weight = 500 } = body

    if (!cityCode && !postalCode) {
      return NextResponse.json(
        { error: 'cityCode or postalCode is required' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const cdekConfig = await getCdekConfigFromPayload(payload)

    const packages = [{ weight: Number(weight) }]

    // Convert city codes to numbers (CDEK API requires numeric codes)
    const fromLocation = { code: parseInt(cdekConfig.senderCityCode, 10) }
    const toLocation: { code?: number; postal_code?: string } = {}
    if (cityCode) toLocation.code = parseInt(String(cityCode), 10)
    if (postalCode) toLocation.postal_code = String(postalCode)

    console.log('[CDEK calculate] Request:', { from: fromLocation.code, to: toLocation.code || toLocation.postal_code, weight })

    // Always get all available tariffs instead of requesting specific one
    const result = await calculateTariffList(cdekConfig, {
      from_location: fromLocation,
      to_location: toLocation,
      packages,
    })

    console.log('[CDEK calculate] Available tariffs:', result.tariff_codes?.length || 0)

    // Return the cheapest available tariff
    if (result.tariff_codes && result.tariff_codes.length > 0) {
      const cheapest = result.tariff_codes.reduce((min, tariff) => 
        tariff.delivery_sum < min.delivery_sum ? tariff : min
      )
      
      return NextResponse.json({
        delivery_sum: cheapest.delivery_sum,
        period_min: cheapest.period_min,
        period_max: cheapest.period_max,
        tariff_code: cheapest.tariff_code,
        tariff_name: cheapest.tariff_name,
        available_tariffs: result.tariff_codes,
      })
    }

    return NextResponse.json({ 
      error: 'No available tariffs for this route',
      details: result,
    }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CDEK calculation error'
    console.error('[CDEK calculate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
