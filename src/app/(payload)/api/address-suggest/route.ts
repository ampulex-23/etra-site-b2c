import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query, count = 5 } = await req.json()

    const token = process.env.DADATA_API_KEY
    if (!token) {
      return NextResponse.json(
        { suggestions: [], error: 'DADATA_API_KEY not configured' },
        { status: 200 },
      )
    }

    const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        query,
        count,
        language: 'ru',
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[address-suggest] DaData error:', res.status, text)
      return NextResponse.json({ suggestions: [] }, { status: 200 })
    }

    const data = await res.json()
    return NextResponse.json({
      suggestions: (data.suggestions || []).map((s: any) => ({
        value: s.value,
        city: s.data?.city || s.data?.settlement || '',
        street: s.data?.street_with_type || '',
        house: s.data?.house ? `${s.data.house_type || 'д.'} ${s.data.house}` : '',
        flat: s.data?.flat ? `${s.data.flat_type || 'кв.'} ${s.data.flat}` : '',
        postalCode: s.data?.postal_code || '',
        region: s.data?.region_with_type || '',
        lat: s.data?.geo_lat || null,
        lon: s.data?.geo_lon || null,
      })),
    })
  } catch (err) {
    console.error('[address-suggest] Error:', err)
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}
