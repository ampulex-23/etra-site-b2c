/**
 * API Route: Initialize T-Bank Payment
 * POST /api/payments/init
 * 
 * Creates a new payment and returns PaymentURL for redirect
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  initPayment, 
  rublesToKopecks, 
  generateOrderId,
  type TBankInitParams,
  type TBankReceiptItem 
} from '@/lib/tbank-payment'

interface InitPaymentRequest {
  amount: number // Amount in rubles
  description?: string
  customerEmail?: string
  customerPhone?: string
  orderId?: string
  items?: Array<{
    name: string
    price: number // Price in rubles
    quantity: number
    tax?: 'none' | 'vat0' | 'vat10' | 'vat20' | 'vat110' | 'vat120'
  }>
  successUrl?: string
  failUrl?: string
  useDemo?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: InitPaymentRequest = await request.json()
    
    const { 
      amount, 
      description, 
      customerEmail, 
      customerPhone,
      orderId,
      items,
      successUrl,
      failUrl,
      useDemo = process.env.NODE_ENV !== 'production'
    } = body
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }
    
    // Generate order ID if not provided
    const finalOrderId = orderId || generateOrderId('ETRA')
    
    // Build base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://etraproject.ru'
    
    // Prepare receipt items if provided
    let receiptItems: TBankReceiptItem[] | undefined
    if (items && items.length > 0) {
      receiptItems = items.map(item => ({
        Name: item.name.substring(0, 128), // Max 128 chars
        Price: rublesToKopecks(item.price),
        Quantity: item.quantity,
        Amount: rublesToKopecks(item.price * item.quantity),
        Tax: item.tax || 'none',
        PaymentMethod: 'full_prepayment',
        PaymentObject: 'commodity',
      }))
    }
    
    // Build payment params
    const params: TBankInitParams = {
      Amount: rublesToKopecks(amount),
      OrderId: finalOrderId,
      Description: description || 'Оплата заказа ЭТРА',
      Language: 'ru',
      PayType: 'O', // One-stage payment
      NotificationURL: `${baseUrl}/api/payments/notification`,
      SuccessURL: successUrl || `${baseUrl}/payment/success?orderId=${finalOrderId}`,
      FailURL: failUrl || `${baseUrl}/payment/fail?orderId=${finalOrderId}`,
    }
    
    // Add receipt for fiscalization (54-FZ compliance)
    if (receiptItems && (customerEmail || customerPhone)) {
      params.Receipt = {
        Email: customerEmail,
        Phone: customerPhone,
        Taxation: 'usn_income', // УСН доходы - adjust based on your taxation
        Items: receiptItems,
      }
    }
    
    // Initialize payment
    const result = await initPayment(params, useDemo)
    
    return NextResponse.json({
      success: true,
      paymentId: result.PaymentId,
      orderId: result.OrderId,
      paymentUrl: result.PaymentURL,
      amount: result.Amount,
    })
    
  } catch (error) {
    console.error('Payment init error:', error)
    return NextResponse.json(
      { 
        error: 'Payment initialization failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
