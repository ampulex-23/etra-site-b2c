import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const amount = parseFloat(searchParams.get('amount') || '0')

    if (!code) {
      return NextResponse.json({ error: 'Промокод не указан' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Find promo code
    const promoCodes = await payload.find({
      collection: 'promo-codes',
      where: {
        code: { equals: code.toUpperCase() },
        active: { equals: true },
      },
      limit: 1,
    })

    if (promoCodes.docs.length === 0) {
      return NextResponse.json({ error: 'Промокод не найден или неактивен' }, { status: 404 })
    }

    const promo = promoCodes.docs[0]

    // Check validity dates
    const now = new Date()
    if (promo.validFrom && new Date(promo.validFrom) > now) {
      return NextResponse.json({ error: 'Промокод ещё не действует' }, { status: 400 })
    }
    if (promo.validTo && new Date(promo.validTo) < now) {
      return NextResponse.json({ error: 'Срок действия промокода истёк' }, { status: 400 })
    }

    // Check usage limit
    if (promo.maxUses && promo.usedCount && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ error: 'Промокод исчерпан' }, { status: 400 })
    }

    // Check minimum order amount
    if (promo.minOrderAmount && amount < promo.minOrderAmount) {
      return NextResponse.json({ 
        error: `Минимальная сумма заказа для этого промокода: ${promo.minOrderAmount.toLocaleString('ru-RU')} ₽` 
      }, { status: 400 })
    }

    return NextResponse.json({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderAmount: promo.minOrderAmount,
    })
  } catch (error) {
    console.error('Promo validation error:', error)
    return NextResponse.json({ error: 'Ошибка проверки промокода' }, { status: 500 })
  }
}
