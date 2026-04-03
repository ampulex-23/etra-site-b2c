'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, ArrowRight, User } from 'lucide-react'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="payment-result">
      <div className="payment-result__card payment-result__card--success">
        <div className="payment-result__icon">
          <CheckCircle size={64} />
        </div>
        
        <h1 className="payment-result__title">Оплата прошла успешно!</h1>
        
        <p className="payment-result__text">
          Спасибо за ваш заказ. Мы уже начали его обработку.
        </p>
        
        {orderId && (
          <div className="payment-result__order">
            <span className="payment-result__order-label">Номер заказа:</span>
            <span className="payment-result__order-id">{orderId}</span>
          </div>
        )}
        
        <div className="payment-result__info">
          <Package size={20} />
          <span>Информация о заказе отправлена на вашу почту</span>
        </div>
        
        <div className="payment-result__actions">
          <Link href="/account" className="btn btn--primary">
            <User size={18} />
            Мои заказы
          </Link>
          
          <Link href="/catalog" className="btn btn--secondary">
            Продолжить покупки
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="payment-result">
        <div className="payment-result__card">
          <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
