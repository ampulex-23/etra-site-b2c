import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCdekConfigFromPayload, calculateTariff } from '@/lib/cdek'
import { buildPackaging, resolveTariffCodes } from '@/lib/cdek-packaging'

/**
 * POST /api/cdek/calculate
 *
 * Request body:
 *   {
 *     cityCode: string | number        // CDEK destination city code (required)
 *     bottleCount: number              // number of bottles (1..12)
 *     declaredValue: number            // order total in RUB, for insurance
 *     destination: 'pickup' | 'courier' // delivery type (default 'pickup')
 *   }
 *
 * Response:
 *   {
 *     delivery_sum: number      // total tariff price (delivery + services)
 *     period_min: number
 *     period_max: number
 *     tariff_code: number
 *     box: { label, weightKg, lengthCm, widthCm, heightCm, cdekCartonCode }
 *     services: Array<{ code, sum?, totalSum? }>
 *     raw?: any                 // raw CDEK response (debug only)
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      cityCode,
      bottleCount: rawBottleCount,
      declaredValue: rawDeclaredValue,
      destination: rawDestination,
    } = body ?? {}

    if (!cityCode) {
      return NextResponse.json(
        { error: 'cityCode is required' },
        { status: 400 },
      )
    }

    const bottleCount = Number(rawBottleCount) > 0 ? Math.floor(Number(rawBottleCount)) : 1
    const declaredValue = Number(rawDeclaredValue) > 0 ? Number(rawDeclaredValue) : 0
    const destination: 'pickup' | 'courier' =
      rawDestination === 'courier' ? 'courier' : 'pickup'

    const payload = await getPayload({ config })
    const cdekConfig = await getCdekConfigFromPayload(payload)

    const fromCode = parseInt(cdekConfig.senderCityCode, 10)
    const toCode = parseInt(String(cityCode), 10)
    const tariffCandidates = resolveTariffCodes(destination)
    const { pkg, services, box } = buildPackaging(bottleCount, declaredValue)

    console.log('[CDEK calculate] Request:', {
      from: fromCode,
      to: toCode,
      tariffCandidates,
      destination,
      bottleCount,
      declaredValue,
      box: box.label,
      pkg,
      services,
    })

    // Try each candidate tariff in order, falling back when the CDEK API
    // reports that a sender/recipient warehouse is missing. This is
    // necessary because small towns without a CDEK office can only accept
    // door-to-X shipments, not warehouse-to-X.
    let result: Awaited<ReturnType<typeof calculateTariff>> | null = null
    let usedTariff: number | null = null
    const attempts: { tariff: number; error: string }[] = []

    for (const tariffCode of tariffCandidates) {
      try {
        const r = await calculateTariff(cdekConfig, {
          tariff_code: tariffCode,
          from_location: { code: fromCode },
          to_location: { code: toCode },
          packages: [pkg],
          services,
        })
        if (r.errors && r.errors.length > 0) {
          const msg = r.errors.map((e) => e.message).join('; ')
          attempts.push({ tariff: tariffCode, error: msg })
          // Only fall back on warehouse-availability errors; other errors
          // (e.g. invalid destination) are real failures.
          if (!/склад должен существовать|warehouse/i.test(msg)) {
            return NextResponse.json(
              { error: msg, attempts, details: r },
              { status: 400 },
            )
          }
          continue
        }
        result = r
        usedTariff = tariffCode
        break
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        attempts.push({ tariff: tariffCode, error: msg })
        if (!/склад должен существовать|warehouse/i.test(msg)) throw err
      }
    }

    if (!result || usedTariff == null) {
      return NextResponse.json(
        { error: 'No available tariff for this route', attempts },
        { status: 400 },
      )
    }

    console.log('[CDEK calculate] Result:', {
      tariff_code: usedTariff,
      delivery_sum: result.delivery_sum,
      total_sum: result.total_sum,
      period: `${result.period_min}-${result.period_max}`,
      services: result.services,
    })

    return NextResponse.json({
      delivery_sum: result.delivery_sum,
      total_sum: result.total_sum,
      period_min: result.period_min,
      period_max: result.period_max,
      tariff_code: usedTariff,
      fell_back: usedTariff !== tariffCandidates[0],
      box: {
        label: box.label,
        weightKg: box.weightKg,
        lengthCm: box.lengthCm,
        widthCm: box.widthCm,
        heightCm: box.heightCm,
        cdekCartonCode: box.cdekCartonCode,
      },
      services: result.services ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CDEK calculate error'
    console.error('[CDEK calculate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
