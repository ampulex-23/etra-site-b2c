/**
 * API Route: T-Bank Payment Notification Webhook
 * POST /api/payments/notification
 * 
 * Receives payment status notifications from T-Bank
 * Must respond with "OK" (HTTP 200) to acknowledge
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { verifyNotificationToken, type TBankNotification } from '@/lib/tbank-payment'

export async function POST(request: NextRequest) {
  try {
    const notification: TBankNotification = await request.json()
    
    console.log('T-Bank notification received:', {
      orderId: notification.OrderId,
      status: notification.Status,
      success: notification.Success,
      amount: notification.Amount,
      paymentId: notification.PaymentId,
    })
    
    // Get passwords from settings or env
    const payload = await getPayload({ config })
    const shopSettings = await payload.findGlobal({ slug: 'shop-settings' }) as any
    
    const passwords = [
      shopSettings.tbankPassword,
      shopSettings.tbankDemoPassword,
      process.env.TBANK_PASSWORD,
      process.env.TBANK_DEMO_PASSWORD,
    ].filter(Boolean)
    
    // Verify token signature
    const isValid = passwords.some(pwd => pwd && verifyNotificationToken(notification, pwd))
    
    if (!isValid) {
      console.error('T-Bank notification: Invalid token signature')
    }
    
    // Process notification based on status
    switch (notification.Status) {
      case 'AUTHORIZED':
        console.log(`Payment ${notification.PaymentId} authorized for order ${notification.OrderId}`)
        await handlePaymentAuthorized(notification, payload)
        break
        
      case 'CONFIRMED':
        console.log(`Payment ${notification.PaymentId} confirmed for order ${notification.OrderId}`)
        await handlePaymentConfirmed(notification, payload)
        break
        
      case 'REVERSED':
        console.log(`Payment ${notification.PaymentId} reversed for order ${notification.OrderId}`)
        await handlePaymentReversed(notification, payload)
        break
        
      case 'REFUNDED':
        console.log(`Payment ${notification.PaymentId} refunded for order ${notification.OrderId}`)
        await handlePaymentRefunded(notification, payload)
        break
        
      case 'PARTIAL_REFUNDED':
        console.log(`Payment ${notification.PaymentId} partially refunded for order ${notification.OrderId}`)
        break
        
      case 'REJECTED':
        console.log(`Payment ${notification.PaymentId} rejected for order ${notification.OrderId}`)
        await handlePaymentRejected(notification, payload)
        break
        
      default:
        console.log(`Unknown payment status: ${notification.Status}`)
    }
    
    // T-Bank requires "OK" response to acknowledge notification
    return new NextResponse('OK', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
    
  } catch (error) {
    console.error('T-Bank notification processing error:', error)
    return new NextResponse('OK', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

/**
 * Handle AUTHORIZED status
 */
async function handlePaymentAuthorized(notification: TBankNotification, payload: any) {
  try {
    const orders = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: notification.OrderId } },
      limit: 1,
    })
    
    if (orders.docs.length > 0) {
      await payload.update({
        collection: 'orders',
        id: orders.docs[0].id,
        data: {
          'payment.transactionId': String(notification.PaymentId),
          'payment.status': 'pending',
        },
      })
    }
  } catch (err) {
    console.error('handlePaymentAuthorized error:', err)
  }
}

/**
 * Handle CONFIRMED status - payment successful
 */
async function handlePaymentConfirmed(notification: TBankNotification, payload: any) {
  try {
    const orders = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: notification.OrderId } },
      limit: 1,
    })
    
    if (orders.docs.length > 0) {
      const order = orders.docs[0]
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          status: order.status === 'new' ? 'processing' : order.status,
          'payment.status': 'paid',
          'payment.transactionId': String(notification.PaymentId),
          'payment.paidAt': new Date().toISOString(),
        },
      })
      console.log(`Order ${notification.OrderId} marked as paid`)
    }
  } catch (err) {
    console.error('handlePaymentConfirmed error:', err)
  }
}

/**
 * Handle REVERSED status - payment cancelled
 */
async function handlePaymentReversed(notification: TBankNotification, payload: any) {
  try {
    const orders = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: notification.OrderId } },
      limit: 1,
    })
    
    if (orders.docs.length > 0) {
      await payload.update({
        collection: 'orders',
        id: orders.docs[0].id,
        data: {
          'payment.status': 'cancelled',
        },
      })
    }
  } catch (err) {
    console.error('handlePaymentReversed error:', err)
  }
}

/**
 * Handle REFUNDED status - full refund
 */
async function handlePaymentRefunded(notification: TBankNotification, payload: any) {
  try {
    const orders = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: notification.OrderId } },
      limit: 1,
    })
    
    if (orders.docs.length > 0) {
      await payload.update({
        collection: 'orders',
        id: orders.docs[0].id,
        data: {
          'payment.status': 'refunded',
        },
      })
    }
  } catch (err) {
    console.error('handlePaymentRefunded error:', err)
  }
}

/**
 * Handle REJECTED status - payment failed
 */
async function handlePaymentRejected(notification: TBankNotification, payload: any) {
  try {
    const orders = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: notification.OrderId } },
      limit: 1,
    })
    
    if (orders.docs.length > 0) {
      await payload.update({
        collection: 'orders',
        id: orders.docs[0].id,
        data: {
          'payment.status': 'cancelled',
        },
      })
    }
  } catch (err) {
    console.error('handlePaymentRejected error:', err)
  }
}
