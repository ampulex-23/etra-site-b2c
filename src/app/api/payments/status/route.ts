/**
 * API Route: Get Payment Status
 * GET /api/payments/status?paymentId=xxx
 * 
 * Returns current payment status from T-Bank
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPaymentState } from '@/lib/tbank-payment'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')
    const useDemo = searchParams.get('demo') === 'true' || process.env.NODE_ENV !== 'production'
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      )
    }
    
    const result = await getPaymentState(paymentId, useDemo)
    
    return NextResponse.json({
      success: result.Success,
      status: result.Status,
      orderId: result.OrderId,
      paymentId: result.PaymentId,
      amount: result.Amount,
      errorCode: result.ErrorCode,
      message: result.Message,
    })
    
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get payment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
