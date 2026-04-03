'use client'

import React, { useState } from 'react'

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100, // 100 рублей
          description: 'Тестовый платеж ЭТРА',
          customerEmail: 'test@etraproject.ru',
          items: [
            { name: 'Тестовый товар', price: 100, quantity: 1, tax: 'none' }
          ],
          useDemo: true // Используем demo терминал
        })
      })

      const data = await response.json()

      if (data.error) {
        setError(data.message || data.error)
        return
      }

      // Редирект на платежную форму T-Bank
      window.location.href = data.paymentUrl

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка инициализации платежа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="payment-test">
      <div className="payment-test__card">
        <h1>Тест платежного шлюза T-Bank</h1>
        
        <div className="payment-test__info">
          <h3>Тестовый платеж</h3>
          <p>Сумма: <strong>100 ₽</strong></p>
          <p>Терминал: <strong>DEMO</strong></p>
        </div>

        {error && (
          <div className="payment-test__error">
            ❌ {error}
          </div>
        )}

        <button 
          onClick={handlePayment}
          disabled={loading}
          className="payment-test__btn"
        >
          {loading ? 'Инициализация...' : 'Оплатить 100 ₽'}
        </button>

        <div className="payment-test__cards">
          <h4>Тестовые карты:</h4>
          <ul>
            <li>
              <strong>Успех:</strong> 4300 0000 0000 0777
            </li>
            <li>
              <strong>Отказ:</strong> 4300 0000 0000 0000
            </li>
            <li>
              <strong>3D-Secure:</strong> 5100 0000 0000 0008 (код: 12345678)
            </li>
          </ul>
          <p className="payment-test__note">
            CVV: любые 3 цифры<br/>
            Срок: любая дата в будущем
          </p>
        </div>
      </div>

      <style jsx>{`
        .payment-test {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .payment-test__card {
          max-width: 500px;
          width: 100%;
          padding: 40px 32px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 24px;
          backdrop-filter: blur(16px);
        }

        h1 {
          font-family: var(--font-h);
          font-size: 24px;
          font-weight: 800;
          color: var(--c-text);
          margin: 0 0 24px 0;
          text-align: center;
        }

        .payment-test__info {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .payment-test__info h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: var(--c-primary);
        }

        .payment-test__info p {
          margin: 8px 0;
          color: var(--c-text-muted);
        }

        .payment-test__error {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          color: #FF6B6B;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .payment-test__btn {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #6ECAFF 0%, #3BECA0 100%);
          color: #0A281C;
          font-family: var(--font-h);
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 24px;
        }

        .payment-test__btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 236, 160, 0.3);
        }

        .payment-test__btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .payment-test__cards {
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 12px;
        }

        .payment-test__cards h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--c-text);
        }

        .payment-test__cards ul {
          list-style: none;
          padding: 0;
          margin: 0 0 12px 0;
        }

        .payment-test__cards li {
          padding: 8px 0;
          font-size: 13px;
          color: var(--c-text-muted);
          font-family: monospace;
        }

        .payment-test__note {
          font-size: 12px;
          color: var(--c-text-muted);
          margin: 12px 0 0 0;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  )
}
