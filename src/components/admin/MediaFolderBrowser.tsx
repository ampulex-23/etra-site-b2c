'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const MediaFolderBrowserContent: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFolder = searchParams.get('folder') || ''
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/media/folders')
      const data = await res.json()
      setFolders(data.folders || [])
    } catch (err) {
      console.error('Failed to fetch folders:', err)
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folder: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (folder) {
      params.set('folder', folder)
    } else {
      params.delete('folder')
    }
    router.push(`/admin/collections/media?${params.toString()}`)
  }

  const createFolder = async () => {
    const folderName = prompt('Введите название папки (например: products/bottles):')
    if (!folderName) return

    const normalized = folderName
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .replace(/\/{2,}/g, '/')
      .toLowerCase()

    if (!normalized) return

    // Add to folders list
    if (!folders.includes(normalized)) {
      setFolders([...folders, normalized].sort())
    }

    // Navigate to new folder
    navigateToFolder(normalized)
  }

  const getBreadcrumbs = () => {
    if (!currentFolder) return []
    const parts = currentFolder.split('/')
    const breadcrumbs: { label: string; path: string }[] = []
    let path = ''
    
    parts.forEach((part, index) => {
      path = index === 0 ? part : `${path}/${part}`
      breadcrumbs.push({ label: part, path })
    })
    
    return breadcrumbs
  }

  const getSubfolders = () => {
    if (!currentFolder) {
      // Root level - show top-level folders
      return folders
        .filter(f => !f.includes('/'))
        .sort()
    }
    
    // Show subfolders of current folder
    const prefix = currentFolder + '/'
    const subfolders = new Set<string>()
    
    folders.forEach(folder => {
      if (folder.startsWith(prefix)) {
        const remainder = folder.substring(prefix.length)
        const nextPart = remainder.split('/')[0]
        if (nextPart) {
          subfolders.add(`${currentFolder}/${nextPart}`)
        }
      }
    })
    
    return Array.from(subfolders).sort()
  }

  if (loading) {
    return <div style={{ padding: '1rem' }}>Загрузка...</div>
  }

  const breadcrumbs = getBreadcrumbs()
  const subfolders = getSubfolders()

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          📁 Навигация по папкам
        </h3>
        <button
          onClick={createFolder}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Создать папку
        </button>
      </div>

      {/* Breadcrumbs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        fontSize: '13px',
      }}>
        <button
          onClick={() => navigateToFolder('')}
          style={{
            padding: '4px 8px',
            background: !currentFolder ? '#e5e7eb' : 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          🏠 Корень
        </button>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            <span style={{ color: '#9ca3af' }}>/</span>
            <button
              onClick={() => navigateToFolder(crumb.path)}
              style={{
                padding: '4px 8px',
                background: index === breadcrumbs.length - 1 ? '#e5e7eb' : 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Subfolders */}
      {subfolders.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '0.5rem',
        }}>
          {subfolders.map(folder => {
            const folderName = folder.split('/').pop() || folder
            return (
              <button
                key={folder}
                onClick={() => navigateToFolder(folder)}
                style={{
                  padding: '8px 12px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📁</span>
                <span>{folderName}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Current folder info */}
      {currentFolder && (
        <div style={{
          marginTop: '1rem',
          padding: '8px 12px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#0369a1',
        }}>
          📂 Текущая папка: <strong>{currentFolder}</strong>
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
            Новые файлы будут загружены в эту папку
          </div>
        </div>
      )}
    </div>
  )
}

export const MediaFolderBrowser: React.FC = () => {
  return (
    <Suspense fallback={<div style={{ padding: '1rem' }}>Загрузка браузера папок...</div>}>
      <MediaFolderBrowserContent />
    </Suspense>
  )
}
