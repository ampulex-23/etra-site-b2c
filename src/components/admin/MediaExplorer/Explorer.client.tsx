'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Subfolder = { name: string; path: string }

type MediaDoc = {
  id: string | number
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
  folder?: string | null
  alt?: string | null
  url?: string | null
  thumbnailURL?: string | null
  width?: number | null
  height?: number | null
  sizes?: {
    thumbnail?: { url?: string | null }
    card?: { url?: string | null }
  } | null
  updatedAt?: string
}

type ViewMode = 'grid' | 'list'

const FILES_LIMIT = 200

function normalize(p: string): string {
  return (p || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/{2,}/g, '/')
    .toLowerCase()
}

function parentOf(p: string): string {
  if (!p) return ''
  const idx = p.lastIndexOf('/')
  return idx === -1 ? '' : p.slice(0, idx)
}

function formatSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function iconForMime(mime?: string | null): string {
  if (!mime) return '📄'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.startsWith('video/')) return '🎬'
  if (mime === 'application/pdf') return '📕'
  if (mime.startsWith('audio/')) return '🎵'
  return '📄'
}

const Explorer: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const folder = normalize(searchParams.get('folder') || '')

  const [subfolders, setSubfolders] = useState<Subfolder[]>([])
  const [files, setFiles] = useState<MediaDoc[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [copiedId, setCopiedId] = useState<string | number | null>(null)

  const navigateTo = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const norm = normalize(next)
      if (norm) params.set('folder', norm)
      else params.delete('folder')
      router.push(`/admin/collections/media?${params.toString()}`)
    },
    [router, searchParams],
  )

  const refreshFolders = useCallback(async () => {
    setLoadingFolders(true)
    try {
      const url = new URL('/api/media/folders', window.location.origin)
      if (folder) url.searchParams.set('parent', folder)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const data = await res.json()
      setSubfolders(Array.isArray(data?.subfolders) ? data.subfolders : [])
    } catch (err) {
      console.error('[MediaExplorer] folders fetch failed', err)
      setSubfolders([])
    } finally {
      setLoadingFolders(false)
    }
  }, [folder])

  const refreshFiles = useCallback(async () => {
    setLoadingFiles(true)
    try {
      const where = folder
        ? `where[folder][equals]=${encodeURIComponent(folder)}`
        : `where[or][0][folder][equals]=&where[or][1][folder][exists]=false`
      const url = `/api/media?${where}&limit=${FILES_LIMIT}&depth=0&sort=-updatedAt`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      setFiles(Array.isArray(data?.docs) ? data.docs : [])
    } catch (err) {
      console.error('[MediaExplorer] files fetch failed', err)
      setFiles([])
    } finally {
      setLoadingFiles(false)
    }
  }, [folder])

  useEffect(() => {
    refreshFolders()
    refreshFiles()
  }, [refreshFolders, refreshFiles])

  const breadcrumbs = useMemo(() => {
    if (!folder) return [] as Array<{ label: string; path: string }>
    const parts = folder.split('/')
    const acc: Array<{ label: string; path: string }> = []
    let path = ''
    for (const part of parts) {
      path = path ? `${path}/${part}` : part
      acc.push({ label: part, path })
    }
    return acc
  }, [folder])

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) =>
      [f.filename, f.alt].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [files, search])

  const copyUrl = async (doc: MediaDoc) => {
    if (!doc.url) return
    const full = new URL(doc.url, window.location.origin).href
    try {
      await navigator.clipboard.writeText(full)
      setCopiedId(doc.id)
      window.setTimeout(() => setCopiedId((c) => (c === doc.id ? null : c)), 1500)
    } catch (err) {
      console.error('[MediaExplorer] copy failed', err)
      window.prompt('Скопируй ссылку вручную:', full)
    }
  }

  const createFolder = () => {
    const raw = window.prompt(
      folder
        ? `Создать подпапку в «${folder}». Имя:`
        : 'Имя новой папки (можно вложенное, например products/bottles):',
    )
    if (!raw) return
    const name = normalize(raw)
    if (!name) return
    const next = folder ? `${folder}/${name}` : name
    navigateTo(next)
  }

  const goUp = () => {
    navigateTo(parentOf(folder))
  }

  const uploadHref = folder
    ? `/admin/collections/media/create?folder=${encodeURIComponent(folder)}`
    : `/admin/collections/media/create`

  return (
    <div className="media-explorer">
      {/* Breadcrumbs + actions */}
      <div className="media-explorer__header">
        <div className="media-explorer__crumbs">
          <CrumbButton active={!folder} onClick={() => navigateTo('')}>
            🏠 Корень
          </CrumbButton>
          {breadcrumbs.map((c, i) => (
            <React.Fragment key={c.path}>
              <span className="media-explorer__sep">/</span>
              <CrumbButton
                active={i === breadcrumbs.length - 1}
                onClick={() => navigateTo(c.path)}
              >
                {c.label}
              </CrumbButton>
            </React.Fragment>
          ))}
        </div>
        <div className="media-explorer__actions">
          <a
            href={uploadHref}
            className="media-explorer__btn media-explorer__btn--primary"
          >
            + Загрузить файл
          </a>
          <button
            type="button"
            onClick={createFolder}
            className="media-explorer__btn"
          >
            + Создать папку
          </button>
        </div>
      </div>

      <div className="media-explorer__body">
        {/* Sidebar: parent + subfolders */}
        <aside className="media-explorer__sidebar">
          <div className="media-explorer__sidebar-title">Папки</div>
          <div className="media-explorer__folder-list">
            {folder ? (
              <FolderRow
                icon="⬆️"
                label=".. (на уровень выше)"
                onClick={goUp}
              />
            ) : null}
            {loadingFolders ? (
              <div className="media-explorer__muted">Загрузка…</div>
            ) : subfolders.length === 0 ? (
              <div className="media-explorer__muted">
                {folder ? 'Подпапок нет' : 'Папок нет'}
              </div>
            ) : (
              subfolders.map((sf) => (
                <FolderRow
                  key={sf.path}
                  icon="📁"
                  label={sf.name}
                  onClick={() => navigateTo(sf.path)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Files pane */}
        <section className="media-explorer__files">
          <div className="media-explorer__files-toolbar">
            <div className="media-explorer__current">
              {folder ? (
                <>
                  <span className="media-explorer__muted">Текущая папка:</span>{' '}
                  <strong>{folder}</strong>
                </>
              ) : (
                <strong>Корневая папка</strong>
              )}
              {' · '}
              <span className="media-explorer__muted">
                Файлов: {files.length}
                {files.length >= FILES_LIMIT ? ` (показаны первые ${FILES_LIMIT})` : ''}
              </span>
            </div>
            <div className="media-explorer__toolbar-right">
              <input
                type="search"
                placeholder="Поиск по имени…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="media-explorer__search"
              />
              <div className="media-explorer__view-toggle" role="tablist">
                <button
                  type="button"
                  className={`media-explorer__toggle-btn${viewMode === 'grid' ? ' is-active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Плитка"
                  aria-pressed={viewMode === 'grid'}
                >
                  ▦
                </button>
                <button
                  type="button"
                  className={`media-explorer__toggle-btn${viewMode === 'list' ? ' is-active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="Список"
                  aria-pressed={viewMode === 'list'}
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {loadingFiles ? (
            <div className="media-explorer__muted" style={{ padding: '1rem' }}>
              Загрузка файлов…
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="media-explorer__empty">
              {search ? 'Ничего не найдено' : 'В этой папке пока нет файлов'}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="media-explorer__grid">
              {filteredFiles.map((doc) => (
                <FileCard
                  key={doc.id}
                  doc={doc}
                  copied={copiedId === doc.id}
                  onCopy={() => copyUrl(doc)}
                />
              ))}
            </div>
          ) : (
            <FileTable
              docs={filteredFiles}
              copiedId={copiedId}
              onCopy={(d) => copyUrl(d)}
            />
          )}
        </section>
      </div>

      <Styles />
    </div>
  )
}

export default Explorer

/* ------------------------------ subcomponents ---------------------------- */

const CrumbButton: React.FC<{
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`media-explorer__crumb${active ? ' is-active' : ''}`}
  >
    {children}
  </button>
)

const FolderRow: React.FC<{ icon: string; label: string; onClick: () => void }> = ({
  icon,
  label,
  onClick,
}) => (
  <button type="button" onClick={onClick} className="media-explorer__folder-row">
    <span className="media-explorer__folder-icon">{icon}</span>
    <span className="media-explorer__folder-name">{label}</span>
  </button>
)

const FileCard: React.FC<{
  doc: MediaDoc
  copied: boolean
  onCopy: () => void
}> = ({ doc, copied, onCopy }) => {
  const editHref = `/admin/collections/media/${doc.id}`
  const isImage = (doc.mimeType || '').startsWith('image/')
  const thumb =
    doc.sizes?.thumbnail?.url ||
    doc.thumbnailURL ||
    (isImage ? doc.url : null)

  return (
    <div className="media-explorer__card">
      <a href={editHref} className="media-explorer__thumb" title={doc.filename || ''}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={doc.alt || doc.filename || ''} loading="lazy" />
        ) : (
          <div className="media-explorer__thumb-fallback">
            <div className="media-explorer__thumb-icon">{iconForMime(doc.mimeType)}</div>
            <div className="media-explorer__thumb-mime">
              {(doc.mimeType || '').split('/')[1]?.toUpperCase() || 'FILE'}
            </div>
          </div>
        )}
      </a>
      <div className="media-explorer__card-body">
        <a href={editHref} className="media-explorer__filename" title={doc.filename || ''}>
          {doc.filename || `#${doc.id}`}
        </a>
        <div className="media-explorer__meta">{formatSize(doc.filesize)}</div>
        <div className="media-explorer__card-actions">
          <button
            type="button"
            onClick={onCopy}
            className="media-explorer__btn media-explorer__btn--sm"
            title="Скопировать полную URL"
          >
            {copied ? '✔ Скопировано' : '📋 Скопировать URL'}
          </button>
          {doc.url ? (
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="media-explorer__btn media-explorer__btn--sm"
              title="Открыть файл"
            >
              ↗ Открыть
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const FileTable: React.FC<{
  docs: MediaDoc[]
  copiedId: string | number | null
  onCopy: (doc: MediaDoc) => void
}> = ({ docs, copiedId, onCopy }) => {
  return (
    <div className="media-explorer__table-wrap">
      <table className="media-explorer__table">
        <thead>
          <tr>
            <th style={{ width: 44 }}></th>
            <th>Файл</th>
            <th style={{ width: 110 }}>Размер</th>
            <th style={{ width: 140 }}>Тип</th>
            <th style={{ width: 220 }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const editHref = `/admin/collections/media/${doc.id}`
            const isImage = (doc.mimeType || '').startsWith('image/')
            const thumb =
              doc.sizes?.thumbnail?.url ||
              doc.thumbnailURL ||
              (isImage ? doc.url : null)
            return (
              <tr key={doc.id}>
                <td>
                  <a href={editHref} className="media-explorer__row-thumb">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" loading="lazy" />
                    ) : (
                      <span className="media-explorer__row-icon">
                        {iconForMime(doc.mimeType)}
                      </span>
                    )}
                  </a>
                </td>
                <td>
                  <a href={editHref} className="media-explorer__filename">
                    {doc.filename || `#${doc.id}`}
                  </a>
                  {doc.alt ? (
                    <div className="media-explorer__meta">{doc.alt}</div>
                  ) : null}
                </td>
                <td className="media-explorer__muted">{formatSize(doc.filesize)}</td>
                <td className="media-explorer__muted">{doc.mimeType || '—'}</td>
                <td>
                  <div className="media-explorer__row-actions">
                    <button
                      type="button"
                      onClick={() => onCopy(doc)}
                      className="media-explorer__btn media-explorer__btn--sm"
                    >
                      {copiedId === doc.id ? '✔ Скопировано' : '📋 URL'}
                    </button>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="media-explorer__btn media-explorer__btn--sm"
                      >
                        ↗ Открыть
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------- styles ---------------------------------- */

const Styles: React.FC = () => (
  <style
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
      __html: `
.media-explorer { font-family: inherit; color: var(--theme-text, #111); }
.media-explorer__header {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding-bottom: 1rem; border-bottom: 1px solid var(--theme-elevation-100, #e5e7eb);
  flex-wrap: wrap; padding-top: 1rem;
}
.media-explorer__crumbs { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.media-explorer__sep { color: var(--theme-elevation-400, #9ca3af); }
.media-explorer__crumb {
  padding: 4px 10px; border-radius: 6px; font-size: 13px;
  background: transparent; border: 1px solid transparent; cursor: pointer; color: inherit;
}
.media-explorer__crumb:hover { background: var(--theme-elevation-50, #f3f4f6); }
.media-explorer__crumb.is-active { background: var(--theme-elevation-100, #e5e7eb); font-weight: 600; }
.media-explorer__actions { display: flex; gap: 0.5rem; }
.media-explorer__btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 6px 12px; font-size: 13px; background: var(--theme-elevation-50, #f3f4f6);
  color: inherit; border: 1px solid var(--theme-elevation-150, #e5e7eb);
  border-radius: 6px; cursor: pointer; text-decoration: none; line-height: 1.2;
}
.media-explorer__btn:hover { background: var(--theme-elevation-100, #e5e7eb); }
.media-explorer__btn--primary {
  background: var(--theme-success-500, #22c55e); color: #fff;
  border-color: var(--theme-success-500, #22c55e);
}
.media-explorer__btn--primary:hover { filter: brightness(0.95); }
.media-explorer__btn--sm { padding: 4px 8px; font-size: 12px; }

.media-explorer__body {
  display: grid; grid-template-columns: 240px 1fr; gap: 1rem; margin-top: 1rem;
}
@media (max-width: 900px) { .media-explorer__body { grid-template-columns: 1fr; } }

.media-explorer__sidebar {
  border: 1px solid var(--theme-elevation-100, #e5e7eb); border-radius: 8px;
  padding: 0.75rem; align-self: flex-start; background: var(--theme-elevation-0, #fff);
}
.media-explorer__sidebar-title {
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em;
  color: var(--theme-elevation-500, #6b7280); margin-bottom: 0.5rem;
}
.media-explorer__folder-list { display: flex; flex-direction: column; gap: 2px; }
.media-explorer__folder-row {
  display: flex; align-items: center; gap: 8px; text-align: left;
  padding: 6px 8px; border-radius: 6px; background: transparent; border: none;
  color: inherit; cursor: pointer; font-size: 13px;
}
.media-explorer__folder-row:hover { background: var(--theme-elevation-50, #f3f4f6); }
.media-explorer__folder-icon { width: 18px; text-align: center; }
.media-explorer__folder-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.media-explorer__files {
  border: 1px solid var(--theme-elevation-100, #e5e7eb); border-radius: 8px;
  background: var(--theme-elevation-0, #fff); overflow: hidden;
}
.media-explorer__files-toolbar {
  display: flex; justify-content: space-between; align-items: center; gap: 1rem;
  padding: 0.75rem 1rem; border-bottom: 1px solid var(--theme-elevation-100, #e5e7eb);
  flex-wrap: wrap;
}
.media-explorer__current { font-size: 13px; }
.media-explorer__muted { color: var(--theme-elevation-500, #6b7280); font-size: 12px; }
.media-explorer__toolbar-right { display: flex; gap: 0.5rem; align-items: center; }
.media-explorer__search {
  padding: 6px 10px; font-size: 13px;
  border: 1px solid var(--theme-elevation-150, #e5e7eb); border-radius: 6px;
  background: var(--theme-input-bg, #fff); color: inherit; min-width: 200px;
}
.media-explorer__view-toggle {
  display: inline-flex; border: 1px solid var(--theme-elevation-150, #e5e7eb);
  border-radius: 6px; overflow: hidden;
}
.media-explorer__toggle-btn {
  padding: 4px 10px; font-size: 14px; background: transparent;
  border: none; cursor: pointer; color: inherit;
}
.media-explorer__toggle-btn.is-active {
  background: var(--theme-elevation-100, #e5e7eb); font-weight: 600;
}

.media-explorer__empty {
  padding: 3rem 1rem; text-align: center;
  color: var(--theme-elevation-500, #6b7280); font-size: 14px;
}

/* Grid */
.media-explorer__grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem; padding: 0.75rem;
}
.media-explorer__card {
  border: 1px solid var(--theme-elevation-100, #e5e7eb); border-radius: 8px;
  overflow: hidden; background: var(--theme-elevation-0, #fff); display: flex; flex-direction: column;
}
.media-explorer__thumb {
  display: block; aspect-ratio: 1 / 1; background: var(--theme-elevation-50, #f3f4f6);
  overflow: hidden;
}
.media-explorer__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.media-explorer__thumb-fallback {
  width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.25rem;
}
.media-explorer__thumb-icon { font-size: 2.5rem; }
.media-explorer__thumb-mime {
  font-size: 11px; color: var(--theme-elevation-500, #6b7280); letter-spacing: 0.05em;
}
.media-explorer__card-body { padding: 0.5rem 0.75rem 0.75rem; display: flex; flex-direction: column; gap: 4px; }
.media-explorer__filename {
  font-size: 13px; font-weight: 500; color: inherit; text-decoration: none;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;
}
.media-explorer__filename:hover { text-decoration: underline; }
.media-explorer__meta { font-size: 11px; color: var(--theme-elevation-500, #6b7280); }
.media-explorer__card-actions { display: flex; gap: 4px; margin-top: 0.25rem; flex-wrap: wrap; }

/* List */
.media-explorer__table-wrap { overflow-x: auto; }
.media-explorer__table { width: 100%; border-collapse: collapse; font-size: 13px; }
.media-explorer__table th, .media-explorer__table td {
  padding: 8px 12px; text-align: left;
  border-bottom: 1px solid var(--theme-elevation-100, #e5e7eb); vertical-align: middle;
}
.media-explorer__table th {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em;
  color: var(--theme-elevation-500, #6b7280); font-weight: 500;
}
.media-explorer__row-thumb {
  display: inline-block; width: 36px; height: 36px; border-radius: 4px; overflow: hidden;
  background: var(--theme-elevation-50, #f3f4f6);
}
.media-explorer__row-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.media-explorer__row-icon {
  display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 18px;
}
.media-explorer__row-actions { display: flex; gap: 4px; }
`,
    }}
  />
)
