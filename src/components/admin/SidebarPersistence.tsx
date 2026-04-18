'use client'

import { useEffect } from 'react'

/**
 * Независимая от Payload persistence сайдбара.
 *
 * Payload из коробки имеет баг: setPreference в NavGroup отправляет preferences
 * только для одной кликнутой группы, а не всех. Это работает для одиночных
 * изменений (благодаря deepMerge на сервере), но ломается при SPA-навигации /
 * быстрых кликах. Плюс Payload не персистит scrollTop.
 *
 * Наш подход: полностью контролируем UI через собственный data-атрибут
 * `data-etra-collapsed` + глобальный CSS. Это переживает любые re-render'ы
 * Payload, т.к. при появлении новой .nav-group мы сразу проставляем атрибут
 * до того, как Payload успеет что-то нарисовать.
 */

const SCROLL_KEY = 'etra-sidebar-scroll'
const GROUPS_KEY = 'etra-sidebar-groups' // { [label]: true (collapsed) | false }
const NAV_KEY = 'etra-sidebar-nav-closed'
const STYLE_ID = 'etra-sidebar-style'
const LOG_PREFIX = '[SidebarPersistence]'

const CSS = `
.nav-group[data-etra-collapsed="true"] .nav-group__content { display: none !important; }
.nav-group[data-etra-collapsed="true"] > div:not(.nav-group__toggle):not(button) {
  height: 0 !important;
  overflow: hidden !important;
}
.nav-group[data-etra-collapsed="false"] .nav-group__content { display: block !important; }
.nav-group[data-etra-collapsed="false"] > div:not(.nav-group__toggle):not(button) {
  height: auto !important;
  overflow: visible !important;
}
.nav-group[data-etra-collapsed="true"] .nav-group__toggle .nav-group__indicator svg {
  transform: rotate(180deg);
}
`

function readGroups(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeGroups(state: Record<string, boolean>) {
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(state))
  } catch {}
}

function readScroll(): number {
  return Number(localStorage.getItem(SCROLL_KEY) || '0') || 0
}

function writeScroll(v: number) {
  try {
    localStorage.setItem(SCROLL_KEY, String(v))
  } catch {}
}

function getLabel(group: Element): string {
  const labelEl = group.querySelector('.nav-group__label')
  return labelEl?.textContent?.trim() || ''
}

