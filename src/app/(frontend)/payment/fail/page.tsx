'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react'

function PaymentFailContent() {
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
          <Link href="/account" className="btn btn--primary">
            <RefreshCw size={18} />
            Мои заказы
          </Link>
          
          <Link href="/" className="btn btn--secondary">
            <MessageCircle size={18} />
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="payment-result">
        <div className="payment-result__card">
          <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
        </div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  )
}
