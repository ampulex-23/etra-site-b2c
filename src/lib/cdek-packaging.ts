/**
 * CDEK packaging logic specific to Enzym (bottled enzymes).
 *
 * Business rules provided by the shop owner:
 *   - Every bottle is individually wrapped in ~0.5 m of bubble wrap.
 *   - Bottles are placed in an inner box, then the inner box is placed
 *     into a second outer box with a cardboard filler ("коробка в коробке").
 *   - The entire shipment is insured for the declared order value.
 *
 * The box sizing table below reflects the actual packaging workflow.
 * The `cdekCartonCode` maps to CDEK's SERVICE_CODES where available,
 * so the shipment can be registered with the corresponding CDEK packaging
 * service. When the physical box does not match a stock CDEK carton, we
 * still send the real dimensions/weight and omit the carton service.
 */

export interface BoxSpec {
  /** Human-readable label for UI/debug */
  label: string
  /** Physical dimensions in centimeters */
  lengthCm: number
  widthCm: number
  heightCm: number
  /** Gross weight of the PACKED box in kilograms */
  weightKg: number
  /**
   * CDEK SERVICE_CODE for this carton, if a stock carton exactly/closely
   * matches the physical box. Passed as an additional paid service so the
   * customer sees the correctly priced packaging in the final sum.
   */
  cdekCartonCode: string | null
}

/**
 * Bottle-count → box specification.
 *
 * Physical dimensions/weights come from the shop owner's packaging table
 * (screenshot). The `cdekCartonCode` maps to CDEK's current live
 * SERVICE_CODES — verified via scripts/probe-cdek-packaging.mjs on
 * 2026-04-23. Old SDK docs listed codes that the API now rejects
 * ("CARTON_BOX_L", "CARTON_BOX_15KG", etc. — no longer sold by CDEK).
 *
 * Currently accepted packaging services and their weight limits:
 *   CARTON_BOX_M     — 5  кг (33×25×15)
 *   CARTON_BOX_2KG   — 2  кг (34×24×10)
 *   CARTON_BOX_3KG   — 3  кг (24×24×21)
 *   CARTON_BOX_5KG   — 5  кг (40×24×21)
 *   CARTON_BOX_10KG  — 10 кг (40×35×28)
 *   CARTON_BOX_20KG  — 20 кг (47×40×43)
 *   CARTON_BOX_30KG  — 30 кг (69×39×42)
 *
 * The selected carton is the smallest stock CDEK carton whose weight
 * limit covers the shipment; its price is charged as a paid service
 * (×2 because we use "коробка в коробке" — inner + outer).
 */
const BOX_TABLE: Record<number, BoxSpec> = {
  1: {
    label: 'M (1 бут.)',
    lengthCm: 33,
    widthCm: 25,
    heightCm: 15,
    weightKg: 2,
    // Exact match: CDEK M = 33×25×15, 5 кг limit
    cdekCartonCode: 'CARTON_BOX_M',
  },
  2: {
    label: 'L (2 бут.)',
    lengthCm: 31,
    widthCm: 28,
    heightCm: 38,
    weightKg: 4,
    // TODO: уточнить у владельца/сотрудника СДЭК-Сочи, какая коробка
    // реально используется для 2 бутылок — в актуальном API СДЭК нет
    // CARTON_BOX_L (34×33×26), и "L 31×28×38" из таблицы не совпадает
    // ни с одной стоковой коробкой СДЭК. Пока ставим CARTON_BOX_10KG
    // как ближайший тариф по весу (до 10 кг).
    cdekCartonCode: 'CARTON_BOX_10KG',
  },
  3: {
    label: '10кг (3 бут.)',
    lengthCm: 40,
    widthCm: 35,
    heightCm: 28,
    weightKg: 6,
    cdekCartonCode: 'CARTON_BOX_10KG',
  },
  4: {
    label: '10кг (4 бут.)',
    lengthCm: 40,
    widthCm: 35,
    heightCm: 28,
    weightKg: 8,
    cdekCartonCode: 'CARTON_BOX_10KG',
  },
  5: {
    label: 'XL (5 бут.)',
    lengthCm: 60,
    widthCm: 30,
    heightCm: 35,
    weightKg: 10,
    // "XL 60×30×35" isn't a stock CDEK size either (CARTON_BOX_15KG is
    // discontinued). 20KG is the next live tier that fits by weight.
    cdekCartonCode: 'CARTON_BOX_20KG',
  },
  6: {
    label: 'XL (6 бут.)',
    lengthCm: 60,
    widthCm: 30,
    heightCm: 35,
    weightKg: 12,
    cdekCartonCode: 'CARTON_BOX_20KG',
  },
  7: {
    label: '20кг (7 бут.)',
    lengthCm: 47,
    widthCm: 40,
    heightCm: 43,
    weightKg: 14,
    // Exact match: CDEK 20KG = 47×40×43
    cdekCartonCode: 'CARTON_BOX_20KG',
  },
  8: {
    label: '20кг (8 бут.)',
    lengthCm: 47,
    widthCm: 40,
    heightCm: 43,
    weightKg: 16,
    cdekCartonCode: 'CARTON_BOX_20KG',
  },
  9: {
    label: '20кг (9 бут.)',
    lengthCm: 47,
    widthCm: 40,
    heightCm: 43,
    weightKg: 18,
    cdekCartonCode: 'CARTON_BOX_20KG',
  },
  10: {
    label: '20кг (10 бут.)',
    lengthCm: 47,
    widthCm: 40,
    heightCm: 43,
    weightKg: 20,
    // At 20 кг we're on the edge of CARTON_BOX_20KG's limit — step up
    // so the box doesn't tear. CDEK 30KG = 69×39×42.
    cdekCartonCode: 'CARTON_BOX_30KG',
  },
  11: {
    label: '20кг (11 бут.)',
    lengthCm: 47,
    widthCm: 40,
    heightCm: 43,
    weightKg: 22,
    cdekCartonCode: 'CARTON_BOX_30KG',
  },
  12: {
    label: '20кг (12 бут.)',
    lengthCm: 47,
    widthCm: 40,
    heightCm: 43,
    weightKg: 23,
    cdekCartonCode: 'CARTON_BOX_30KG',
  },
}

