#!/usr/bin/env node
/**
 * Test script for CDEK delivery cost calculator.
 *
 * Calls CDEK /calculator/tariff directly (bypassing Next.js) with the
 * packaging rules from src/lib/cdek-packaging.ts, across a set of
 * representative destination cities.
 *
 * Usage:  node scripts/test-cdek-calc.mjs
 *
 * Requires env vars (or falls back to test credentials):
 *   CDEK_ACCOUNT / CDEK_SECURE  — production creds (optional)
 *   CDEK_TEST_MODE=1            — force test mode
 */

// ---------- CONFIG ----------
const CDEK_TEST_CLIENT_ID = 'wqGwiQx0gg8mLtiEKsUinjVSICCjtTEP'
const CDEK_TEST_SECRET = 'RmAmgvSgSl1yirlz9QupbzOJVqhCxcP5'

const useTestMode = !process.env.CDEK_ACCOUNT || process.env.CDEK_TEST_MODE === '1'
const clientId = useTestMode ? CDEK_TEST_CLIENT_ID : process.env.CDEK_ACCOUNT
const clientSecret = useTestMode ? CDEK_TEST_SECRET : process.env.CDEK_SECURE
const API_BASE = useTestMode
  ? 'https://api.edu.cdek.ru/v2'
  : 'https://api.cdek.ru/v2'

console.log(`[CDEK test] Mode: ${useTestMode ? 'TEST' : 'PROD'}`)
console.log(`[CDEK test] API: ${API_BASE}`)

// Sender: в проде — Сочи (119, склад СДЭК Транспортная 17А).
// В тестовой среде СДЭК дефолтные кредлы работают только из Москвы (44),
// поэтому для тестирования API используем Москву.
const SENDER_CITY_CODE = useTestMode ? 44 : 119

// Representative destinations for sanity checking
const DESTINATIONS = [
  { code: 44, name: 'Москва' },
  { code: 137, name: 'Санкт-Петербург' },
  { code: 270, name: 'Краснодар' },
  { code: 435, name: 'Новосибирск' },
  { code: 55, name: 'Екатеринбург' },
  { code: 414, name: 'Владивосток' },
  { code: 119, name: 'Сочи (локально)' },
]

// Scenarios to test
const SCENARIOS = [
  { bottles: 1, declaredValue: 1500 },
  { bottles: 2, declaredValue: 3000 },
  { bottles: 4, declaredValue: 6000 },
  { bottles: 6, declaredValue: 9000 },
  { bottles: 12, declaredValue: 18000 },
]

// ---------- PACKAGING (mirrors src/lib/cdek-packaging.ts) ----------
// Synced with src/lib/cdek-packaging.ts — CDEK carton codes verified live.
const BOX_TABLE = {
  1: { label: 'M',    lengthCm: 33, widthCm: 25, heightCm: 15, weightKg: 2,  cdekCartonCode: 'CARTON_BOX_M' },
  2: { label: 'L',    lengthCm: 31, widthCm: 28, heightCm: 38, weightKg: 4,  cdekCartonCode: 'CARTON_BOX_10KG' },
  3: { label: '10кг', lengthCm: 40, widthCm: 35, heightCm: 28, weightKg: 6,  cdekCartonCode: 'CARTON_BOX_10KG' },
  4: { label: '10кг', lengthCm: 40, widthCm: 35, heightCm: 28, weightKg: 8,  cdekCartonCode: 'CARTON_BOX_10KG' },
  5: { label: 'XL',   lengthCm: 60, widthCm: 30, heightCm: 35, weightKg: 10, cdekCartonCode: 'CARTON_BOX_20KG' },
  6: { label: 'XL',   lengthCm: 60, widthCm: 30, heightCm: 35, weightKg: 12, cdekCartonCode: 'CARTON_BOX_20KG' },
  7: { label: '20кг', lengthCm: 47, widthCm: 40, heightCm: 43, weightKg: 14, cdekCartonCode: 'CARTON_BOX_20KG' },
  8: { label: '20кг', lengthCm: 47, widthCm: 40, heightCm: 43, weightKg: 16, cdekCartonCode: 'CARTON_BOX_20KG' },
  9: { label: '20кг', lengthCm: 47, widthCm: 40, heightCm: 43, weightKg: 18, cdekCartonCode: 'CARTON_BOX_20KG' },
  10:{ label: '30кг', lengthCm: 47, widthCm: 40, heightCm: 43, weightKg: 20, cdekCartonCode: 'CARTON_BOX_30KG' },
  11:{ label: '30кг', lengthCm: 47, widthCm: 40, heightCm: 43, weightKg: 22, cdekCartonCode: 'CARTON_BOX_30KG' },
  12:{ label: '30кг', lengthCm: 47, widthCm: 40, heightCm: 43, weightKg: 23, cdekCartonCode: 'CARTON_BOX_30KG' },
}

