import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCdekConfigFromPayload, calculateTariff, calculateTariffList } from '@/lib/cdek'

/**
 * POST /api/cdek/calculate
 * Calculate delivery cost.
 * Body: { cityCode?: string, postalCode?: string, weight: number, tariffCode?: number }
 * Returns: tariff calculation result or list of available tariffs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cityCode, postalCode, weight = 500, tariffCode, length, width, height } = body

    if (!cityCode && !postalCode) {
      return NextResponse.json(
        { error: 'cityCode or postalCode is required' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const cdekConfig = await getCdekConfigFromPayload(payload)

    const packages = [{
      weight: Number(weight),
      length: Number(length) || 20,
      width: Number(width) || 15,
      height: Number(height) || 10,
    }]

    // Convert city codes to numbers (CDEK API requires numeric codes)
    const fromLocation = { code: parseInt(cdekConfig.senderCityCode, 10) }
    const toLocation: { code?: number; postal_code?: string } = {}
    if (cityCode) toLocation.code = parseInt(String(cityCode), 10)
    if (postalCode) toLocation.postal_code = String(postalCode)

    if (tariffCode) {
      const result = await calculateTariff(cdekConfig, {
        tariff_code: Number(tariffCode),
        from_location: fromLocation,
        to_location: toLocation,
        packages,
      })

      if (result.errors && result.errors.length > 0) {
        return NextResponse.json({ error: result.errors[0].message, errors: result.errors }, { status: 400 })
      }

      return NextResponse.json(result)
    }

    const result = await calculateTariffList(cdekConfig, {
      from_location: fromLocation,
      to_location: toLocation,
      packages,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CDEK calculation error'
    console.error('[CDEK calculate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
