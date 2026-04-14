'use client'

import { useEffect } from 'react'

export function ParallaxBackground() {
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      const parallaxSpeed = 0.3
      const yPos = scrolled * parallaxSpeed
      document.body.style.backgroundPosition = `center ${yPos}px`
    }

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll)
    handleScroll() // Initial position

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
