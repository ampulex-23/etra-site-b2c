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
    let savedGroups: Record<string, boolean> = {}
    try {
      savedGroups = JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}')
    } catch {
      savedGroups = {}
    }
    const savedScroll = Number(localStorage.getItem(SCROLL_KEY) || '0') || 0
    const savedNavClosed = localStorage.getItem(NAV_KEY)

    let scroller: HTMLElement | null = null
    let scrollListenerAttached = false
    let template: Element | null = null
    let templateObserver: MutationObserver | null = null
    const groupObservers = new WeakMap<Element, MutationObserver>()

    const saveGroups = () => {
      const state: Record<string, boolean> = {}
      document.querySelectorAll('.nav-group').forEach((group) => {
        const label = getLabel(group)
        if (!label) return
        state[label] = isGroupCollapsed(group)
      })
      savedGroups = state
      try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(state))
      } catch {}
    }

    const applyGroups = () => {
      document.querySelectorAll('.nav-group').forEach((group) => {
        const label = getLabel(group)
        if (!label) return
        const desired = savedGroups[label]
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

    const attachScroll = () => {
      if (scrollListenerAttached) return
      scroller = findScroller()
      if (!scroller) return
      scroller.scrollTop = savedScroll
      const onScroll = () => {
        if (!scroller) return
        try {
          localStorage.setItem(SCROLL_KEY, String(scroller.scrollTop))
        } catch {}
      }
      scroller.addEventListener('scroll', onScroll, { passive: true })
      scrollListenerAttached = true
    }

    const attachTemplate = () => {
      if (templateObserver) return
      template = document.querySelector('.template-default') || document.body
      if (!template) return
      if (savedNavClosed === 'true') template.classList.add('nav-closed')
      templateObserver = new MutationObserver(() => {
        const isClosed = template!.classList.contains('nav-closed')
        try {
          localStorage.setItem(NAV_KEY, String(isClosed))
        } catch {}
      })
      templateObserver.observe(template, { attributes: true, attributeFilter: ['class'] })
    }

    const tick = () => {
      if (document.querySelectorAll('.nav-group').length > 0) {
        applyGroups()
        attachGroupObservers()
        attachScroll()
        attachTemplate()
      }
    }

    // Первый запуск + наблюдение за изменениями DOM (SPA-переходы).
    tick()
    const bodyObserver = new MutationObserver(() => tick())
    bodyObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      bodyObserver.disconnect()
      templateObserver?.disconnect()
    }
  }, [])

  return null
}

export default SidebarPersistence
