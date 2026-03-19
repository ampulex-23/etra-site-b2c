'use client'

import React, { useState, useCallback } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

const InviteManagerButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const emailField = useFormFields(([fields]) => fields?.email)
  const nameField = useFormFields(([fields]) => fields?.name)
  const roleField = useFormFields(([fields]) => fields?.role)

  const [inviteUrl, setInviteUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const generateInvite = useCallback(async () => {
    setLoading(true)
    setError('')
    setCopied(false)

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id || undefined,
          email: emailField?.value || undefined,
          name: nameField?.value || undefined,
          role: roleField?.value || 'manager',
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to generate invite')
        return
      }

      setInviteUrl(data.inviteUrl)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [id, emailField?.value, nameField?.value, roleField?.value])

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = inviteUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }, [inviteUrl])

  // Only show for saved users (with id) or when email is filled
  if (!id && !emailField?.value) {
    return (
      <div style={{ padding: '12px 0' }}>
        <p style={{ fontSize: '0.85em', opacity: 0.6, margin: 0 }}>
          Сохраните пользователя, чтобы отправить приглашение
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9em' }}>
        Приглашение
      </label>

      {!inviteUrl ? (
        <button
          type="button"
          onClick={generateInvite}
          disabled={loading}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--theme-elevation-150, #333)',
            color: 'var(--theme-elevation-1000, #fff)',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'wait' : 'pointer',
            fontSize: '0.85em',
            fontWeight: 500,
          }}
        >
          {loading ? 'Генерирую...' : 'Сгенерировать ссылку-приглашение'}
        </button>
      ) : (
        <div>
          <div
            style={{
              background: 'var(--theme-elevation-50, #f7f7f7)',
              border: '1px solid var(--theme-elevation-150, #ddd)',
              borderRadius: 4,
              padding: '8px 10px',
              fontSize: '0.75em',
              wordBreak: 'break-all',
              marginBottom: 8,
              maxHeight: 80,
              overflow: 'auto',
            }}
          >
            {inviteUrl}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={copyToClipboard}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: copied
                  ? 'var(--theme-success-500, #22c55e)'
                  : 'var(--theme-elevation-150, #333)',
                color: 'var(--theme-elevation-1000, #fff)',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.85em',
                fontWeight: 500,
                transition: 'background 0.2s',
              }}
            >
              {copied ? 'Скопировано!' : 'Копировать ссылку'}
            </button>
            <button
              type="button"
              onClick={generateInvite}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                color: 'var(--theme-elevation-800, #666)',
                border: '1px solid var(--theme-elevation-150, #ddd)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.85em',
              }}
            >
              Новая
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: '#e53e3e', fontSize: '0.8em', marginTop: 8 }}>
          {error}
        </div>
      )}

      <p style={{ fontSize: '0.75em', opacity: 0.5, margin: '8px 0 0' }}>
        Ссылка действует 7 дней. Пользователь сможет задать пароль.
      </p>
    </div>
  )
}

export default InviteManagerButton
