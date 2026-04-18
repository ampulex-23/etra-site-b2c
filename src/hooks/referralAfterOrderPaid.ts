import type { CollectionAfterChangeHook } from 'payload'
import { calculateCommissions } from '../utils/referral/calculateCommissions'
import { updateTeamTurnover } from '../utils/referral/updateTeamTurnover'
import { checkAutoQualification } from '../utils/referral/checkAutoQualification'

/**
 * Срабатывает при смене статуса заказа на целевой (обычно 'paid').
 *
 * Действия:
 *  1. Рассчитывает все комиссии (рефералка + МЛМ 3 уровня)
 *  2. Создаёт записи в `commissions` со статусом pending
 *  3. Обновляет балансы партнёров (totalEarned, balance)
 *  4. Обновляет агрегаты оборота команды (TeamTurnover)
 *  5. Помечает Customer.firstPurchaseCompleted = true
 *  6. Запускает проверку автоквалификации в МЛМ
 */
export const referralAfterOrderPaid: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (operation !== 'update') return doc

  try {
    const settings = (await req.payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any

    if (!settings?.enabled) return doc

    const awardOnStatus = settings?.awardOnOrderStatus || 'paid'

    const prevPaymentStatus = previousDoc?.payment?.status
    const currPaymentStatus = doc?.payment?.status
    const prevOrderStatus = previousDoc?.status
    const currOrderStatus = doc?.status

    let triggered = false
    if (awardOnStatus === 'paid') {
      triggered = currPaymentStatus === 'paid' && prevPaymentStatus !== 'paid'
    } else if (awardOnStatus === 'delivered') {
      triggered = currOrderStatus === 'delivered' && prevOrderStatus !== 'delivered'
    } else if (awardOnStatus === 'completed') {
      triggered = currOrderStatus === 'completed' && prevOrderStatus !== 'completed'
    }

    if (!triggered) return doc
    if (doc.referralCommissionsCreated) return doc

    const orderId = doc.id
    const buyerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer

    // Обновить firstPurchaseCompleted клиента
    try {
      const buyer = (await req.payload.findByID({ collection: 'customers', id: buyerId })) as any
      if (buyer && !buyer.firstPurchaseCompleted) {
        await req.payload.update({
          collection: 'customers',
          id: buyerId,
          data: { firstPurchaseCompleted: true } as any,
        })
      }
    } catch (err) {
      console.error('[referralAfterOrderPaid] failed to update firstPurchaseCompleted:', err)
    }

    // Автоквалификация в МЛМ
    try {
      await checkAutoQualification({
        payload: req.payload,
        customerId: buyerId,
        triggeringOrderId: orderId,
        settings,
      })
    } catch (err) {
      console.error('[referralAfterOrderPaid] autoQualification failed:', err)
    }

    // Если нет привязки к партнёру — выходим
    const partnerId =
      typeof doc.referralPartner === 'object' ? doc.referralPartner?.id : doc.referralPartner
    if (!partnerId) {
      await req.payload.update({
        collection: 'orders',
        id: orderId,
        data: { referralCommissionsCreated: true } as any,
      })
      return doc
    }

    const partner = (await req.payload.findByID({
      collection: 'referral-partners' as any,
      id: partnerId,
    })) as any

    if (!partner || partner.status !== 'active') return doc

    // Определение первая / повторная покупка
    const buyer = (await req.payload.findByID({
      collection: 'customers',
      id: buyerId,
    })) as any
    const isFirstPurchase = !buyer?.firstPurchaseCompleted

    // Рассчитываем комиссии
    const commissions = await calculateCommissions({
      payload: req.payload,
      order: doc,
      buyerId,
      partner,
      isFirstPurchase,
      settings,
    })

    // Создаём записи комиссий и обновляем балансы
    const balanceIncrementByPartner = new Map<string | number, number>()

    for (const c of commissions) {
      try {
        await req.payload.create({
          collection: 'commissions' as any,
          data: c as any,
        })

        const prev = balanceIncrementByPartner.get(c.recipient) || 0
        balanceIncrementByPartner.set(c.recipient, prev + c.amount)
      } catch (err) {
        console.error('[referralAfterOrderPaid] failed to create commission:', err)
      }
    }

    // Обновляем балансы партнёров
    for (const [recipientId, amount] of balanceIncrementByPartner.entries()) {
      try {
        const p = (await req.payload.findByID({
          collection: 'referral-partners' as any,
          id: recipientId,
        })) as any
        await req.payload.update({
          collection: 'referral-partners' as any,
          id: recipientId,
          data: {
            balance: Number(p?.balance || 0) + amount,
            totalEarned: Number(p?.totalEarned || 0) + amount,
          } as any,
        })
      } catch (err) {
        console.error('[referralAfterOrderPaid] failed to update partner balance:', err)
      }
    }

    // Обновляем командный оборот
    try {
      await updateTeamTurnover({
        payload: req.payload,
        partner,
        orderAmount: Number(doc.total || 0),
        orderCreatedAt: doc.createdAt,
        settings,
      })
    } catch (err) {
      console.error('[referralAfterOrderPaid] failed to update team turnover:', err)
    }

    // Помечаем заказ как обработанный
    await req.payload.update({
      collection: 'orders',
      id: orderId,
      data: { referralCommissionsCreated: true } as any,
    })

    console.log(
      `[referralAfterOrderPaid] Order #${doc.orderNumber}: ${commissions.length} commissions created`,
    )
  } catch (error) {
    console.error('[referralAfterOrderPaid] fatal error:', error)
  }

  return doc
}
