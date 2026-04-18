'use client'

import { useEffect } from 'react'

/**
 * Персистит состояние сайдбара админки Payload в localStorage:
 *  1. Прокрутка навигации (scrollTop)
 *  2. Свёрнутость/развёрнутость каждой группы по её label
 *  3. Общее свёрнутое состояние (.nav-closed)
 */
const SCROLL_KEY = 'etra-sidebar-scroll'
const GROUPS_KEY = 'etra-sidebar-groups'
const NAV_KEY = 'etra-sidebar-nav-closed'

function getLabel(group: Element): string {
  const toggle = group.querySelector('.nav-group__toggle')
  if (!toggle) return ''
  let text = ''
  toggle.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent
  })
  const t = text.trim()
  if (t) return t
  return toggle.querySelector('.nav-group__label')?.textContent?.trim() || ''
}

function isGroupCollapsed(group: Element): boolean {
  const toggle = group.querySelector('.nav-group__toggle')
  if (toggle?.getAttribute('aria-expanded') === 'false') return true
  return (
    group.classList.contains('nav-group--collapsed') ||
    group.classList.contains('nav-group--is-collapsed') ||
    toggle?.classList.contains('nav-group__toggle--collapsed') === true
  )
}

function findScroller(): HTMLElement | null {
  return (
    (document.querySelector('.nav__scroll') as HTMLElement | null) ||
    (document.querySelector('.nav-wrapper') as HTMLElement | null) ||
    (document.querySelector('aside.nav') as HTMLElement | null) ||
    (document.querySelector('nav.nav') as HTMLElement | null)
  )
}

export function SidebarPersistence() {
  useEffect(() => {
    const readGroups = (): Record<string, boolean> => {
      try {
        return JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}')
      } catch {
        return {}
      }
    }
    const readScroll = (): number => Number(localStorage.getItem(SCROLL_KEY) || '0') || 0
    const writeScroll = (v: number) => {
      try {
        localStorage.setItem(SCROLL_KEY, String(v))
      } catch {}
    }
    const writeGroups = (state: Record<string, boolean>) => {
      try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(state))
      } catch {}
    }

    let currentScroller: HTMLElement | null = null
    let currentScrollFn: ((e: Event) => void) | null = null
    let templateObserver: MutationObserver | null = null
    const groupObservers = new WeakMap<Element, MutationObserver>()
    const appliedGroups = new WeakSet<Element>()

    const saveGroups = () => {
      // Объединяем текущее DOM-состояние с уже сохранённым:
      // так мы компенсируем баг Payload, который перезаписывает groups только одной кликнутой группой.
      const prev = readGroups()
      const state: Record<string, boolean> = { ...prev }
      document.querySelectorAll('.nav-group').forEach((group) => {
        const label = getLabel(group)
        if (!label) return
        state[label] = isGroupCollapsed(group)
      })
      writeGroups(state)
    }

    const applyGroups = () => {
      const saved = readGroups()
      if (!Object.keys(saved).length) return
      document.querySelectorAll('.nav-group').forEach((group) => {
        if (appliedGroups.has(group)) return
        const label = getLabel(group)
        if (!label) return
        appliedGroups.add(group)
        const desired = saved[label]
        if (desired === undefined) return
        const current = isGroupCollapsed(group)
        if (desired !== current) {
          const toggle = group.querySelector('.nav-group__toggle') as HTMLElement | null
          toggle?.click()
        }
      })
    }

    const attachGroupObservers = () => {
      document.querySelectorAll('.nav-group').forEach((group) => {
        if (groupObservers.has(group)) return
        const mo = new MutationObserver(() => saveGroups())
        mo.observe(group, { attributes: true, attributeFilter: ['class'] })
        const toggle = group.querySelector('.nav-group__toggle')
        if (toggle) {
          mo.observe(toggle, { attributes: true, attributeFilter: ['aria-expanded', 'class'] })
        }
        groupObservers.set(group, mo)
      })
    }

    const ensureScroll = () => {
      const scroller = findScroller()
      if (!scroller) return
      const saved = readScroll()
      if (scroller !== currentScroller) {
        if (currentScroller && currentScrollFn) {
          currentScroller.removeEventListener('scroll', currentScrollFn)
        }
        currentScroller = scroller
        const fn = () => {
          if (!currentScroller) return
          const v = currentScroller.scrollTop
          // Не перезаписываем сохранённое значение нулём, если раньше было значение:
          // так мы защищаемся от сброса scrollTop=0 при SPA-перерендере Payload.
          if (v === 0 && readScroll() > 0) return
          writeScroll(v)
        }
        currentScrollFn = fn
        scroller.addEventListener('scroll', fn, { passive: true })
        if (saved > 0) scroller.scrollTop = saved
      } else if (saved > 0 && scroller.scrollTop === 0) {
        // Тот же скроллер, но Payload сбросил scrollTop: восстанавливаем.
        scroller.scrollTop = saved
      }
    }

    const attachTemplate = () => {
      if (templateObserver) return
      const template = (document.querySelector('.template-default') as HTMLElement | null) || document.body
      if (!template) return
      const savedNavClosed = localStorage.getItem(NAV_KEY)
      if (savedNavClosed === 'true') template.classList.add('nav-closed')
      templateObserver = new MutationObserver(() => {
        try {
          localStorage.setItem(NAV_KEY, String(template.classList.contains('nav-closed')))
        } catch {}
      })
      templateObserver.observe(template, { attributes: true, attributeFilter: ['class'] })
    }

    const tick = () => {
      if (document.querySelectorAll('.nav-group').length > 0) {
        applyGroups()
        attachGroupObservers()
        ensureScroll()
        attachTemplate()
      }
    }

    tick()
    const bodyObserver = new MutationObserver(() => tick())
    bodyObserver.observe(document.body, { childList: true, subtree: true })

    // Перед выгрузкой страницы зафиксировать текущий scrollTop (на случай жёсткой навигации).
    const onBeforeUnload = () => {
      if (currentScroller) writeScroll(currentScroller.scrollTop)
      saveGroups()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onBeforeUnload)

    return () => {
      bodyObserver.disconnect()
      templateObserver?.disconnect()
      if (currentScroller && currentScrollFn) {
        currentScroller.removeEventListener('scroll', currentScrollFn)
      }
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onBeforeUnload)
    }
  }, [])

  return null
}

export default SidebarPersistence
