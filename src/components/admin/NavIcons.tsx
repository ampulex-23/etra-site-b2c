'use client'

import { useEffect } from 'react'

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'

const groupIconMap: Record<string, string> = {
  'Каталог': 'inventory_2',
  'Магазин': 'shopping_cart',
  'Склад': 'warehouse',
  'Контент': 'edit_note',
  'Система': 'settings',
  'Настройки': 'tune',
  'Сайт': 'language',
  'Рефералка': 'redeem',
}

function ensureFontLoaded() {
  if (document.querySelector('link[data-msi]')) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = FONT_URL
  link.setAttribute('data-msi', '1')
  document.head.appendChild(link)
}

function getGroupText(toggle: Element): string {
  let text = ''
  toggle.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent
    }
  })
  return text.trim()
}

const NavIcons: React.FC = () => {
  useEffect(() => {
    ensureFontLoaded()

    const injectIcons = () => {
      const toggles = document.querySelectorAll('.nav-group__toggle')
      toggles.forEach((toggle) => {
        if (toggle.querySelector('.material-symbols-outlined')) return
        const labelEl = toggle.querySelector('.nav-group__label')
        if (!labelEl) return
        const text = labelEl.textContent?.trim() || ''
        const iconName = groupIconMap[text]
        if (iconName) {
          const span = document.createElement('span')
          span.className = 'material-symbols-outlined'
          span.textContent = iconName
          span.style.fontSize = '18px'
          span.style.verticalAlign = 'middle'
          span.style.marginRight = '0px'
          span.style.opacity = '0.7'
          toggle.insertBefore(span, labelEl)
        }
      })
    }

    injectIcons()
    const observer = new MutationObserver(injectIcons)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}

export default NavIcons
