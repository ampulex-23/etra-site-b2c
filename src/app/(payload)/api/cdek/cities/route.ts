import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCdekConfigFromPayload, searchCities } from '@/lib/cdek'

/**
 * GET /api/cdek/cities?city=Моск&size=20
 * Search CDEK cities by name
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const size = Number(searchParams.get('size')) || 20

    if (!city || city.length < 2) {
      return NextResponse.json(
        { error: 'city parameter must be at least 2 characters' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const cdekConfig = await getCdekConfigFromPayload(payload)

    const cities = await searchCities(cdekConfig, {
      city,
      country_codes: 'RU',
      size,
    })

    return NextResponse.json(cities)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CDEK cities search error'
    console.error('[CDEK cities]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
