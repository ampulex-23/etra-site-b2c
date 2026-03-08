'use client'

import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { $getRoot, $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection } from '@payloadcms/richtext-lexical/lexical'
import React, { useState, useCallback, useRef, useEffect } from 'react'

const modes = [
  { key: 'generate', label: '✨ Сгенерировать', desc: 'Написать текст по промту', needsPrompt: true },
  { key: 'rewrite', label: '🔄 Переписать', desc: 'Переписать по инструкции', needsPrompt: true },
  { key: 'improve', label: '✏️ Улучшить', desc: 'Исправить и улучшить стиль', needsPrompt: false },
  { key: 'shorten', label: '📏 Сократить', desc: 'Сделать текст короче', needsPrompt: false },
  { key: 'expand', label: '📖 Расширить', desc: 'Дополнить и расширить', needsPrompt: false },
]

export const AIAssistantPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState('generate')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  const currentMode = modes.find((m) => m.key === mode)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const btn = document.querySelector('[data-ai-toggle]')
        if (btn && btn.contains(e.target as Node)) return
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getEditorText = useCallback((): string => {
    let text = ''
    editor.getEditorState().read(() => {
      text = $getRoot().getTextContent()
    })
    return text
  }, [editor])

  const getSelectedText = useCallback((): string => {
    let text = ''
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        text = selection.getTextContent()
      }
    })
    return text
  }, [editor])

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError('')
    setResult('')

    const selectedText = getSelectedText()
    const editorText = getEditorText()
    const content = selectedText || editorText

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, content, mode }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data.text)
      }
    } catch (err) {
      setError('Ошибка соединения с AI')
    } finally {
      setLoading(false)
    }
  }, [prompt, mode, getEditorText, getSelectedText])

  const insertResult = useCallback(() => {
    if (!result) return
    editor.update(() => {
      const lines = result.split('\n')
      const root = $getRoot()

      if (mode === 'generate') {
        for (const line of lines) {
          const p = $createParagraphNode()
          p.append($createTextNode(line))
          root.append(p)
        }
      } else {
        root.clear()
        for (const line of lines) {
          const p = $createParagraphNode()
          p.append($createTextNode(line))
          root.append(p)
        }
      }
    })
    setResult('')
    setIsOpen(false)
  }, [editor, result, mode])

  const appendResult = useCallback(() => {
    if (!result) return
    editor.update(() => {
      const lines = result.split('\n')
      const root = $getRoot()
      for (const line of lines) {
        const p = $createParagraphNode()
        p.append($createTextNode(line))
        root.append(p)
      }
    })
    setResult('')
    setIsOpen(false)
  }, [editor, result])

  return (
    <>
      <button
        type="button"
        data-ai-toggle="true"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          marginTop: '8px',
          padding: '6px 14px',
          background: isOpen ? '#7c3aed' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
          transition: 'all 0.2s',
          zIndex: 10,
        }}
      >
        🤖 AI Ассистент
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          style={{
            marginTop: '8px',
            padding: '16px',
            background: '#fafafa',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            zIndex: 100,
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                marginBottom: '10px',
              }}
            >
              {modes.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setMode(m.key)
                    setResult('')
                    setError('')
                  }}
                  title={m.desc}
                  style={{
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: mode === m.key ? 700 : 500,
                    background: mode === m.key ? '#7c3aed' : '#fff',
                    color: mode === m.key ? '#fff' : '#374151',
                    border: mode === m.key ? '1px solid #7c3aed' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {(currentMode?.needsPrompt || mode === 'generate') && (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'generate'
                    ? 'Опишите, что нужно написать...'
                    : 'Как нужно переписать? (стиль, тон, подход...)'
                }
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
              />
            )}

            {!currentMode?.needsPrompt && mode !== 'generate' && (
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                💡 {currentMode?.desc}. Выделите текст или используется весь контент.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: result || error ? '12px' : 0 }}>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || (currentMode?.needsPrompt && !prompt.trim())}
              style={{
                padding: '8px 16px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {loading ? '⏳ Генерирую...' : '🚀 Выполнить'}
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '13px',
              }}
            >
              ❌ {error}
            </div>
          )}

          {result && (
            <div>
              <div
                style={{
                  padding: '12px',
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  marginBottom: '10px',
                }}
              >
                {result}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {mode !== 'generate' && (
                  <button
                    type="button"
                    onClick={insertResult}
                    style={{
                      padding: '6px 14px',
                      background: '#059669',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    ✅ Заменить текст
                  </button>
                )}
                <button
                  type="button"
                  onClick={appendResult}
                  style={{
                    padding: '6px 14px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  ➕ Добавить в конец
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result)
                  }}
                  style={{
                    padding: '6px 14px',
                    background: '#6b7280',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  📋 Копировать
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
