'use client'

import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $createLineBreakNode,
} from '@payloadcms/richtext-lexical/lexical'
import { $createHeadingNode } from '@payloadcms/richtext-lexical/lexical/rich-text'
import { $createListNode, $createListItemNode } from '@payloadcms/richtext-lexical/lexical/list'
import { $createHorizontalRuleNode } from '@payloadcms/richtext-lexical/client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const modes = [
  { key: 'generate', label: 'Сгенерировать', icon: '✨', desc: 'Написать текст по промту', needsPrompt: true },
  { key: 'rewrite', label: 'Переписать', icon: '🔄', desc: 'Переписать по инструкции', needsPrompt: true },
  { key: 'improve', label: 'Улучшить', icon: '✏️', desc: 'Исправить и улучшить стиль', needsPrompt: false },
  { key: 'shorten', label: 'Сократить', icon: '📏', desc: 'Сделать текст короче', needsPrompt: false },
  { key: 'expand', label: 'Расширить', icon: '📖', desc: 'Дополнить и расширить', needsPrompt: false },
]

function parseMarkdownToLexical(root: ReturnType<typeof $getRoot>, markdown: string, replace: boolean) {
  if (replace) {
    root.clear()
  }
  const lines = markdown.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i++
      continue
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim()) || /^___+$/.test(line.trim())) {
      root.append($createHorizontalRuleNode())
      i++
      continue
    }

    const h1Match = line.match(/^#\s+(.+)/)
    const h2Match = line.match(/^##\s+(.+)/)
    const h3Match = line.match(/^###\s+(.+)/)
    const h4Match = line.match(/^####\s+(.+)/)
    const ulMatch = line.match(/^[-*]\s+(.+)/)
    const olMatch = line.match(/^\d+\.\s+(.+)/)

    if (h4Match) {
      const heading = $createHeadingNode('h4')
      appendFormattedText(heading, h4Match[1])
      root.append(heading)
    } else if (h3Match) {
      const heading = $createHeadingNode('h3')
      appendFormattedText(heading, h3Match[1])
      root.append(heading)
    } else if (h2Match) {
      const heading = $createHeadingNode('h2')
      appendFormattedText(heading, h2Match[1])
      root.append(heading)
    } else if (h1Match) {
      const heading = $createHeadingNode('h1')
      appendFormattedText(heading, h1Match[1])
      root.append(heading)
    } else if (ulMatch) {
      const list = $createListNode('bullet')
      while (i < lines.length) {
        const liMatch = lines[i].match(/^[-*]\s+(.+)/)
        if (!liMatch) break
        const item = $createListItemNode()
        appendFormattedText(item, liMatch[1])
        list.append(item)
        i++
      }
      root.append(list)
      continue
    } else if (olMatch) {
      const list = $createListNode('number')
      while (i < lines.length) {
        const liMatch = lines[i].match(/^\d+\.\s+(.+)/)
        if (!liMatch) break
        const item = $createListItemNode()
        appendFormattedText(item, liMatch[1])
        list.append(item)
        i++
      }
      root.append(list)
      continue
    } else {
      const p = $createParagraphNode()
      appendFormattedText(p, line)
      root.append(p)
    }
    i++
  }
}

function appendFormattedText(
  node: ReturnType<typeof $createParagraphNode> | ReturnType<typeof $createHeadingNode> | ReturnType<typeof $createListItemNode>,
  text: string,
) {
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      node.append($createTextNode(text.slice(lastIndex, match.index)))
    }

    if (match[2]) {
      const tn = $createTextNode(match[2])
      tn.toggleFormat('bold')
      tn.toggleFormat('italic')
      node.append(tn)
    } else if (match[3]) {
      const tn = $createTextNode(match[3])
      tn.toggleFormat('bold')
      node.append(tn)
    } else if (match[4]) {
      const tn = $createTextNode(match[4])
      tn.toggleFormat('italic')
      node.append(tn)
    } else if (match[5]) {
      const tn = $createTextNode(match[5])
      tn.toggleFormat('bold')
      node.append(tn)
    } else if (match[6]) {
      const tn = $createTextNode(match[6])
      tn.toggleFormat('italic')
      node.append(tn)
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    node.append($createTextNode(text.slice(lastIndex)))
  }

  if (lastIndex === 0 && !text) {
    node.append($createTextNode(''))
  }
}

const PANEL_STYLES: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.15)',
    zIndex: 10000,
    transition: 'opacity 0.25s',
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '420px',
    maxWidth: '90vw',
    height: '100vh',
    background: '#fff',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    zIndex: 10001,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
  },
  header: {
    padding: '20px 24px 16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modesWrap: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  textarea: {
    width: '100%',
    minHeight: '80px',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    resize: 'vertical',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  resultWrap: {
    padding: '14px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    maxHeight: '40vh',
    overflowY: 'auto',
    fontSize: '13px',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },
  actionsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
}

