'use client'

import { useEffect } from 'react'

const groupIconMap: Record<string, string> = {
  'Каталог': 'inventory_2',
  'Магазин': 'shopping_cart',
  'Склад': 'warehouse',
  'Контент': 'edit_note',
  'Система': 'settings',
  'Настройки': 'tune',
  'Сайт': 'language',
}

const NavIcons: React.FC = () => {
  useEffect(() => {
    const injectIcons = () => {
      const toggles = document.querySelectorAll('.nav-group__toggle')
      toggles.forEach((toggle) => {
        if (toggle.querySelector('.material-symbols-outlined')) return
        const text = toggle.textContent?.trim() || ''
        const iconName = groupIconMap[text]
        if (iconName) {
          const span = document.createElement('span')
          span.className = 'material-symbols-outlined'
          span.textContent = iconName
          span.style.fontSize = '16px'
          span.style.verticalAlign = 'middle'
          span.style.marginRight = '4px'
          span.style.opacity = '0.7'
          toggle.prepend(span)
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
