import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * One-time migration endpoint: creates missing base products and fills bundleItems for bundles.
 * POST /api/migrate-bundles  (requires admin auth header or secret)
 */

async function findProductByTitle(payload: any, title: string): Promise<number | null> {
  const res = await payload.find({
    collection: 'products',
    where: { title: { equals: title } },
    limit: 1,
    depth: 0,
  })
  return res.docs[0]?.id ?? null
}

async function findProductBySlug(payload: any, slug: string): Promise<number | null> {
  const res = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return res.docs[0]?.id ?? null
}

async function ensureProduct(
  payload: any,
  slug: string,
  data: Record<string, unknown>,
  log: string[],
): Promise<number> {
  const existing = await findProductBySlug(payload, slug)
  if (existing) {
    log.push(`  exists: ${data.title} (id:${existing})`)
    return existing
  }
  const created = await payload.create({
    collection: 'products',
    data: { ...data, slug },
    overrideAccess: true,
  })
  log.push(`  created: ${data.title} (id:${created.id})`)
  return created.id
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-migrate-secret')
  if (secret !== (process.env.PAYLOAD_SECRET || 'migrate')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await getPayload({ config })
  const log: string[] = []

  try {
    // ===== Step 1: ensure missing base products =====
    log.push('--- Step 1: Ensure base products ---')

    const bioChesnokId = await ensureProduct(payload, 'biochesnok', {
      title: 'Биочеснок',
      shortDescription: 'Ферментированный напиток на основе чеснока — природный антибиотик',
      price: 900,
      category: 3,
      inStock: true,
      status: 'active',
    }, log)

    const bioKhrenId = await ensureProduct(payload, 'biokhren', {
      title: 'Биохрен',
      shortDescription: 'Ферментированный напиток с хреном — антивирусный продукт',
      price: 900,
      category: 3,
      inStock: true,
      status: 'active',
    }, log)

    const dayDrinkId = await ensureProduct(payload, 'den-napolnenie-bioma', {
      title: 'День Наполнение Биома',
      shortDescription: 'Напиток дневного цикла курса смены микробиома — наполнение адаптогенами',
      price: 900,
      category: 3,
      inStock: true,
      status: 'active',
    }, log)

    const eveningDrinkId = await ensureProduct(payload, 'vecher-vosstanovlenie', {
      title: 'Вечер Восстановление',
      shortDescription: 'Напиток вечернего цикла курса смены микробиома — пребиотическое восстановление',
      price: 900,
      category: 3,
      inStock: true,
      status: 'active',
    }, log)

    const utroId = await ensureProduct(payload, 'utro-antiparazitarnyy', {
      title: 'Утро Антипаразитарный',
      shortDescription: 'Напиток утреннего цикла — антипаразитарное очищение на основе свёклы, полыни и чеснока',
      price: 900,
      category: 3,
      inStock: true,
      status: 'active',
    }, log)

    // Find existing base products
    log.push('--- Step 1b: Find existing products ---')

    const rieslingId = await findProductBySlug(payload, 'enzimnyy-napitok-risling') ||
                       await findProductByTitle(payload, 'Энзимный напиток Рислинг')
    const detskiyId = await findProductBySlug(payload, 'enzimnyy-napitok-detskiy') ||
                      await findProductByTitle(payload, 'Энзимный напиток Детский')
    const khmelId = await findProductBySlug(payload, 'enzimnyy-napitok-khmel') ||
                    await findProductByTitle(payload, 'Энзимный напиток Хмель')
    const superKvasId = await findProductBySlug(payload, 'super-kvas') ||
                        await findProductByTitle(payload, 'Супер Квас')
    const elovyyId = await findProductBySlug(payload, 'enzimnyy-napitok-elovyy') ||
                     await findProductByTitle(payload, 'Энзимный напиток Еловый')
    const rozlingId = await findProductBySlug(payload, 'enzimnyy-napitok-rozling') ||
                      await findProductByTitle(payload, 'Энзимный напиток Розлинг')
    const energetikId = await findProductBySlug(payload, 'poleznyy-energetik') ||
                        await findProductByTitle(payload, 'Полезный энергетик')
    const bifidumId = await findProductBySlug(payload, 'bifidumfanata') ||
                      await findProductByTitle(payload, 'БифидумФАНАТА')
    const parazitoffId = await findProductBySlug(payload, 'sukhaya-fermentirovannaya-rastitel-naya-smes-antiparazitarne-prebiotiki-parazitoff') ||
                         await findProductByTitle(payload, 'СУХАЯ ФЕРМЕНТИРОВАННАЯ РАСТИТЕЛЬНАЯ СМЕСЬ АНТИПАРАЗИТАРНЕ ПРЕБИОТИКИ ПАРАЗИТОФФ')

    const idMap: Record<string, number | null> = {
      riesling: rieslingId,
      detskiy: detskiyId,
      khmel: khmelId,
      superKvas: superKvasId,
      elovyy: elovyyId,
      rozling: rozlingId,
      energetik: energetikId,
      utro: utroId,
      bifidumFanata: bifidumId,
      parazitoff: parazitoffId,
      biochesnok: bioChesnokId,
      biokhren: bioKhrenId,
      day: dayDrinkId,
      evening: eveningDrinkId,
    }

    log.push('ID map: ' + JSON.stringify(idMap))

    // ===== Step 2: define bundle compositions =====
    log.push('--- Step 2: Set bundle compositions ---')

    // { bundleProductSlug: [ { productKey, qty } ] }
    const bundleDefs: Record<string, { slug: string; items: { key: string; qty: number }[] }> = {
      'nabor-semeynyy': {
        slug: 'nabor-semeynyy',
        items: [
          { key: 'riesling', qty: 1 },
          { key: 'detskiy', qty: 1 },
          { key: 'khmel', qty: 1 },
        ],
      },
      'nabor-dlya-bani': {
        slug: 'nabor-dlya-bani',
        items: [
          { key: 'superKvas', qty: 1 },
          { key: 'riesling', qty: 1 },
          { key: 'khmel', qty: 1 },
          { key: 'elovyy', qty: 1 },
        ],
      },
      'nabor-dlya-gurmanov': {
        slug: 'nabor-dlya-gurmanov',
        items: [
          { key: 'rozling', qty: 1 },
          { key: 'energetik', qty: 1 },
          { key: 'khmel', qty: 1 },
          { key: 'elovyy', qty: 1 },
          { key: 'superKvas', qty: 1 },
          { key: 'riesling', qty: 1 },
        ],
      },
      'nabor-antivirus': {
        slug: 'nabor-antivirus',
        items: [
          { key: 'biochesnok', qty: 2 },
          { key: 'biokhren', qty: 2 },
          { key: 'parazitoff', qty: 1 },
        ],
      },
      'nabor-chistoe-utro': {
        slug: 'nabor-chistoe-utro',
        items: [
          { key: 'utro', qty: 2 },
          { key: 'parazitoff', qty: 1 },
        ],
      },
      'kurs-chistka-mikrobioma': {
        slug: 'kurs-chistka-mikrobioma',
        items: [
          { key: 'utro', qty: 3 },
          { key: 'day', qty: 3 },
          { key: 'bifidumFanata', qty: 3 },
          { key: 'evening', qty: 3 },
        ],
      },
      'aktsiya-dva-kursa-smeny-mikrobioma': {
        slug: 'aktsiya-dva-kursa-smeny-mikrobioma',
        items: [
          { key: 'utro', qty: 6 },
          { key: 'day', qty: 6 },
          { key: 'bifidumFanata', qty: 6 },
          { key: 'evening', qty: 6 },
        ],
      },
    }

    // ===== Step 3: apply bundle compositions =====
    log.push('--- Step 3: Apply bundles ---')

    for (const [, def] of Object.entries(bundleDefs)) {
      const bundleProduct = await payload.find({
        collection: 'products',
        where: { slug: { equals: def.slug } },
        limit: 1,
        depth: 0,
      })

      if (!bundleProduct.docs[0]) {
        log.push(`  SKIP: bundle ${def.slug} not found`)
        continue
      }

      const bundleId = bundleProduct.docs[0].id
      const existingItems = bundleProduct.docs[0].bundleItems || []

      if (existingItems.length >= def.items.length) {
        log.push(`  SKIP: ${def.slug} (id:${bundleId}) already has ${existingItems.length} bundle items (expected ${def.items.length})`)
        continue
      }

      if (existingItems.length > 0) {
        log.push(`  UPDATE: ${def.slug} (id:${bundleId}) has ${existingItems.length} items, expected ${def.items.length} — replacing`)
      }

      const bundleItems: { product: number; quantity: number }[] = []
      let allFound = true

      for (const item of def.items) {
        const productId = idMap[item.key]
        if (!productId) {
          log.push(`  WARN: ${def.slug} — base product '${item.key}' not found`)
          allFound = false
          continue
        }
        bundleItems.push({ product: productId, quantity: item.qty })
      }

      if (!allFound) {
        log.push(`  PARTIAL: ${def.slug} — some items missing, applying what we have`)
      }

      if (bundleItems.length === 0) {
        log.push(`  SKIP: ${def.slug} — no valid items`)
        continue
      }

      await payload.update({
        collection: 'products',
        id: bundleId,
        data: {
          isBundle: true,
          bundleItems,
        },
        overrideAccess: true,
      })

      log.push(`  OK: ${def.slug} (id:${bundleId}) => isBundle=true, ${bundleItems.length} items`)
    }

    log.push('--- DONE ---')
    return NextResponse.json({ success: true, log })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    log.push(`ERROR: ${msg}`)
    return NextResponse.json({ success: false, log, error: msg }, { status: 500 })
  }
}
