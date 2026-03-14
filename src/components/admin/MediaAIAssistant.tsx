'use client'

import React, { useState, useCallback } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    border: '1px solid #c4b5fd',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#5b21b6',
  },
  buttonsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  btn: {
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  btnPrimary: {
    background: '#7c3aed',
    color: '#fff',
  },
  btnSecondary: {
    background: '#fff',
    color: '#5b21b6',
    border: '1px solid #c4b5fd',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  resultBox: {
    marginTop: '12px',
    padding: '12px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
    lineHeight: 1.6,
    color: '#1f2937',
  },
  errorBox: {
    marginTop: '12px',
    padding: '10px 14px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#dc2626',
    fontSize: '13px',
  },
  inputRow: {
    marginTop: '10px',
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  applyBtn: {
    marginTop: '8px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: 600,
    background: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: '4px',
  },
}

export const MediaAIAssistant: React.FC = () => {
  const docInfo = useDocumentInfo()
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ type: string; text: string } | null>(null)
  const [error, setError] = useState('')
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)

  const getImageUrl = useCallback((): string | null => {
    // Try to find the image URL from the current document
    const imgEl = document.querySelector('.file-details img, .upload-preview img, .file-field__previewImage') as HTMLImageElement
    if (imgEl?.src) return imgEl.src

    // Try from the thumbnail
    const thumbEl = document.querySelector('.thumbnail img, .upload__image img') as HTMLImageElement
    if (thumbEl?.src) return thumbEl.src

    // Try from meta or open graph
    const urlField = document.querySelector('[data-field-name="url"] input') as HTMLInputElement
    if (urlField?.value) return urlField.value

    return null
  }, [])

  const applyToField = useCallback((fieldName: string, value: string) => {
    // Find the input/textarea by field name
    const field = document.querySelector(
      `[name="${fieldName}"], [id="field-${fieldName}"], textarea[name="${fieldName}"]`
    ) as HTMLInputElement | HTMLTextAreaElement
    if (field) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(field, value)
        field.dispatchEvent(new Event('input', { bubbles: true }))
        field.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }, [])

  const handleAction = useCallback(async (action: string) => {
    setLoading(action)
    setError('')
    setResult(null)

    const imageUrl = getImageUrl()

    if (!imageUrl && action !== 'generate_image') {
      setError('Не удалось найти изображение. Сначала загрузите файл.')
      setLoading(null)
      return
    }

    try {
      const res = await fetch('/api/ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          imageUrl,
          prompt: generatePrompt,
        }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else if (action === 'generate_alt') {
        setResult({ type: 'alt', text: data.alt })
      } else if (action === 'generate_caption') {
        setResult({ type: 'caption', text: data.caption })
      } else if (action === 'describe_image') {
        setResult({ type: 'description', text: data.description })
      } else if (action === 'generate_image') {
        setResult({ type: 'image', text: data.imageUrl || data.rawResponse || 'Нет результата' })
      }
    } catch {
      setError('Ошибка соединения с AI сервером')
    } finally {
      setLoading(null)
    }
  }, [getImageUrl, generatePrompt])

  const isUploaded = Boolean(docInfo?.id)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        🤖 AI Ассистент для изображений
      </div>

      <div style={styles.buttonsRow}>
        <button
          type="button"
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            ...(loading || !isUploaded ? styles.btnDisabled : {}),
          }}
          disabled={!!loading || !isUploaded}
          onClick={() => handleAction('generate_alt')}
        >
          {loading === 'generate_alt' ? '⏳' : '🏷️'} Alt-текст
        </button>

        <button
          type="button"
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            ...(loading || !isUploaded ? styles.btnDisabled : {}),
          }}
          disabled={!!loading || !isUploaded}
          onClick={() => handleAction('generate_caption')}
        >
          {loading === 'generate_caption' ? '⏳' : '💬'} Подпись
        </button>

        <button
          type="button"
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            ...(loading || !isUploaded ? styles.btnDisabled : {}),
          }}
          disabled={!!loading || !isUploaded}
          onClick={() => handleAction('describe_image')}
        >
          {loading === 'describe_image' ? '⏳' : '📝'} Описание
        </button>

        <button
          type="button"
          style={{
            ...styles.btn,
            ...styles.btnSecondary,
            ...(loading ? styles.btnDisabled : {}),
          }}
          disabled={!!loading}
          onClick={() => setShowGenerate(!showGenerate)}
        >
          🎨 Генерация
        </button>
      </div>

      {!isUploaded && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
          💡 Сначала загрузите изображение, затем используйте AI-функции
        </div>
      )}

      {showGenerate && (
        <div style={styles.inputRow}>
          <input
            type="text"
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            placeholder="Опишите изображение для генерации..."
            style={styles.input}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && generatePrompt.trim()) {
                handleAction('generate_image')
              }
            }}
          />
          <button
            type="button"
            style={{
              ...styles.btn,
              ...styles.btnPrimary,
              ...(loading || !generatePrompt.trim() ? styles.btnDisabled : {}),
            }}
            disabled={!!loading || !generatePrompt.trim()}
            onClick={() => handleAction('generate_image')}
          >
            {loading === 'generate_image' ? '⏳ ...' : '🚀'}
          </button>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>❌ {error}</div>
      )}

      {result && (
        <div style={styles.resultBox}>
          <div style={styles.label}>
            {result.type === 'alt' && '🏷️ Alt-текст:'}
            {result.type === 'caption' && '💬 Подпись:'}
            {result.type === 'description' && '📝 Описание:'}
            {result.type === 'image' && '🎨 Сгенерированное изображение:'}
          </div>

          {result.type === 'image' && result.text.startsWith('http') ? (
            <div style={{ marginTop: '8px' }}>
              <img
                src={result.text}
                alt="AI Generated"
                style={{ maxWidth: '100%', borderRadius: '8px' }}
              />
            </div>
          ) : (
            <div style={{ marginTop: '4px' }}>{result.text}</div>
          )}

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            {result.type === 'alt' && (
              <button
                type="button"
                style={styles.applyBtn}
                onClick={() => {
                  applyToField('alt', result.text)
                  setResult(null)
                }}
              >
                ✅ Применить как Alt
              </button>
            )}

            {result.type === 'caption' && (
              <button
                type="button"
                style={styles.applyBtn}
                onClick={() => {
                  applyToField('caption', result.text)
                  setResult(null)
                }}
              >
                ✅ Применить как подпись
              </button>
            )}

            <button
              type="button"
              style={{ ...styles.applyBtn, background: '#6b7280' }}
              onClick={() => {
                navigator.clipboard.writeText(result.text)
              }}
            >
              📋 Копировать
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaAIAssistant
