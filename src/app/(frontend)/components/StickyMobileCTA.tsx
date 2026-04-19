'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // show after hero
      setVisible(window.scrollY > window.innerHeight * 0.6)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Link
      href="/catalog"
      className={`sticky-cta ${visible ? 'sticky-cta--visible' : ''}`}
      aria-label="Перейти в каталог"
    >
      <ShoppingBag size={20} strokeWidth={2} />
      <span>Купить напитки</span>
    </Link>
  )
}