function ModeButton({ m, active, onClick }: { m: typeof modes[0]; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={m.desc}
      style={{
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: active ? 700 : 500,
        background: active ? '#7c3aed' : '#fff',
        color: active ? '#fff' : '#374151',
        border: active ? '1px solid #7c3aed' : '1px solid #d1d5db',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {m.icon} {m.label}
    </button>
  )
}

function ActionButton({ label, bg, onClick, disabled }: { label: string; bg: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 16px',
        background: disabled ? '#9ca3af' : bg,
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '12px',
        fontWeight: 600,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

export const AIAssistantPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState('generate')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const editorWrapRef = useRef<HTMLElement | null>(null)

  const currentMode = modes.find((m) => m.key === mode)

  useEffect(() => {
    const el = editor.getRootElement()
    if (el) {
      const fieldWrap = el.closest('.rich-text-lexical') || el.closest('.field-type.rich-text')
      editorWrapRef.current = fieldWrap as HTMLElement
    }
  }, [editor])

  useEffect(() => {
    const wrap = editorWrapRef.current
    if (!wrap) return
    if (isOpen) {
      wrap.style.outline = '2px solid #7c3aed'
      wrap.style.outlineOffset = '2px'
      wrap.style.borderRadius = '8px'
      wrap.style.transition = 'outline 0.2s, outline-offset 0.2s'
    } else {
      wrap.style.outline = ''
      wrap.style.outlineOffset = ''
    }
    return () => {
      wrap.style.outline = ''
      wrap.style.outlineOffset = ''
    }
  }, [isOpen])

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

  const insertAsRichText = useCallback(
    (replace: boolean) => {
      if (!result) return
      editor.update(() => {
        const root = $getRoot()
        parseMarkdownToLexical(root, result, replace)
      })
      setResult('')
      setIsOpen(false)
    },
    [editor, result],
  )

  useEffect(() => {
    const el = editor.getRootElement()
    if (!el) return
    const fieldWrap = el.closest('.rich-text-lexical') || el.closest('.field-type.rich-text')
    if (!fieldWrap) return

    const labelRow = fieldWrap.querySelector('.field-label, label')
    if (!labelRow) return

    if (labelRow.querySelector('[data-ai-trigger]')) return

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.setAttribute('data-ai-trigger', 'true')
    btn.title = 'AI Ассистент'
    btn.textContent = '🤖'
    btn.style.cssText =
      'margin-left:6px;padding:2px 6px;font-size:14px;background:none;border:1px solid #d1d5db;' +
      'border-radius:6px;cursor:pointer;vertical-align:middle;line-height:1;transition:all 0.15s;'
    btn.onmouseenter = () => {
      btn.style.borderColor = '#7c3aed'
      btn.style.background = '#f5f3ff'
    }
    btn.onmouseleave = () => {
      btn.style.borderColor = '#d1d5db'
      btn.style.background = 'none'
    }
    btn.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsOpen((prev) => !prev)
    }

    labelRow.appendChild(btn)

    return () => {
      btn.remove()
    }
  }, [editor])

  const panel = isOpen
    ? createPortal(
        <>
          <div style={PANEL_STYLES.overlay} onClick={() => setIsOpen(false)} />
          <div
            style={{
              ...PANEL_STYLES.panel,
              transform: 'translateX(0)',
            }}
          >
            <div style={PANEL_STYLES.header}>
              <span style={PANEL_STYLES.headerTitle}>🤖 AI Ассистент</span>
              <button
                type="button"
                style={PANEL_STYLES.closeBtn}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={PANEL_STYLES.body}>
              <div style={PANEL_STYLES.modesWrap}>
                {modes.map((m) => (
                  <ModeButton
                    key={m.key}
                    m={m}
                    active={mode === m.key}
                    onClick={() => {
                      setMode(m.key)
                      setResult('')
                      setError('')
                    }}
                  />
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
                  style={PANEL_STYLES.textarea}
                  onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                  onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                />
              )}

              {!currentMode?.needsPrompt && mode !== 'generate' && (
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  💡 {currentMode?.desc}. Выделите текст или используется весь контент поля.
                </p>
              )}

              <div style={PANEL_STYLES.actionsRow}>
                <ActionButton
                  label={loading ? '⏳ Генерирую...' : '🚀 Выполнить'}
                  bg="linear-gradient(135deg, #7c3aed, #6d28d9)"
                  onClick={handleGenerate}
                  disabled={loading || (currentMode?.needsPrompt === true && !prompt.trim())}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    color: '#dc2626',
                    fontSize: '13px',
                  }}
                >
                  ❌ {error}
                </div>
              )}

              {result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Результат:</div>
                  <div style={PANEL_STYLES.resultWrap}>{result}</div>
                  <div style={PANEL_STYLES.actionsRow}>
                    {mode !== 'generate' && (
                      <ActionButton label="✅ Заменить" bg="#059669" onClick={() => insertAsRichText(true)} />
                    )}
                    <ActionButton label="➕ Добавить" bg="#2563eb" onClick={() => insertAsRichText(false)} />
                    <ActionButton
                      label="📋 Копировать"
                      bg="#6b7280"
                      onClick={() => navigator.clipboard.writeText(result)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body,
      )
    : null

  return <>{panel}</>
}
