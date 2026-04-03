'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react'

export default function PaymentFailPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="payment-result">
      <div className="payment-result__card payment-result__card--fail">
        <div className="payment-result__icon payment-result__icon--fail">
          <XCircle size={64} />
        </div>
        
        <h1 className="payment-result__title">Оплата не прошла</h1>
        
        <p className="payment-result__text">
          К сожалению, платёж не был завершён. Это могло произойти по нескольким причинам:
        </p>
        
        <ul className="payment-result__reasons">
          <li>Недостаточно средств на карте</li>
          <li>Банк отклонил операцию</li>
          <li>Истекло время ожидания</li>
          <li>Технический сбой</li>
        </ul>
        
        {orderId && (
          <div className="payment-result__order">
            <span className="payment-result__order-label">Номер заказа:</span>
            <span className="payment-result__order-id">{orderId}</span>
          </div>
        )}
        
        <div className="payment-result__actions">
          <Link href="/cart" className="btn btn--primary">
            <RefreshCw size={18} />
            Попробовать снова
          </Link>
          
          <Link href="/contacts" className="btn btn--secondary">
            <MessageCircle size={18} />
            Связаться с нами
          </Link>
        </div>
      </div>
    </div>
  )
}
