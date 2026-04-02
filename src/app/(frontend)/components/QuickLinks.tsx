'use client'

import Link from 'next/link'
import { Sparkles, MapPin, Leaf } from 'lucide-react'

const links = [
  {
    id: 1,
    title: 'НОВИНКИ',
    href: '/catalog?filter=new',
    icon: Sparkles,
  },
  {
    id: 2,
    title: 'МЕСТА',
    href: '/locations',
    icon: MapPin,
  },
  {
    id: 3,
    title: 'КУРСЫ',
    href: '/retreat',
    icon: Leaf,
  },
]

export function QuickLinks() {
  return (
    <div className="quick-links">
      <div className="quick-links__container">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.id}
              href={link.href}
              className="quick-link"
            >
              <Icon className="quick-link__icon" />
              <h3 className="quick-link__title">{link.title}</h3>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
