/**
 * API Route: T-Bank Payment Notification Webhook
 * POST /api/payments/notification
 * 
 * Receives payment status notifications from T-Bank
 * Must respond with "OK" (HTTP 200) to acknowledge
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyNotificationToken, type TBankNotification } from '@/lib/tbank-payment'

const TBANK_PASSWORD = process.env.TBANK_PASSWORD || ''
const TBANK_DEMO_PASSWORD = process.env.TBANK_DEMO_PASSWORD || ''

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
    
    // Verify token signature (try both production and demo passwords)
    const isValidProd = TBANK_PASSWORD && verifyNotificationToken(notification, TBANK_PASSWORD)
    const isValidDemo = TBANK_DEMO_PASSWORD && verifyNotificationToken(notification, TBANK_DEMO_PASSWORD)
    
    if (!isValidProd && !isValidDemo) {
      console.error('T-Bank notification: Invalid token signature')
      // Still return OK to prevent retries, but log the error
      // In production, you might want to handle this differently
    }
    
    // Process notification based on status
    switch (notification.Status) {
      case 'AUTHORIZED':
        // Payment authorized but not yet confirmed (for two-stage payments)
        console.log(`Payment ${notification.PaymentId} authorized for order ${notification.OrderId}`)
        await handlePaymentAuthorized(notification)
        break
        
      case 'CONFIRMED':
        // Payment confirmed and funds captured
        console.log(`Payment ${notification.PaymentId} confirmed for order ${notification.OrderId}`)
        await handlePaymentConfirmed(notification)
        break
        
      case 'REVERSED':
        // Payment reversed (cancelled before confirmation)
        console.log(`Payment ${notification.PaymentId} reversed for order ${notification.OrderId}`)
        await handlePaymentReversed(notification)
        break
        
      case 'REFUNDED':
        // Full refund
        console.log(`Payment ${notification.PaymentId} refunded for order ${notification.OrderId}`)
        await handlePaymentRefunded(notification)
        break
        
      case 'PARTIAL_REFUNDED':
        // Partial refund
        console.log(`Payment ${notification.PaymentId} partially refunded for order ${notification.OrderId}`)
        await handlePaymentPartialRefunded(notification)
        break
        
      case 'REJECTED':
        // Payment rejected
        console.log(`Payment ${notification.PaymentId} rejected for order ${notification.OrderId}`)
        await handlePaymentRejected(notification)
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
    // Return OK anyway to prevent infinite retries
    // Log error for investigation
    return new NextResponse('OK', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

/**
 * Handle AUTHORIZED status
 * For one-stage payments, this is followed immediately by CONFIRMED
 */
async function handlePaymentAuthorized(notification: TBankNotification) {
  // TODO: Update order status in database
  // Example with Payload CMS:
  // await payload.update({
  //   collection: 'orders',
  //   where: { orderId: { equals: notification.OrderId } },
  //   data: { 
  //     status: 'authorized',
  //     paymentId: String(notification.PaymentId),
  //   }
  // })
}

/**
 * Handle CONFIRMED status - payment successful
 */
async function handlePaymentConfirmed(notification: TBankNotification) {
  // TODO: Update order status and fulfill order
  // Example:
  // await payload.update({
  //   collection: 'orders',
  //   where: { orderId: { equals: notification.OrderId } },
  //   data: { 
  //     status: 'paid',
  //     paidAt: new Date().toISOString(),
  //     paymentId: String(notification.PaymentId),
  //   }
  // })
  
  // Send confirmation email to customer
  // await sendOrderConfirmationEmail(notification.OrderId)
}

/**
 * Handle REVERSED status - payment cancelled
 */
async function handlePaymentReversed(notification: TBankNotification) {
  // TODO: Update order status
  // await payload.update({
  //   collection: 'orders',
  //   where: { orderId: { equals: notification.OrderId } },
  //   data: { status: 'cancelled' }
  // })
}

/**
 * Handle REFUNDED status - full refund
 */
async function handlePaymentRefunded(notification: TBankNotification) {
  // TODO: Update order status
  // await payload.update({
  //   collection: 'orders',
  //   where: { orderId: { equals: notification.OrderId } },
  //   data: { status: 'refunded' }
  // })
}

/**
 * Handle PARTIAL_REFUNDED status
 */
async function handlePaymentPartialRefunded(notification: TBankNotification) {
  // TODO: Update order with partial refund info
}

/**
 * Handle REJECTED status - payment failed
 */
async function handlePaymentRejected(notification: TBankNotification) {
  // TODO: Update order status
  // await payload.update({
  //   collection: 'orders',
  //   where: { orderId: { equals: notification.OrderId } },
  //   data: { status: 'payment_failed' }
  // })
}