function buildPackaging(bottleCount, declaredValueRub) {
  const n = Math.max(1, Math.min(12, Math.floor(bottleCount)))
  const box = BOX_TABLE[n]
  const pkg = {
    weight: Math.round(box.weightKg * 1000),
    length: box.lengthCm,
    width: box.widthCm,
    height: box.heightCm,
  }
  // Packaging is done at the СДЭК Sochi office with CDEK stock materials:
  //   — bubble wrap (~0.5 m per bottle)
  //   — inner + outer carton of the same type (коробка в коробке)
  //   — cardboard filler between the two cartons
  const services = []
  if (declaredValueRub > 0) {
    services.push({ code: 'INSURANCE', parameter: String(Math.round(declaredValueRub)) })
  }
  const bubbleMeters = Math.max(1, Math.ceil(n * 0.5))
  services.push({ code: 'BUBBLE_WRAP', parameter: String(bubbleMeters) })
  services.push({ code: 'CARTON_FILLER', parameter: '1' })
  if (box.cdekCartonCode) {
    services.push({ code: box.cdekCartonCode, parameter: '2' })
  }
  return { pkg, services, box }
}

// ---------- AUTH ----------
let tokenCache = null
async function getToken() {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const authUrl = useTestMode
    ? 'https://api.edu.cdek.ru/v2/oauth/token'
    : 'https://api.cdek.ru/v2/oauth/token'
  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  if (!res.ok) {
    throw new Error(`CDEK auth failed (${res.status}): ${await res.text()}`)
  }
  const data = await res.json()
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
  return data.access_token
}

// ---------- CALCULATE ----------
async function calc(destCode, tariffCode, pkg, services) {
  const token = await getToken()
  const body = {
    tariff_code: tariffCode,
    from_location: { code: SENDER_CITY_CODE },
    to_location: { code: destCode },
    packages: [pkg],
    services,
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
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { ok: res.ok, status: res.status, data: json }
}

async function calcList(destCode, pkg) {
  const token = await getToken()
  const body = {
    from_location: { code: SENDER_CITY_CODE },
    to_location: { code: destCode },
    packages: [pkg],
  }
  const res = await fetch(`${API_BASE}/calculator/tarifflist`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { ok: res.ok, status: res.status, data: json }
}

// ---------- MAIN ----------
async function main() {
  const results = []
  for (const scenario of SCENARIOS) {
    const { pkg, services, box } = buildPackaging(scenario.bottles, scenario.declaredValue)
    console.log(`\n=== Сценарий: ${scenario.bottles} бут. (${box.label} ${box.weightKg}кг), объявлено ${scenario.declaredValue}₽ ===`)
    console.log(`    Пакет: ${pkg.length}×${pkg.width}×${pkg.height} см, ${pkg.weight} г`)
    console.log(`    Услуги: ${services.map(s => `${s.code}${s.parameter ? `=${s.parameter}` : ''}`).join(', ')}`)

    for (const dest of DESTINATIONS) {
      // For each delivery mode, try primary tariff → fall back to дверь-X
      // on warehouse-availability errors.
      for (const mode of [
        { label: 'pickup ', candidates: [136, 139] },
        { label: 'courier', candidates: [137, 138] },
      ]) {
        let finalOk = null
        let finalErr = null
        let usedTariff = null
        for (const tariffCode of mode.candidates) {
          try {
            const { ok, status, data } = await calc(dest.code, tariffCode, pkg, services)
            if (!ok || data.errors) {
              const err = (data.errors && data.errors.map(e => e.message).join('; ')) || `HTTP ${status}`
              finalErr = err
              if (!/склад должен существовать|warehouse/i.test(err)) break
              continue
            }
            finalOk = data
            usedTariff = tariffCode
            break
          } catch (err) {
            finalErr = err.message
            if (!/склад должен существовать|warehouse/i.test(err.message)) break
          }
        }

        if (finalOk) {
          const sum = Math.round(finalOk.total_sum ?? finalOk.delivery_sum)
          const period = `${finalOk.period_min}-${finalOk.period_max}д`
          const fb = usedTariff !== mode.candidates[0] ? ' ⚠️fallback' : ''
          console.log(`    ✅ ${dest.name.padEnd(22)} [${mode.label}] t${usedTariff}${fb} — ${sum.toString().padStart(5)}₽ (${period})`)
          results.push({ scenario: scenario.bottles, city: dest.name, mode: mode.label, usedTariff, sum, period })
        } else {
          console.log(`    ❌ ${dest.name.padEnd(22)} [${mode.label}] — ${finalErr}`)
          results.push({ scenario: scenario.bottles, city: dest.name, mode: mode.label, error: finalErr })
        }
      }

      // Tarifflist diagnostic: what tariffs ARE available for this route
      // (useful to see if test env returns anything useful at all).
      try {
        const { ok, data } = await calcList(dest.code, pkg)
        if (ok && Array.isArray(data.tariff_codes) && data.tariff_codes.length > 0) {
          const top = [...data.tariff_codes]
            .sort((a, b) => a.delivery_sum - b.delivery_sum)
            .slice(0, 3)
            .map((t) => `${t.tariff_code}:${Math.round(t.delivery_sum)}₽`)
            .join(' ')
          console.log(`       list → ${top}  (всего ${data.tariff_codes.length})`)
        }
      } catch (_) { /* ignore */ }
    }
  }

  // Summary
  console.log('\n\n====== ИТОГОВАЯ СВОДКА ======')
  const failed = results.filter(r => r.error)
  const ok = results.filter(r => !r.error)
  console.log(`Успешно: ${ok.length}, Ошибок: ${failed.length}`)
  if (failed.length > 0) {
    console.log('\nОшибки:')
    for (const r of failed) {
      console.log(`  ${r.scenario}бут → ${r.city} [${r.tariff}]: ${r.error}`)
    }
  }
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
