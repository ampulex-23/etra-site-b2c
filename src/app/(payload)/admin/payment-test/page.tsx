'use client'

import React, { useState, useEffect } from 'react'

interface TestResult {
  success: boolean
  message: string
  data?: any
}

interface ShopSettings {
  paymentEnabled: boolean
  paymentProvider: string
  tbankDemoMode: boolean
  tbankDemoTerminalKey: string
  tbankDemoPassword: string
}

export default function PaymentTestPage() {
  const [amount, setAmount] = useState(100)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    // Fetch current settings
    fetch('/api/globals/shop-settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data)
        setSettingsLoading(false)
      })
      .catch(() => setSettingsLoading(false))
  }, [])

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
          message: 'Платеж успешно инициализирован! Открывается форма оплаты...',
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
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>🧪 Тестовый стенд платежей T-Bank</h1>
        
        {/* Settings Status */}
        <div style={styles.statusCard}>
          <h3 style={styles.statusTitle}>Статус настроек</h3>
          {settingsLoading ? (
            <p>Загрузка...</p>
          ) : settings ? (
            <div style={styles.statusGrid}>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Оплата:</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: settings.paymentEnabled ? '#d4edda' : '#f8d7da',
                  color: settings.paymentEnabled ? '#155724' : '#721c24'
                }}>
                  {settings.paymentEnabled ? '✅ Включена' : '❌ Выключена'}
                </span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Провайдер:</span>
                <span style={styles.statusValue}>{settings.paymentProvider || 'Не выбран'}</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Демо-режим:</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: settings.tbankDemoMode ? '#fff3cd' : '#d4edda',
                  color: settings.tbankDemoMode ? '#856404' : '#155724'
                }}>
                  {settings.tbankDemoMode ? '🧪 Демо' : '🚀 Боевой'}
                </span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Demo Terminal:</span>
                <span style={styles.statusMono}>{settings.tbankDemoTerminalKey || '—'}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#dc3545' }}>Не удалось загрузить настройки</p>
          )}
        </div>

        {/* Test Form */}
        <div style={styles.testCard}>
          <h3 style={styles.cardTitle}>Провести тестовый платеж</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Сумма (₽)</label>
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
            disabled={loading || !settings?.paymentEnabled}
            style={{
              ...styles.button,
              opacity: loading || !settings?.paymentEnabled ? 0.6 : 1,
              cursor: loading || !settings?.paymentEnabled ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Инициализация...' : '💳 Оплатить тестовый платеж'}
          </button>

          {!settings?.paymentEnabled && (
            <p style={styles.warning}>
              ⚠️ Включите оплату в <a href="/admin/globals/shop-settings" style={styles.link}>настройках магазина</a>
            </p>
          )}

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
                  <summary style={{ cursor: 'pointer' }}>Детали ответа API</summary>
                  <pre style={styles.pre}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Test Cards */}
        <div style={styles.cardsCard}>
          <h3 style={styles.cardTitle}>Тестовые карты T-Bank</h3>
          <p style={styles.cardDesc}>Используйте эти карты для тестирования в демо-режиме:</p>
          
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Результат</th>
                <th style={styles.th}>Номер карты</th>
                <th style={styles.th}>Примечание</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>✅ Успешная оплата</td>
                <td style={styles.tdMono}>4300 0000 0000 0777</td>
                <td style={styles.td}>Любой CVV, любая дата</td>
              </tr>
              <tr>
                <td style={styles.td}>❌ Отказ</td>
                <td style={styles.tdMono}>4300 0000 0000 0000</td>
                <td style={styles.td}>Любой CVV, любая дата</td>
              </tr>
              <tr>
                <td style={styles.td}>🔐 3D-Secure</td>
                <td style={styles.tdMono}>5100 0000 0000 0008</td>
                <td style={styles.td}>Код: 12345678</td>
              </tr>
            </tbody>
          </table>
          
          <div style={styles.note}>
            <strong>Общие правила:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>CVV: любые 3 цифры (например, 123)</li>
              <li>Срок действия: любая дата в будущем (например, 12/25)</li>
              <li>Имя: любое</li>
            </ul>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a href="/admin/globals/shop-settings" style={styles.backLink}>
            ← Вернуться к настройкам магазина
          </a>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f4f4f4',
    padding: '40px 20px',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#333',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statusTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#333',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusLabel: {
    fontSize: '14px',
    color: '#666',
  },
  statusValue: {
    fontSize: '14px',
    fontWeight: 500,
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
  },
  statusMono: {
    fontFamily: 'monospace',
    fontSize: '13px',
    backgroundColor: '#f0f0f0',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  testCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#333',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  input: {
    width: '200px',
    padding: '10px 12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
  },
  button: {
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  warning: {
    fontSize: '14px',
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  link: {
    color: '#007bff',
    textDecoration: 'underline',
  },
  result: {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid',
  },
  pre: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    marginTop: '8px',
  },
  cardsCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '16px',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #dee2e6',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
  },
  tdMono: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
    fontFamily: 'monospace',
    letterSpacing: '1px',
    fontWeight: 500,
  },
  note: {
    fontSize: '14px',
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '6px',
  },
  backLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px',
  },
}
