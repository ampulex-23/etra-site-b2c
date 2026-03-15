'use client'

import React, { useState, useCallback } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const s: Record<string, React.CSSProperties> = {
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
  section: {
    marginBottom: '10px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#7c3aed',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  row: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  btn: {
    padding: '7px 12px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  btnPrimary: { background: '#7c3aed', color: '#fff' },
  btnEdit: { background: '#2563eb', color: '#fff' },
  btnDanger: { background: '#dc2626', color: '#fff' },
  btnSuccess: { background: '#059669', color: '#fff' },
  btnSecondary: { background: '#fff', color: '#5b21b6', border: '1px solid #c4b5fd' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
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
    marginTop: '8px',
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
  progressBar: {
    marginTop: '10px',
    height: '3px',
    background: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #2563eb, #7c3aed)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '2px',
  },
}

type ResultType = { type: string; text: string; imageUrl?: string } | null

export const MediaAIAssistant: React.FC = () => {
  const docInfo = useDocumentInfo()
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<ResultType>(null)
  const [error, setError] = useState('')
  const [editPrompt, setEditPrompt] = useState('')
  const [activePanel, setActivePanel] = useState<string | null>(null)

  const getImageUrl = useCallback((): string | null => {
    const imgEl = document.querySelector(
      '.file-details img, .upload-preview img, .file-field__previewImage, .upload__image img, .thumbnail img',
    ) as HTMLImageElement
    if (imgEl?.src) return imgEl.src
    const urlField = document.querySelector('[data-field-name="url"] input') as HTMLInputElement
    if (urlField?.value) return urlField.value
    return null
  }, [])

  const applyToField = useCallback((fieldName: string, value: string) => {
    const field = document.querySelector(
      `[name="${fieldName}"], [id="field-${fieldName}"], textarea[name="${fieldName}"]`,
    ) as HTMLInputElement | HTMLTextAreaElement
    if (field) {
      const setter =
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
      if (setter) {
        setter.call(field, value)
        field.dispatchEvent(new Event('input', { bubbles: true }))
        field.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }, [])

  const handleAction = useCallback(
    async (action: string, customPrompt?: string) => {
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
          body: JSON.stringify({ action, imageUrl, prompt: customPrompt || editPrompt }),
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
        } else if (action === 'generate_image' || action === 'edit_image' || action === 'remove_bg' || action === 'enhance') {
          setResult({
            type: 'image',
            text: data.text || '',
            imageUrl: data.imageUrl || '',
          })
        }
      } catch {
        setError('Ошибка соединения с AI сервером')
      } finally {
        setLoading(null)
      }
    },
    [getImageUrl, editPrompt],
  )

  const isUploaded = Boolean(docInfo?.id)
  const isLoading = !!loading

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel)
    setEditPrompt('')
  }

  return (
    <div style={s.container}>
      {/* Shimmer animation */}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div style={s.header}>🤖 AI Ассистент для изображений</div>

      {/* Text analysis section */}
      <div style={s.section}>
        <div style={s.sectionLabel}>Анализ</div>
        <div style={s.row}>
          <button
            type="button"
            style={{ ...s.btn, ...s.btnPrimary, ...(isLoading || !isUploaded ? s.btnDisabled : {}) }}
            disabled={isLoading || !isUploaded}
            onClick={() => handleAction('generate_alt')}
          >
            {loading === 'generate_alt' ? '⏳' : '🏷️'} Alt-текст
          </button>
          <button
            type="button"
            style={{ ...s.btn, ...s.btnPrimary, ...(isLoading || !isUploaded ? s.btnDisabled : {}) }}
            disabled={isLoading || !isUploaded}
            onClick={() => handleAction('generate_caption')}
          >
            {loading === 'generate_caption' ? '⏳' : '💬'} Подпись
          </button>
          <button
            type="button"
            style={{ ...s.btn, ...s.btnPrimary, ...(isLoading || !isUploaded ? s.btnDisabled : {}) }}
            disabled={isLoading || !isUploaded}
            onClick={() => handleAction('describe_image')}
          >
            {loading === 'describe_image' ? '⏳' : '📝'} Описание
          </button>
        </div>
      </div>

      {/* Image editing section */}
      <div style={s.section}>
        <div style={s.sectionLabel}>Редактирование</div>
        <div style={s.row}>
          <button
            type="button"
            style={{ ...s.btn, ...s.btnEdit, ...(isLoading || !isUploaded ? s.btnDisabled : {}) }}
            disabled={isLoading || !isUploaded}
            onClick={() => togglePanel('edit')}
          >
            ✏️ Редактировать
          </button>
          <button
            type="button"
            style={{ ...s.btn, ...s.btnEdit, ...(isLoading || !isUploaded ? s.btnDisabled : {}) }}
            disabled={isLoading || !isUploaded}
            onClick={() => handleAction('remove_bg')}
          >
            {loading === 'remove_bg' ? '⏳' : '🔲'} Убрать фон
          </button>
          <button
            type="button"
            style={{ ...s.btn, ...s.btnEdit, ...(isLoading || !isUploaded ? s.btnDisabled : {}) }}
            disabled={isLoading || !isUploaded}
            onClick={() => handleAction('enhance')}
          >
            {loading === 'enhance' ? '⏳' : '✨'} Улучшить
          </button>
          <button
            type="button"
            style={{ ...s.btn, ...s.btnSecondary, ...(isLoading ? s.btnDisabled : {}) }}
            disabled={isLoading}
            onClick={() => togglePanel('generate')}
          >
            🎨 Генерация
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {activePanel === 'edit' && (
        <div style={s.inputRow}>
          <input
            type="text"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="Что изменить? Напр: убери фон и добавь тень, сделай ярче..."
            style={s.input}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editPrompt.trim()) handleAction('edit_image')
            }}
          />
          <button
            type="button"
            style={{ ...s.btn, ...s.btnEdit, ...(isLoading || !editPrompt.trim() ? s.btnDisabled : {}) }}
            disabled={isLoading || !editPrompt.trim()}
            onClick={() => handleAction('edit_image')}
          >
            {loading === 'edit_image' ? '⏳ ...' : '✏️'}
          </button>
        </div>
      )}

      {/* Generate panel */}
      {activePanel === 'generate' && (
        <div style={s.inputRow}>
          <input
            type="text"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="Опишите изображение для генерации с нуля..."
            style={s.input}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editPrompt.trim()) handleAction('generate_image')
            }}
          />
          <button
            type="button"
            style={{ ...s.btn, ...s.btnPrimary, ...(isLoading || !editPrompt.trim() ? s.btnDisabled : {}) }}
            disabled={isLoading || !editPrompt.trim()}
            onClick={() => handleAction('generate_image')}
          >
            {loading === 'generate_image' ? '⏳ ...' : '🚀'}
          </button>
        </div>
      )}

      {!isUploaded && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
          💡 Загрузите изображение, чтобы использовать анализ и редактирование
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: '100%' }} />
        </div>
      )}

      {/* Error */}
      {error && <div style={s.errorBox}>❌ {error}</div>}

      {/* Result */}
      {result && (
        <div style={s.resultBox}>
          <div style={s.label}>
            {result.type === 'alt' && '🏷️ Alt-текст:'}
            {result.type === 'caption' && '💬 Подпись:'}
            {result.type === 'description' && '📝 Описание:'}
            {result.type === 'image' && '🎨 Результат:'}
          </div>

          {result.type === 'image' && result.imageUrl ? (
            <div style={{ marginTop: '8px' }}>
              <img
                src={result.imageUrl}
                alt="AI Result"
                style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              {result.text && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>{result.text}</div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '4px' }}>{result.text}</div>
          )}

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            {result.type === 'alt' && (
              <button
                type="button"
                style={s.applyBtn}
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
                style={s.applyBtn}
                onClick={() => {
                  applyToField('caption', result.text)
                  setResult(null)
                }}
              >
                ✅ Применить как подпись
              </button>
            )}

            {result.type === 'image' && result.imageUrl && (
              <a
                href={result.imageUrl}
                download="ai-result.png"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...s.applyBtn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                ⬇️ Скачать
              </a>
            )}

            <button
              type="button"
              style={{ ...s.applyBtn, background: '#6b7280' }}
              onClick={() => navigator.clipboard.writeText(result.imageUrl || result.text)}
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
