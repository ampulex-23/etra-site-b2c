'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  
  useEffect(() => {
    // Optionally verify payment status
    if (orderId) {
      // You could fetch order details here
      setPaymentStatus('confirmed')
    }
  }, [orderId])

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
          <Link href="/catalog" className="btn btn--primary">
            Продолжить покупки
            <ArrowRight size={18} />
          </Link>
          
          <Link href="/" className="btn btn--secondary">
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
