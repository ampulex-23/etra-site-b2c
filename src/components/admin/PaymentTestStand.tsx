'use client'

import React, { useState } from 'react'

interface TestResult {
  success: boolean
  message: string
  data?: any
}

export const PaymentTestStand: React.FC = () => {
  const [amount, setAmount] = useState(100)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const runTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: `Тестовый платеж из админки - ${new Date().toLocaleString('ru-RU')}`,
          customerEmail: 'admin-test@etraproject.ru',
          items: [
            { name: 'Тестовый товар', price: amount, quantity: 1, tax: 'none' }
          ],
          useDemo: true
        })
      })

      const data = await response.json()

      if (data.error) {
        setResult({
          success: false,
          message: data.message || data.error,
          data
        })
      } else {
        setResult({
          success: true,
          message: 'Платеж успешно инициализирован!',
          data
        })
        
        // Open payment URL in new tab
        if (data.paymentUrl) {
          window.open(data.paymentUrl, '_blank')
        }
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Ошибка инициализации',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🧪 Тестовый стенд платежей</h3>
      
      <div style={styles.section}>
        <label style={styles.label}>Сумма тестового платежа (₽)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={1}
          max={10000}
          style={styles.input}
        />
      </div>

      <button
        onClick={runTest}
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '⏳ Инициализация...' : '💳 Провести тестовый платеж'}
      </button>

      {result && (
        <div style={{
          ...styles.result,
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          borderColor: result.success ? '#c3e6cb' : '#f5c6cb',
          color: result.success ? '#155724' : '#721c24'
        }}>
          <strong>{result.success ? '✅ Успех' : '❌ Ошибка'}</strong>
          <p style={{ margin: '8px 0 0 0' }}>{result.message}</p>
          
          {result.data && (
            <details style={{ marginTop: '12px' }}>
              <summary style={{ cursor: 'pointer' }}>Детали ответа</summary>
              <pre style={styles.pre}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <div style={styles.cards}>
        <h4 style={{ margin: '0 0 12px 0' }}>Тестовые карты T-Bank:</h4>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.td}>✅ Успех</td>
              <td style={styles.tdMono}>4300 0000 0000 0777</td>
            </tr>
            <tr>
              <td style={styles.td}>❌ Отказ</td>
              <td style={styles.tdMono}>4300 0000 0000 0000</td>
            </tr>
            <tr>
              <td style={styles.td}>🔐 3D-Secure</td>
              <td style={styles.tdMono}>5100 0000 0000 0008</td>
            </tr>
          </tbody>
        </table>
        <p style={styles.note}>
          CVV: любые 3 цифры • Срок: любая дата в будущем • 3DS код: 12345678
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginTop: '16px',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 600,
  },
  section: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 500,
  },
  input: {
    width: '200px',
    padding: '10px 12px',
    fontSize: '16px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
  },
  button: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '6px',
    marginBottom: '20px',
  },
  result: {
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid',
    marginBottom: '20px',
  },
  pre: {
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    marginTop: '8px',
  },
  cards: {
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #e9ecef',
    fontSize: '14px',
  },
  tdMono: {
    padding: '8px 12px',
    borderBottom: '1px solid #e9ecef',
    fontSize: '14px',
    fontFamily: 'monospace',
    letterSpacing: '1px',
  },
  note: {
    margin: '12px 0 0 0',
    fontSize: '12px',
    color: '#6c757d',
  },
}

export default PaymentTestStand