/**
 * Pick the appropriate box for a given bottle count.
 *
 * For counts > 12 we stack multiple 20-kg boxes: returns the largest box
 * and the caller should split the shipment into N packages. For simplicity
 * the current implementation caps at a single package of 12 bottles — the
 * checkout screen should never let a customer order more than 12 at once
 * without manual handling.
 */
export function selectBoxForBottles(bottleCount: number): BoxSpec {
  const n = Math.max(1, Math.min(12, Math.floor(bottleCount)))
  return BOX_TABLE[n]
}

export interface CdekService {
  code: string
  parameter?: string
}

/**
 * Build the CDEK calculator package + services payload for a shipment
 * containing `bottleCount` bottles with the given declared value (in RUB).
 *
 * Returns:
 *   - pkg: packages[0] entry with real dimensions & weight in grams
 *   - services: paid services to include in the tariff calculation
 *               (insurance, bubble wrap, carton filler, outer carton)
 *   - box: the selected BoxSpec (useful for UI breakdown)
 */
export function buildPackaging(
  bottleCount: number,
  declaredValueRub: number,
): {
  pkg: { weight: number; length: number; width: number; height: number }
  services: CdekService[]
  box: BoxSpec
} {
  const box = selectBoxForBottles(bottleCount)

  const pkg = {
    // CDEK expects weight in GRAMS
    weight: Math.round(box.weightKg * 1000),
    length: box.lengthCm,
    width: box.widthCm,
    height: box.heightCm,
  }

  const services: CdekService[] = []

  // Insurance: declared value covers the full order amount.
  // CDEK expects the declared value as a string parameter in rubles.
  if (declaredValueRub > 0) {
    services.push({
      code: 'INSURANCE',
      parameter: String(Math.round(declaredValueRub)),
    })
  }

  // Packaging is performed by the CDEK office worker in Sochi using CDEK's
  // stock materials (paid services).
  //
  //   - Each bottle is wrapped in ~0.5 m of bubble wrap.
  //   - Bottles go into an inner carton, which is placed inside a second
  //     (outer) carton of the same type. Hence `parameter: '2'`.
  //   - A pressed-cardboard filler goes between the inner and outer box.
  //
  // When the physical box does not map cleanly to a CDEK stock size
  // (e.g. the 2-bottle 31×28×38 layout), `cdekCartonCode` still points at
  // the closest matching CDEK carton by weight class — that is what the
  // СДЭК office actually stocks and charges for.
  const bubbleMeters = Math.max(1, Math.ceil(bottleCount * 0.5))
  services.push({
    code: 'BUBBLE_WRAP',
    parameter: String(bubbleMeters),
  })
  services.push({
    code: 'CARTON_FILLER',
    parameter: '1',
  })
  if (box.cdekCartonCode) {
    services.push({
      code: box.cdekCartonCode,
      // Коробка в коробке: одна внутренняя + одна внешняя того же типа.
      parameter: '2',
    })
  }

  return { pkg, services, box }
}

/**
 * Resolve the ordered list of CDEK tariff codes to try for a given
 * destination type, with automatic fallback.
 *
 * Sender is the CDEK office in Sochi (Транспортная 17А). We prefer
 * "склад → X" tariffs because the shipment is actually tendered at a
 * CDEK office, which is cheaper for the customer. Some small towns
 * don't have a CDEK warehouse, in which case the API returns
 * "склад должен существовать…" and we fall back to the "дверь → X"
 * pair (a courier pickup from our address), which adds a small pickup
 * fee but always works.
 *
 * Tariff reference (ИМ — интернет-магазин группа):
 *   136 — склад → склад  (PVZ / postamat pickup)
 *   137 — склад → дверь  (courier to address)
 *   139 — дверь → склад  (fallback when sender city lacks warehouse)
 *   138 — дверь → дверь  (full courier fallback)
 */
export function resolveTariffCodes(
  destination: 'pickup' | 'courier',
): number[] {
  if (destination === 'courier') return [137, 138]
  return [136, 139]
}

/** @deprecated use resolveTariffCodes for automatic fallback */
export function resolveTariffCode(destination: 'pickup' | 'courier'): number {
  return resolveTariffCodes(destination)[0]
}
