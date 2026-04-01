'use client'

import { useEffect } from 'react'

/**
 * Saves Payload admin sidebar state to localStorage
 * Restores it on page load
 */
export function SidebarPersistence() {
  useEffect(() => {
    const STORAGE_KEY = 'payload-sidebar-collapsed'

    // Wait for Payload to render
    const checkSidebar = () => {
      const navToggler = document.querySelector('.nav-toggler') as HTMLButtonElement
      const template = document.querySelector('.template-default')

      if (!navToggler || !template) {
        setTimeout(checkSidebar, 100)
        return
      }

      // Restore saved state
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState === 'true') {
        template.classList.add('nav-closed')
      } else if (savedState === 'false') {
        template.classList.remove('nav-closed')
      }

      // Save state on toggle
      const observer = new MutationObserver(() => {
        const isCollapsed = template.classList.contains('nav-closed')
        localStorage.setItem(STORAGE_KEY, String(isCollapsed))
      })

      observer.observe(template, {
        attributes: true,
        attributeFilter: ['class'],
      })

      // Cleanup
      return () => observer.disconnect()
    }

    checkSidebar()
  }, [])

  return null
}
