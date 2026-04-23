'use client'

import { useEffect, useState } from 'react'

type TitleMap = Record<string, string>

const caches = new Map<string, TitleMap>()
const inflight = new Map<string, Promise<TitleMap>>()
const listeners = new Map<string, Set<() => void>>()

const getCache = (collection: string): TitleMap => {
  let c = caches.get(collection)
  if (!c) {
    c = {}
    caches.set(collection, c)
  }
  return c
}

const notify = (collection: string) => {
  const set = listeners.get(collection)
  if (set) set.forEach((fn) => fn())
}

const extractLabel = (doc: any): string => {
  if (!doc || typeof doc !== 'object') return ''
  return (
    doc.title ||
    doc.name ||
    doc.username ||
    doc.email ||
    (doc.id !== undefined ? String(doc.id) : '')
  )
}

const fetchMissing = async (collection: string, ids: string[]): Promise<void> => {
  if (ids.length === 0) return
  const key = `${collection}:${ids.slice().sort().join(',')}`
  if (inflight.has(key)) {
    await inflight.get(key)
    return
  }
  const p = (async () => {
    const qs = new URLSearchParams()
    qs.set('limit', String(Math.max(ids.length, 25)))
    qs.set('depth', '0')
    ids.forEach((id) => qs.append('where[id][in][]', id))
    const res = await fetch(`/api/${collection}?${qs.toString()}`, {
      credentials: 'include',
    })
    const map = getCache(collection)
    if (res.ok) {
      const data = await res.json()
      const docs: any[] = Array.isArray(data?.docs) ? data.docs : []
      docs.forEach((d) => {
        if (d?.id !== undefined) map[String(d.id)] = extractLabel(d)
      })
      // Mark missing ids so we don't refetch on every render
      ids.forEach((id) => {
        if (!(id in map)) map[id] = ''
      })
    } else {
      ids.forEach((id) => { map[id] = '' })
    }
    return map
  })()
  inflight.set(key, p)
  try {
    await p
  } finally {
    inflight.delete(key)
    notify(collection)
  }
}

export function useRelationshipTitles(
  collection: string,
  ids: Array<string | number | null | undefined>,
): Record<string, string> {
  const cache = getCache(collection)
  const [, setTick] = useState(0)

  useEffect(() => {
    // Subscribe
    let set = listeners.get(collection)
    if (!set) {
      set = new Set()
      listeners.set(collection, set)
    }
    const listener = () => setTick((n) => n + 1)
    set.add(listener)

    const missing = Array.from(
      new Set(
        ids
          .filter((id): id is string | number => id !== null && id !== undefined && id !== '')
          .map((id) => String(id))
          .filter((id) => !(id in cache)),
      ),
    )
    if (missing.length > 0) {
      void fetchMissing(collection, missing)
    }

    return () => {
      set?.delete(listener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, ids.join(',')])

  return cache
}
