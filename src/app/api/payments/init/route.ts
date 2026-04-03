/**
 * API Route: Initialize T-Bank Payment
 * POST /api/payments/init
 * 
 * Creates a new payment and returns PaymentURL for redirect
 * Uses settings from Payload CMS ShopSettings global
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { 
  initPaymentWithCredentials, 
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
      useDemo
    } = body
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }
    
    // Get payment settings from Payload CMS
    const payload = await getPayload({ config })
    const shopSettings = await payload.findGlobal({
      slug: 'shop-settings',
    }) as any // Type will be regenerated after schema change
    
    // Check if payments are enabled
    if (!shopSettings.paymentEnabled) {
      return NextResponse.json(
        { error: 'Online payments are disabled' },
        { status: 400 }
      )
    }
    
    // Check provider (support both old 'tinkoff' and new 'tbank' values)
    if (shopSettings.paymentProvider !== 'tbank' && shopSettings.paymentProvider !== 'tinkoff') {
      return NextResponse.json(
        { error: 'T-Bank provider not configured' },
        { status: 400 }
      )
    }
    
    // Determine if using demo mode
    const isDemoMode = useDemo !== undefined ? useDemo : (shopSettings.tbankDemoMode ?? true)
    
    // Get credentials based on mode
    const terminalKey = isDemoMode 
      ? (shopSettings.tbankDemoTerminalKey || process.env.TBANK_DEMO_TERMINAL_KEY)
      : (shopSettings.tbankTerminalKey || process.env.TBANK_TERMINAL_KEY)
    
    const password = isDemoMode
      ? (shopSettings.tbankDemoPassword || process.env.TBANK_DEMO_PASSWORD)
      : (shopSettings.tbankPassword || process.env.TBANK_PASSWORD)
    
    if (!terminalKey || !password) {
      return NextResponse.json(
        { error: 'T-Bank credentials not configured' },
        { status: 500 }
      )
    }
    
    // Generate order ID if not provided
    const finalOrderId = orderId || generateOrderId('ETRA')
    
    // Build base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://etraproject.ru'
    const tbankSuccessUrl = shopSettings.tbankSuccessUrl || '/payment/success'
    const tbankFailUrl = shopSettings.tbankFailUrl || '/payment/fail'
    
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
      SuccessURL: successUrl || `${baseUrl}${tbankSuccessUrl}?orderId=${finalOrderId}`,
      FailURL: failUrl || `${baseUrl}${tbankFailUrl}?orderId=${finalOrderId}`,
    }
    
    // Add receipt for fiscalization (54-FZ compliance)
    const taxation = shopSettings.tbankTaxation || 'usn_income'
    if (receiptItems && (customerEmail || customerPhone)) {
      params.Receipt = {
        Email: customerEmail,
        Phone: customerPhone,
        Taxation: taxation as 'osn' | 'usn_income' | 'usn_income_outcome' | 'envd' | 'esn' | 'patent',
        Items: receiptItems,
      }
    }
    
    // Initialize payment with credentials from admin
    const result = await initPaymentWithCredentials(params, terminalKey, password)
    
    return NextResponse.json({
      success: true,
      paymentId: result.PaymentId,
      orderId: result.OrderId,
      paymentUrl: result.PaymentURL,
      amount: result.Amount,
      demoMode: isDemoMode,
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