function findScroller(): HTMLElement | null {
  return (
    (document.querySelector('.nav__scroll') as HTMLElement | null) ||
    (document.querySelector('.nav-wrapper') as HTMLElement | null) ||
    (document.querySelector('aside.nav') as HTMLElement | null) ||
    (document.querySelector('nav.nav') as HTMLElement | null)
  )
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

export function SidebarPersistence() {
  useEffect(() => {
    ensureStyle()

    let scroller: HTMLElement | null = null
    let scrollFn: ((e: Event) => void) | null = null
    let templateObserver: MutationObserver | null = null

    const applyToGroup = (group: Element) => {
      const label = getLabel(group)
      if (!label) return
      const saved = readGroups()
      const desired = saved[label]
      if (desired === undefined) return
      group.setAttribute('data-etra-collapsed', String(desired))
    }

    const applyAllGroups = () => {
      document.querySelectorAll('.nav-group').forEach(applyToGroup)
    }

    const saveCurrentState = () => {
      const state = readGroups()
      document.querySelectorAll('.nav-group').forEach((group) => {
        const label = getLabel(group)
        if (!label) return
        // Если группа уже имеет наш data-атрибут — берём его как источник истины;
        // иначе читаем Payload'овский класс.
        const attr = group.getAttribute('data-etra-collapsed')
        if (attr === 'true' || attr === 'false') {
          state[label] = attr === 'true'
        } else {
          state[label] = group.classList.contains('nav-group--collapsed')
        }
      })
      writeGroups(state)
    }

    // Перехватываем клики по toggle в capture-фазе, ДО того как React (Payload)
    // получит event. Полностью блокируем Payload'овский обработчик, чтобы его
    // внутренний `collapsed` state не рассинхронизировался с нашим data-атрибутом
    // (и чтобы его баговый setPreference не перезаписывал наши preferences).
    const onClickCapture = (e: Event) => {
      const target = e.target as Element | null
      if (!target) return
      const toggle = target.closest('.nav-group__toggle') as HTMLElement | null
      if (!toggle) return
      const group = toggle.closest('.nav-group') as HTMLElement | null
      if (!group) return
      const label = getLabel(group)
      if (!label) return
      e.preventDefault()
      e.stopPropagation()
      ;(e as any).stopImmediatePropagation?.()
      const wasCollapsed = group.getAttribute('data-etra-collapsed') === 'true'
      const nextCollapsed = !wasCollapsed
      group.setAttribute('data-etra-collapsed', String(nextCollapsed))
      const state = readGroups()
      state[label] = nextCollapsed
      writeGroups(state)
    }
    document.addEventListener('click', onClickCapture, true)

    const ensureScroll = () => {
      const current = findScroller()
      if (!current) return
      const saved = readScroll()
      if (current !== scroller) {
        if (scroller && scrollFn) scroller.removeEventListener('scroll', scrollFn)
        scroller = current
        scrollFn = () => {
          if (!scroller) return
          const v = scroller.scrollTop
          if (v === 0 && readScroll() > 0) return
          writeScroll(v)
        }
        scroller.addEventListener('scroll', scrollFn, { passive: true })
        if (saved > 0) scroller.scrollTop = saved
      } else if (saved > 0 && current.scrollTop === 0) {
        current.scrollTop = saved
      }
    }

    const attachTemplate = () => {
      if (templateObserver) return
      const template =
        (document.querySelector('.template-default') as HTMLElement | null) || document.body
      if (!template) return
      if (localStorage.getItem(NAV_KEY) === 'true') template.classList.add('nav-closed')
      templateObserver = new MutationObserver(() => {
        try {
          localStorage.setItem(NAV_KEY, String(template.classList.contains('nav-closed')))
        } catch {}
      })
      templateObserver.observe(template, { attributes: true, attributeFilter: ['class'] })
    }

    const tick = () => {
      const groups = document.querySelectorAll('.nav-group')
      if (groups.length === 0) return
      applyAllGroups()
      ensureScroll()
      attachTemplate()
    }

    // Первичное применение + наблюдатель за появлением новых .nav-group
    // (Payload может re-render'ить сайдбар после hydration / SPA).
    tick()
    const bodyObserver = new MutationObserver((mutations) => {
      let needsTick = false
      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if (!(node instanceof Element)) continue
          if (node.matches?.('.nav-group') || node.querySelector?.('.nav-group')) {
            needsTick = true
            break
          }
        }
        if (needsTick) break
      }
      if (needsTick) tick()
      else {
        // Также следим за случаем, когда тот же .nav-wrapper получил scrollTop=0
        ensureScroll()
      }
    })
    bodyObserver.observe(document.body, { childList: true, subtree: true })

    const onBeforeUnload = () => {
      if (scroller) writeScroll(scroller.scrollTop)
      saveCurrentState()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onBeforeUnload)

    // Диагностика (просмотр в devtools): этот компонент действительно смонтирован.
    // eslint-disable-next-line no-console
    console.debug(LOG_PREFIX, 'mounted', {
      groups: document.querySelectorAll('.nav-group').length,
      savedGroups: readGroups(),
      savedScroll: readScroll(),
    })

    return () => {
      bodyObserver.disconnect()
      templateObserver?.disconnect()
      document.removeEventListener('click', onClickCapture, true)
      if (scroller && scrollFn) scroller.removeEventListener('scroll', scrollFn)
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onBeforeUnload)
    }
  }, [])

  return null
}

export default SidebarPersistence
