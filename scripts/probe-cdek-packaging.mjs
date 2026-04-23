#!/usr/bin/env node
/**
 * Probe which CDEK packaging SERVICE_CODES are actually accepted by the
 * live API. Older SDK documentation lists services that CDEK has since
 * discontinued — this script asks the API one service at a time and
 * reports which ones the current backend recognises.
 */

const CDEK_TEST_CLIENT_ID = 'wqGwiQx0gg8mLtiEKsUinjVSICCjtTEP'
const CDEK_TEST_SECRET = 'RmAmgvSgSl1yirlz9QupbzOJVqhCxcP5'
const API_BASE = 'https://api.edu.cdek.ru/v2'

const CANDIDATE_SERVICES = [
  // Cartons (all sizes from SDK)
  'CARTON_BOX_XS',
  'CARTON_BOX_S',
  'CARTON_BOX_M',
  'CARTON_BOX_L',
  'CARTON_BOX_XL',
  'CARTON_BOX_500GR',
  'CARTON_BOX_1KG',
  'CARTON_BOX_2KG',
  'CARTON_BOX_3KG',
  'CARTON_BOX_5KG',
  'CARTON_BOX_10KG',
  'CARTON_BOX_15KG',
  'CARTON_BOX_20KG',
  'CARTON_BOX_30KG',
  // Fillers / wrapping
  'BUBBLE_WRAP',
  'WASTE_PAPER',
  'CARTON_FILLER',
  // Insurance (should always pass)
  'INSURANCE',
]

async function getToken() {
  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CDEK_TEST_CLIENT_ID,
      client_secret: CDEK_TEST_SECRET,
    }).toString(),
  })
  if (!res.ok) throw new Error(`auth ${res.status}: ${await res.text()}`)
  return (await res.json()).access_token
}

async function probe(token, code) {
  const body = {
    tariff_code: 136, // any valid tariff; we only care whether service is rejected
    from_location: { code: 44 },
    to_location: { code: 137 },
    packages: [{ weight: 2000, length: 33, width: 25, height: 15 }],
    services: [
      { code, parameter: code === 'INSURANCE' ? '1000' : '1' },
    ],
  }
  const res = await fetch(`${API_BASE}/calculator/tariff`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }

  const errMsg = Array.isArray(data.errors) && data.errors.length > 0
    ? data.errors.map((e) => e.message).join('; ')
    : null
  const svcArr = Array.isArray(data.services) ? data.services : []
  const foundService = svcArr.find((s) => s.code === code)

  // "Дополнительной услуги с кодом null не существует" → service unknown
  const isUnknown = errMsg && /услуги с кодом.*не существует/i.test(errMsg)
  return {
    code,
    ok: !errMsg,
    unknown: !!isUnknown,
    error: errMsg,
    servicePrice: foundService ? Math.round(foundService.total_sum ?? foundService.sum ?? 0) : null,
  }
}

async function main() {
  const token = await getToken()
  console.log('Пробую услуги по очереди (на маршруте Москва→СПб, 1 бут M):\n')
  const results = []
  for (const code of CANDIDATE_SERVICES) {
    try {
      const r = await probe(token, code)
      results.push(r)
      const status = r.ok
        ? `✅ принято${r.servicePrice != null ? ` — ${r.servicePrice}₽` : ''}`
        : r.unknown
          ? '❌ КОД НЕ СУЩЕСТВУЕТ'
          : `⚠️  ${r.error}`
      console.log(`  ${code.padEnd(18)} → ${status}`)
    } catch (err) {
      console.log(`  ${code.padEnd(18)} → 💥 ${err.message}`)
    }
  }

  console.log('\n=== СВОДКА ===')
  const accepted = results.filter((r) => r.ok).map((r) => r.code)
  const unknown = results.filter((r) => r.unknown).map((r) => r.code)
  console.log(`Принимаются API: ${accepted.join(', ')}`)
  console.log(`Не существуют:   ${unknown.join(', ') || '(ни один)'}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
